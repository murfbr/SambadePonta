/* Exportar e importar o pacote .json da Central.
   O importador aceita todos os formatos conhecidos: o pacote deste site (v2),
   o do artefato original (v1, com tuplas — convertidas aqui), o export antigo
   só do Painel, backups do Simulador e os backups das réplicas antigas
   (Fluxo Contínuo, Mesa Desenvolve Cultura, Rascunho Salic). */
import { Banco } from "../services/banco";
import { baixarArquivo, clonar, uid } from "../utils";
import { obterEstado } from "./central";
import {
  salvarFicha, salvarJulgamento, salvarRascunho, salvarRegra,
} from "./mutacoes";
import { COLECOES_PAINEL, type DadosPainel, type Ficha, type Julgamento, type Rascunho, type Regra } from "../types";
import { FORMULARIOS, SALIC_DADOS, registroDe } from "../data";
import { campos as camposDe, normalizarRascunho, novoRascunho } from "../lib/simulador/motor";
import { linhaVazia } from "../lib/simulador/orcamento";

type RegistroPainel = DadosPainel[keyof DadosPainel][number];
type Documento = Record<string, unknown> & { id: string };

/** Gera e baixa o pacote .json completo (Painel + rascunhos + contexto). */
export function exportarTudo() {
  const estado = obterEstado();
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

/* ── conversão de tuplas (formato v1 do artefato) → objetos nomeados ── */

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
  const estado = obterEstado();
  for (const c of COLECOES_PAINEL) {
    const novos = (novo[c] || []) as RegistroPainel[];
    const idsNovos = new Set(novos.map((x) => x.id));
    estado.painel[c].forEach((x) => { if (!idsNovos.has(x.id)) Banco.apagar(c, x.id); });
    novos.forEach((registro, i) => {
      registro._ord = i;
      registro.atualizado = new Date().toISOString();
      Banco.gravar(c, registro.id, registro as unknown as Documento, true);
    });
  }
}

/** Junta um rascunho importado (id novo se já existir um igual). */
function adicionarRascunhoImportado(r: Rascunho): boolean {
  r = normalizarRascunho(r);
  if (!FORMULARIOS[r.form]) return false;
  if (!r.id || obterEstado().rascunhos[r.id]) r.id = novoRascunho(r.form).id;
  salvarRascunho(r, true);
  return true;
}

/**
 * Importa um .json em qualquer formato conhecido.
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
