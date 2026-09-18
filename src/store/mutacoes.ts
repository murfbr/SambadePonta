/* Mutações e consultas do estado central: criar/atualizar/excluir registros do
   Painel, rascunhos do Simulador e docs do Contexto — sempre via camada Banco,
   que espelha na hora e grava com debounce. Excluir nunca apaga de vez: o
   registro vai para a coleção `lixeira` (30 dias) e o toast oferece Desfazer. */
import { Banco } from "../services/banco";
import { emailSessao } from "../services/sessao";
import { toast } from "../components/Toast";
import { clonar, uid } from "../utils";
import { obterEstado } from "./central";
import {
  ETAPA_RESULTADO, ETAPAS_PIPELINE, STATUS_TAREFA,
  type Candidatura, type ColecaoPainel, type DadosPainel, type Ficha, type Formulario,
  type Julgamento, type Rascunho, type Regra, type StatusTarefa, type Tarefa,
} from "../types";

type RegistroPainel = DadosPainel[ColecaoPainel][number];
type Documento = Record<string, unknown> & { id: string };

/* ══════════ Lixeira ══════════ */

/** Chave do documento na lixeira: coleção + id (ids de coleções diferentes não colidem). */
const chaveLixeira = (colecao: string, id: string) => colecao + "__" + id;

/** Lote de exclusão: uma ação do usuário = um toast com Desfazer, mesmo em cascata. */
let loteAberto: { id: string; qtd: number } | null = null;

/** Agrupa várias exclusões (cascatas do "levar junto") num Desfazer só. */
export function emLoteDeExclusao<T>(fazer: () => T): T {
  if (loteAberto) return fazer();
  loteAberto = { id: uid("lote"), qtd: 0 };
  try { return fazer(); } finally { fecharLote(); }
}

function fecharLote() {
  const lote = loteAberto;
  loteAberto = null;
  if (!lote || !lote.qtd) return;
  toast(lote.qtd === 1 ? "Foi para a lixeira" : lote.qtd + " registros foram para a lixeira", {
    acao: {
      rotulo: "Desfazer",
      fazer: () => {
        const n = restaurarLote(lote.id);
        toast(n === 1 ? "Restaurado" : n + " restaurados");
      },
    },
  });
}

/** Move um documento para a lixeira (o "excluir" de verdade do site). */
function moverParaLixeira(colecao: string, id: string) {
  const documento = Banco.ler(colecao)[id];
  if (!documento) return;
  const loteProprio = !loteAberto;
  if (loteProprio) loteAberto = { id: uid("lote"), qtd: 0 };
  loteAberto!.qtd++;
  Banco.gravar("lixeira", chaveLixeira(colecao, id), {
    ...clonar(documento),
    _de: colecao,
    _apagadoEm: new Date().toISOString(),
    _apagadoPor: emailSessao(),
    _lote: loteAberto!.id,
  }, true);
  void Banco.apagar(colecao, id);
  if (loteProprio) fecharLote();
}

/** Devolve um item da lixeira para a coleção de origem. false = o id renasceu lá. */
export function restaurarDaLixeira(chave: string): boolean {
  const item = obterEstado().lixeira[chave];
  if (!item) return false;
  const destino = item._de;
  if (Banco.ler(destino)[item.id]) return false; // não sobrescreve um registro recriado
  const copia = clonar(item) as Record<string, unknown> & { id: string };
  delete copia._de; delete copia._apagadoEm; delete copia._apagadoPor; delete copia._lote;
  copia.atualizado = new Date().toISOString();
  Banco.gravar(destino, copia.id, copia, true);
  void Banco.apagar("lixeira", chave);
  return true;
}

/** Restaura tudo o que caiu junto numa exclusão (o Desfazer do toast). */
export function restaurarLote(lote: string): number {
  let n = 0;
  for (const [chave, item] of Object.entries(obterEstado().lixeira)) {
    if (item._lote === lote && restaurarDaLixeira(chave)) n++;
  }
  return n;
}

/** Remove um item da lixeira em definitivo (aí sim, sem volta). */
export function excluirDeVez(chave: string) {
  void Banco.apagar("lixeira", chave);
}

export function esvaziarLixeira() {
  Object.keys(obterEstado().lixeira).forEach((chave) => void Banco.apagar("lixeira", chave));
}

/** Itens da lixeira com mais de `dias` — limpos ao abrir a tela da Lixeira. */
export function limparLixeiraAntiga(dias = 30) {
  const corte = Date.now() - dias * 86400000;
  for (const [chave, item] of Object.entries(obterEstado().lixeira)) {
    if (new Date(item._apagadoEm).getTime() < corte) void Banco.apagar("lixeira", chave);
  }
}

/* ══════════ Painel ══════════ */

/** Cria ou atualiza um registro do Painel. Novo registro entra no fim da lista. */
export function salvarRegistro(colecao: ColecaoPainel, registro: RegistroPainel, rapido = true) {
  const r = clonar(registro) as RegistroPainel;
  const existente = obterEstado().painel[colecao].find((x) => x.id === r.id);
  r._ord = existente ? existente._ord : maiorOrd(colecao) + 1;
  r.atualizado = new Date().toISOString();
  Banco.gravar(colecao, r.id, r as unknown as Documento, rapido);
}

const maiorOrd = (colecao: ColecaoPainel) =>
  obterEstado().painel[colecao].reduce((m, x) => Math.max(m, x._ord || 0), -1);

/** Exclui um registro (para a lixeira). Excluir candidatura leva junto as tarefas ligadas. */
export function excluirRegistro(colecao: ColecaoPainel, id: string) {
  emLoteDeExclusao(() => {
    moverParaLixeira(colecao, id);
    if (colecao === "candidaturas") {
      obterEstado().painel.tarefas
        .filter((t) => t.origem === "cand:" + id)
        .forEach((t) => moverParaLixeira("tarefas", t.id));
    }
  });
}

/** Busca por id em qualquer coleção do Painel. */
export function porId<C extends ColecaoPainel>(colecao: C, id: string): DadosPainel[C][number] | undefined {
  return (obterEstado().painel[colecao] as DadosPainel[C]).find((x) => x.id === id);
}

/** Move a candidatura no pipeline; VOLTAR para antes de "Aprovado / Reprovado"
    limpa o resultado (seguir adiante mantém — está em execução porque foi aprovada). */
export function moverCandidatura(c: Candidatura, direcao: -1 | 1) {
  const copia = clonar(c);
  copia.etapa = Math.max(0, Math.min(ETAPAS_PIPELINE.length - 1, copia.etapa + direcao));
  if (copia.etapa < ETAPA_RESULTADO) delete copia.result;
  salvarRegistro("candidaturas", copia);
}

/** Marca (ou desmarca) o resultado da candidatura na etapa "Aprovado / Reprovado". */
export function definirResultado(c: Candidatura, resultado?: "ok" | "no") {
  const copia = clonar(c);
  if (resultado) copia.result = resultado; else delete copia.result;
  salvarRegistro("candidaturas", copia);
}

/**
 * Solta um cartão arrastado num quadro: aplica `mudar` (nova etapa, status ou
 * responsável) e reposiciona o registro na coleção — antes de `antesDeId` ou no
 * fim. Só regrava os registros cujo `_ord` de fato mudou.
 */
export function soltarCartao<C extends ColecaoPainel>(
  colecao: C, id: string, mudar: (r: DadosPainel[C][number]) => void, antesDeId?: string,
) {
  const lista = obterEstado().painel[colecao] as DadosPainel[C];
  const original = lista.find((x) => x.id === id);
  if (!original || id === antesDeId) return;
  const movido = clonar(original);
  mudar(movido);

  const resto = lista.filter((x) => x.id !== id);
  let pos = resto.length;
  if (antesDeId) {
    const i = resto.findIndex((x) => x.id === antesDeId);
    if (i >= 0) pos = i;
  }
  const nova = [...resto.slice(0, pos), movido, ...resto.slice(pos)];
  const agora = new Date().toISOString();
  nova.forEach((r, i) => {
    if (r.id !== id && r._ord === i) return;
    const copia = r.id === id ? movido : clonar(r);
    copia._ord = i;
    copia.atualizado = agora;
    Banco.gravar(colecao, copia.id, copia as unknown as Documento, true);
  });
}

/** Solta uma candidatura numa etapa do pipeline (arrastar e soltar). */
export function soltarCandidatura(id: string, etapa: number, antesDeId?: string) {
  soltarCartao("candidaturas", id, (c) => {
    c.etapa = Math.max(0, Math.min(ETAPAS_PIPELINE.length - 1, etapa));
    if (c.etapa < ETAPA_RESULTADO) delete c.result;
  }, antesDeId);
}

/** Solta uma tarefa numa coluna de status do quadro. */
export function soltarTarefaEmStatus(id: string, status: StatusTarefa, antesDeId?: string) {
  soltarCartao("tarefas", id, (t) => { t.status = status; }, antesDeId);
}

/** Solta uma tarefa na coluna de uma pessoa ("" = sem responsável). */
export function soltarTarefaEmPessoa(id: string, respId: string, antesDeId?: string) {
  soltarCartao("tarefas", id, (t) => { t.respId = respId; }, antesDeId);
}

/** Concluir/reabrir uma tarefa pelo checkzinho. */
export function alternarTarefaConcluida(t: Tarefa) {
  const copia = clonar(t);
  copia.status = copia.status === "feito" ? "fazer" : "feito";
  salvarRegistro("tarefas", copia);
}

/** Avança ou volta o status da tarefa (a fazer ⇄ em andamento ⇄ concluído). */
export function girarStatusTarefa(t: Tarefa, direcao: -1 | 1) {
  const copia = clonar(t);
  const i = Math.max(0, Math.min(2, STATUS_TAREFA.indexOf(copia.status) + direcao));
  copia.status = STATUS_TAREFA[i];
  salvarRegistro("tarefas", copia);
}

/* ══════════ Simulador ══════════ */

export function salvarRascunho(r: Rascunho, rapido = false) {
  const copia = clonar(r);
  copia.atualizado = new Date().toISOString();
  Banco.gravar("rascunhos", copia.id, copia as unknown as Documento, rapido);
}

export function excluirRascunho(id: string) {
  emLoteDeExclusao(() => moverParaLixeira("rascunhos", id));
}

/** Grava uma definição de formulário (importada na aba Plataformas). */
export function salvarFormulario(f: Formulario) {
  Banco.gravar("formularios", f.id, { ...clonar(f), atualizado: new Date().toISOString() }, true);
}

/** Exclui uma definição de formulário (a UI só oferece quando não há rascunho nela). */
export function excluirFormulario(id: string) {
  emLoteDeExclusao(() => moverParaLixeira("formularios", id));
}

/** Rascunhos ativos ligados a uma candidatura. */
export const rascunhosDaCandidatura = (candidaturaId: string): Rascunho[] =>
  Object.values(obterEstado().rascunhos).filter((r) => r.ref === candidaturaId && !r.arquivado);

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

/* ══════════ Contexto ══════════ */

export function salvarFicha(f: Ficha) {
  Banco.gravar("fichas", f.id, { ...clonar(f), atualizado: new Date().toISOString() });
}
export function salvarRegra(r: Regra) {
  Banco.gravar("regras", r.id, { ...clonar(r), atualizado: new Date().toISOString() });
}
export function excluirRegra(id: string) { emLoteDeExclusao(() => moverParaLixeira("regras", id)); }
export function salvarJulgamento(j: Julgamento) {
  Banco.gravar("julgamentos", j.id, { ...clonar(j), atualizado: new Date().toISOString() });
}
export function excluirJulgamento(id: string) { emLoteDeExclusao(() => moverParaLixeira("julgamentos", id)); }
