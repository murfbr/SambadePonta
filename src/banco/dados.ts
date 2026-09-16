/* Estado central do site: as nove coleções do Painel, os rascunhos do Simulador
   e as três coleções do Contexto, sempre em dia com o banco (ou o localStorage).
   Os componentes leem tudo pelo hook `usarCentral()` e mudam dados pelas funções
   daqui — nunca escrevendo no Firestore diretamente.

   Semeadura: na primeira abertura com o banco vazio, entra o conteúdo de
   src/dados/semente-*.json (o estado real do artefato em setembro/2026). */
import { useSyncExternalStore } from "react";
import { Banco } from "./banco";
import { clonar, uid, baixarArquivo } from "../util";
import {
  COLECOES_PAINEL, type Candidatura, type ColecaoPainel, type DadosPainel,
  type Ficha, type Julgamento, type Rascunho, type Regra,
} from "../tipos";
import { FORMULARIOS, registroDe } from "../dados/estaticos";
import { campos as camposDe, linhaVazia, normalizarRascunho, novoRascunho } from "../ambientes/simulador/motor";
import sementePainel from "../dados/semente-painel.json";
import sementeContexto from "../dados/semente-contexto.json";
import { SALIC_DADOS } from "../dados/estaticos";

/** Tudo o que o site mostra, num objeto só. */
export interface EstadoCentral {
  /** true quando as 13 coleções já responderam (do servidor ou do modo local). */
  pronto: boolean;
  painel: DadosPainel;
  rascunhos: Record<string, Rascunho>;
  fichas: Record<string, Ficha>;
  regras: Record<string, Regra>;
  julgamentos: Record<string, Julgamento>;
}

let estado: EstadoCentral = {
  pronto: false,
  painel: { artistas: [], projetos: [], editais: [], candidaturas: [], tarefas: [], equipe: [], elenco: [], contatos: [], reunioes: [] },
  rascunhos: {}, fichas: {}, regras: {}, julgamentos: {},
};

const assinantes = new Set<() => void>();
function publicar() {
  estado = { ...estado };
  assinantes.forEach((f) => f());
}

export const obterEstado = () => estado;

/** Hook: qualquer componente que use isso re-renderiza quando os dados mudam. */
export function usarCentral(): EstadoCentral {
  return useSyncExternalStore(
    (cb) => { assinantes.add(cb); return () => assinantes.delete(cb); },
    obterEstado,
  );
}

/* ══════════ inicialização e semeadura ══════════ */

const ordenado = <T,>(mapa: Record<string, unknown>): T[] =>
  (Object.values(mapa) as (T & { _ord?: number })[])
    .sort((a, b) => (a._ord || 0) - (b._ord || 0));

const confirmadas = new Set<string>();
let semeouPainel = false;
let semeouContexto = false;
let iniciado = false;

/** Liga as 13 coleções. Chamar uma vez, depois do login (ou direto no modo local). */
export function iniciarDados() {
  if (iniciado) return;
  iniciado = true;

  for (const colecao of COLECOES_PAINEL) {
    Banco.assinar(colecao, (mapa, confirmado) => {
      estado.painel = { ...estado.painel, [colecao]: ordenado(mapa) } as DadosPainel;
      aoConfirmar(colecao, confirmado);
      publicar();
    });
  }
  Banco.assinar("rascunhos", (mapa, confirmado) => {
    estado.rascunhos = mapa as unknown as Record<string, Rascunho>;
    aoConfirmar("rascunhos", confirmado);
    publicar();
  });
  for (const colecao of ["fichas", "regras", "julgamentos"] as const) {
    Banco.assinar(colecao, (mapa, confirmado) => {
      (estado as unknown as Record<string, unknown>)[colecao] = mapa;
      aoConfirmar(colecao, confirmado);
      publicar();
    });
  }
}

function aoConfirmar(colecao: string, confirmado: boolean) {
  if (!confirmado) return;
  confirmadas.add(colecao);
  estado.pronto = confirmadas.size >= COLECOES_PAINEL.length + 4;

  // Painel vazio nas 9 coleções confirmadas → primeira abertura: semeia.
  if (!semeouPainel && COLECOES_PAINEL.every((c) => confirmadas.has(c))
    && COLECOES_PAINEL.every((c) => estado.painel[c].length === 0)) {
    semeouPainel = true;
    const semente = clonar(sementePainel) as unknown as DadosPainel;
    for (const c of COLECOES_PAINEL) {
      (semente[c] || []).forEach((registro, i) => {
        registro._ord = i;
        registro.atualizado = new Date().toISOString();
        Banco.gravar(c, registro.id, registro as unknown as Record<string, unknown> & { id: string }, true);
      });
    }
  }

  // Contexto vazio nas 3 coleções → semeia fichas, regras e julgamentos.
  if (!semeouContexto && ["fichas", "regras", "julgamentos"].every((c) => confirmadas.has(c))
    && !Object.keys(estado.fichas).length && !Object.keys(estado.regras).length) {
    semeouContexto = true;
    const s = clonar(sementeContexto) as unknown as {
      fichas: Record<string, Ficha>; regras: Record<string, Regra>; julg: Record<string, Julgamento>;
    };
    Object.values(s.fichas || {}).forEach((d) => Banco.gravar("fichas", d.id, d as unknown as Record<string, unknown> & { id: string }, true));
    Object.values(s.regras || {}).forEach((d) => Banco.gravar("regras", d.id, d as unknown as Record<string, unknown> & { id: string }, true));
    Object.values(s.julg || {}).forEach((d) => Banco.gravar("julgamentos", d.id, d as unknown as Record<string, unknown> & { id: string }, true));
  }
}

/* ══════════ mutações do Painel ══════════ */

type RegistroPainel = DadosPainel[ColecaoPainel][number];

/** Cria ou atualiza um registro do Painel. Novo registro entra no fim da lista. */
export function salvarRegistro(colecao: ColecaoPainel, registro: RegistroPainel, rapido = true) {
  const r = clonar(registro) as RegistroPainel;
  const existente = estado.painel[colecao].find((x) => x.id === r.id);
  r._ord = existente ? existente._ord : maiorOrd(colecao) + 1;
  r.atualizado = new Date().toISOString();
  Banco.gravar(colecao, r.id, r as unknown as Record<string, unknown> & { id: string }, rapido);
}

const maiorOrd = (colecao: ColecaoPainel) =>
  estado.painel[colecao].reduce((m, x) => Math.max(m, x._ord || 0), -1);

/** Exclui um registro. Excluir candidatura também limpa as tarefas ligadas a ela. */
export function excluirRegistro(colecao: ColecaoPainel, id: string) {
  Banco.apagar(colecao, id);
  if (colecao === "candidaturas") {
    estado.painel.tarefas
      .filter((t) => t.origem === "cand:" + id)
      .forEach((t) => Banco.apagar("tarefas", t.id));
  }
}

/** Busca por id em qualquer coleção do Painel. */
export function porId<C extends ColecaoPainel>(colecao: C, id: string): DadosPainel[C][number] | undefined {
  return (estado.painel[colecao] as DadosPainel[C]).find((x) => x.id === id);
}

/* ══════════ mutações do Simulador ══════════ */

export function salvarRascunho(r: Rascunho, rapido = false) {
  const copia = clonar(r);
  copia.atualizado = new Date().toISOString();
  Banco.gravar("rascunhos", copia.id, copia as unknown as Record<string, unknown> & { id: string }, rapido);
}

export function excluirRascunho(id: string) {
  Banco.apagar("rascunhos", id);
}

/** Rascunhos ativos ligados a uma candidatura. */
export const rascunhosDaCandidatura = (candidaturaId: string): Rascunho[] =>
  Object.values(estado.rascunhos).filter((r) => r.ref === candidaturaId && !r.arquivado);

/** Nome composto de uma candidatura: "Projeto · Artista → Edital". */
export function nomeCandidatura(c: Candidatura | undefined): string {
  if (!c) return "";
  const p = porId("projetos", c.projetoId);
  const e = porId("editais", c.editalId);
  const a = p && porId("artistas", p.artistaId);
  return (p ? p.nome : "?") + (a ? " · " + a.nome : "") + " → " + (e ? e.nome : "?");
}

/** Enquadramento do Painel → perfil jurídico do Simulador. */
const PERFIL_POR_ENQUADRAMENTO: Record<string, string> = {
  "PF": "PF", "MEI": "MEI", "PJ · Associação": "PJ sem fins lucrativos",
  "PJ": "PJ com fins lucrativos", "Coletivo sem CNPJ": "Coletivo informal representado por PF",
};

/** Preenche proponente e perfil do rascunho a partir da candidatura ligada. */
export function ligarCandidatura(r: Rascunho, candidaturaId: string) {
  const c = porId("candidaturas", candidaturaId);
  if (!c) return;
  const p = porId("projetos", c.projetoId);
  const a = p && porId("artistas", p.artistaId);
  if (a && !(r.interno.prop.nome || "").trim()) {
    r.interno.prop.nome = a.nome;
    const chave = Object.keys(PERFIL_POR_ENQUADRAMENTO)
      .sort((x, y) => y.length - x.length)
      .find((k) => String(a.enq || "").startsWith(k));
    r.interno.prop.perfil = chave ? PERFIL_POR_ENQUADRAMENTO[chave] : "";
  }
}

/** Ids (edital, projeto, artista) ligados a uma candidatura — para regras e fichas. */
export function idsDaCandidatura(candidaturaId: string): string[] {
  const c = porId("candidaturas", candidaturaId);
  if (!c) return [];
  const p = porId("projetos", c.projetoId);
  return [c.editalId, c.projetoId, p?.artistaId].filter(Boolean) as string[];
}

/* ══════════ mutações do Contexto ══════════ */

export function salvarFicha(f: Ficha) {
  Banco.gravar("fichas", f.id, { ...clonar(f), atualizado: new Date().toISOString() });
}
export function salvarRegra(r: Regra) {
  Banco.gravar("regras", r.id, { ...clonar(r), atualizado: new Date().toISOString() });
}
export function excluirRegra(id: string) { Banco.apagar("regras", id); }
export function salvarJulgamento(j: Julgamento) {
  Banco.gravar("julgamentos", j.id, { ...clonar(j), atualizado: new Date().toISOString() });
}
export function excluirJulgamento(id: string) { Banco.apagar("julgamentos", id); }

/* ══════════ exportar e importar ══════════ */

/** Gera e baixa o pacote .json completo (Painel + rascunhos + contexto). */
export function exportarTudo() {
  const painel = clonar(estado.painel) as unknown as Record<string, { _ord?: number }[]>;
  Object.values(painel).forEach((arr) => arr.forEach((x) => { delete x._ord; }));
  const pacote = {
    central: "coletivo", versao: 2, exportado: new Date().toISOString(),
    painel,
    rascunhos: clonar(estado.rascunhos),
    contexto: { fichas: clonar(estado.fichas), regras: clonar(estado.regras), julg: clonar(estado.julgamentos) },
  };
  baixarArquivo("central-coletivo-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(pacote, null, 1));
}

/* Conversão de tuplas (formato v1 do artefato) → objetos nomeados (formato do Firestore). */
const tupla = <T,>(v: unknown, nomes: string[]): T =>
  Array.isArray(v) ? (Object.fromEntries(nomes.map((n, i) => [n, (v as unknown[])[i] ?? ""])) as T) : (v as T);

function converterPainelImportado(p: Record<string, unknown>): DadosPainel {
  const d = clonar(p) as unknown as DadosPainel;
  (d.artistas || []).forEach((a) => {
    const det = a.det as unknown as Record<string, unknown[]> | undefined;
    if (!det) return;
    if (det.portfolio) det.portfolio = det.portfolio.map((t) => tupla(t, ["ano", "texto"]));
    if (det.docs) det.docs = det.docs.map((t) => tupla(t, ["nome", "status"]));
    if (det.links) det.links = det.links.map((t) => tupla(t, ["rotulo", "url"]));
  });
  (d.projetos || []).forEach((pr) => {
    if (pr.producao) pr.producao = (pr.producao as unknown as unknown[]).map((t) => tupla(t, ["texto", "status"]));
  });
  return d;
}

function converterContextoImportado(c: Record<string, unknown>) {
  const d = clonar(c) as { fichas?: Record<string, Ficha>; regras?: Record<string, Regra>; julg?: Record<string, Julgamento> };
  Object.values(d.fichas || {}).forEach((f) => {
    if (f.vocabulario) f.vocabulario = (f.vocabulario as unknown as unknown[]).map((t) => tupla(t, ["usar", "evitar"]));
    if (f.usados) f.usados = (f.usados as unknown as unknown[]).map((t) => tupla(t, ["texto", "onde", "quando"]));
  });
  Object.values(d.julg || {}).forEach((j) => {
    if (j.licoes) j.licoes = (j.licoes as unknown as unknown[]).map((t) => tupla(t, ["texto", "regra"]));
  });
  return d;
}

/** Substitui todos os dados do Painel pelos do pacote. */
function substituirPainel(novo: DadosPainel) {
  for (const c of COLECOES_PAINEL) {
    const novos = (novo[c] || []) as RegistroPainel[];
    const idsNovos = new Set(novos.map((x) => x.id));
    estado.painel[c].forEach((x) => { if (!idsNovos.has(x.id)) Banco.apagar(c, x.id); });
    novos.forEach((registro, i) => {
      registro._ord = i;
      registro.atualizado = new Date().toISOString();
      Banco.gravar(c, registro.id, registro as unknown as Record<string, unknown> & { id: string }, true);
    });
  }
}

/** Junta um rascunho importado (id novo se já existir um igual). */
function adicionarRascunhoImportado(r: Rascunho): boolean {
  r = normalizarRascunho(r);
  if (!FORMULARIOS[r.form]) return false;
  if (!r.id || estado.rascunhos[r.id]) r.id = novoRascunho(r.form).id;
  salvarRascunho(r, true);
  return true;
}

/**
 * Importa um .json em qualquer formato conhecido:
 * pacote da Central (v1 do artefato ou v2 deste site), export antigo do Painel,
 * backup do Simulador, rascunho avulso e os backups das réplicas antigas
 * (Fluxo Contínuo, Mesa Desenvolve Cultura, Rascunho Salic).
 * Devolve a mensagem de resultado; lança erro se não reconhecer.
 */
export function importarPacote(j: Record<string, unknown>): string {
  // Pacote completo da Central (artefato v1 ou site v2).
  if (j.central === "coletivo") {
    const partes: string[] = [];
    const painelBruto = j.painel as Record<string, unknown> | undefined;
    if (painelBruto && (painelBruto as { artistas?: unknown }).artistas) {
      if (!window.confirm("Substituir todos os dados do Painel pelos do arquivo?")) return "Import cancelado";
      substituirPainel(converterPainelImportado(painelBruto));
      partes.push("Painel");
    }
    if (j.rascunhos) {
      let n = 0;
      Object.values(j.rascunhos as Record<string, Rascunho>).forEach((r) => { if (adicionarRascunhoImportado(clonar(r))) n++; });
      partes.push(n + " rascunho(s)");
    }
    if (j.contexto) {
      const ctx = converterContextoImportado(j.contexto as Record<string, unknown>);
      Object.values(ctx.fichas || {}).forEach(salvarFicha);
      Object.values(ctx.regras || {}).forEach(salvarRegra);
      Object.values(ctx.julg || {}).forEach(salvarJulgamento);
      partes.push("contexto");
    }
    return "Importado: " + partes.join(", ");
  }

  // Export antigo só do Painel.
  if (j.artistas && j.candidaturas) {
    if (!window.confirm("Substituir todos os dados do Painel pelos do arquivo?")) return "Import cancelado";
    substituirPainel(converterPainelImportado(j));
    return "Painel importado";
  }

  // Backup do Simulador ({simulador, docs}).
  if (j.simulador && j.docs) {
    let n = 0;
    Object.values(j.docs as Record<string, Rascunho>).forEach((r) => { if (adicionarRascunhoImportado(clonar(r))) n++; });
    return n + " rascunho(s) importado(s)";
  }

  // Rascunho avulso exportado da Mesa.
  if (j.form && j.valores) {
    return adicionarRascunhoImportado(clonar(j) as unknown as Rascunho)
      ? "Rascunho importado" : "Formulário " + j.form + " não está no Simulador";
  }

  // Backup da réplica antiga do Fluxo Contínuo ({valores, anexos}).
  if (j.valores && typeof j.valores === "object") {
    const r = novoRascunho("fluxo-continuo", "Importado (réplica antiga)", "");
    r.valores = j.valores as Record<string, unknown>;
    r.anexos = (j.anexos as Record<string, boolean>) || {};
    adicionarRascunhoImportado(r);
    return "Rascunho do Fluxo Contínuo importado";
  }

  // Backup da Mesa de Rascunho Desenvolve Cultura ({dados: {e138: {"aba.campo": valor}}}).
  if (j.dados && typeof j.dados === "object") {
    const MAPA: Record<string, string> = { e138: "dc-138", e133: "dc-133", e134: "dc-134", e86: "dc-86" };
    let n = 0;
    Object.entries(j.dados as Record<string, Record<string, unknown>>).forEach(([ed, vals]) => {
      const form = MAPA[ed];
      if (!form || !vals || !Object.keys(vals).length) return;
      const r = novoRascunho(form, "Importado " + registroDe(form).nome, "");
      const cs = camposDe(form);
      Object.entries(vals).forEach(([k, v]) => {
        const ponto = k.indexOf(".");
        const aba = k.slice(0, ponto);
        const chave = k.slice(ponto + 1);
        const c = cs.find((x) => x.n === chave && x.etapa.id === aba)
          || cs.find((x) => x.cod === chave && x.n.endsWith("__" + aba))
          || cs.find((x) => x.n === chave);
        if (!c) return;
        if (c.t === "docs" && Array.isArray(v)) {
          const o: Record<string, boolean> = {};
          (v as string[]).forEach((nome) => { o[nome] = true; });
          r.valores[c.n] = o;
        } else r.valores[c.n] = v;
      });
      if (adicionarRascunhoImportado(r)) n++;
    });
    if (n) return n + " rascunho(s) importado(s) da Mesa antiga";
  }

  // Backup do Rascunho de Proposta Salic ({propostas: [...]}).
  if (Array.isArray(j.propostas)) {
    const TIP = SALIC_DADOS.tipicidade || [];
    let n = 0;
    (j.propostas as Record<string, any>[]).forEach((p) => {
      const nome = p.campos?.nomeProjeto || p.meta?.projeto || "Importado Salic";
      const r = novoRascunho("salic-proposta", nome + (p.meta?.versao ? " · " + p.meta.versao : ""), "");
      const V = r.valores as Record<string, unknown>;
      Object.entries(p.campos || {}).forEach(([k, v]) => { if (!k.startsWith("__")) V[k] = v; });
      const tp = TIP.find((t) => String(t[1]) === String(V.tpTipicidade));
      if (tp) {
        V.tpTipicidade = tp[0];
        const tl = tp[2].find((x) => String(x[1]) === String(V.tpTipologia));
        if (tl) {
          const s = tp[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_");
          V["tpTipologia_" + s] = tl[0];
        }
        delete V.tpTipologia;
      }
      ([["stDataFixa", ["Não", "Sim"]], ["areaabrangencia", ["Não", "Sim"]], ["tpProrrogacao", ["Não", "Sim"]]] as [string, string[]][])
        .forEach(([k, o]) => { if (V[k] === "0" || V[k] === "1") V[k] = o[Number(V[k])]; });
      if (p.pct) {
        V.cv_acessibilidade = p.pct.acess !== "" && p.pct.acess != null ? p.pct.acess + "%" : "";
        V.cv_administracao = p.pct.adm !== "" && p.pct.adm != null ? p.pct.adm + "%" : "";
        V.cv_captacao = p.pct.capt !== "" && p.pct.capt != null ? p.pct.capt + "%" : "";
      }
      V.orcamento = {
        linhas: (p.linhas || []).map((l: Record<string, unknown>) => ({ ...linhaVazia(), ...l, id: uid("l") })),
        abs: p.abs || { acess: "", adm: "", capt: "" },
        usarAbs: Boolean(p.usarAbs),
        check: p.check || {},
      };
      if (p.meta?.proponente) r.interno.prop.nome = p.meta.proponente;
      if (adicionarRascunhoImportado(r)) n++;
    });
    if (n) return n + " proposta(s) Salic importada(s)";
  }

  throw new Error("Formato de arquivo não reconhecido");
}
