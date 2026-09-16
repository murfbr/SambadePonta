/* Mutações e consultas do estado central: criar/atualizar/excluir registros do
   Painel, rascunhos do Simulador e docs do Contexto — sempre via camada Banco,
   que espelha na hora e grava com debounce. */
import { Banco } from "../services/banco";
import { clonar } from "../utils";
import { obterEstado } from "./central";
import {
  STATUS_TAREFA,
  type Candidatura, type ColecaoPainel, type DadosPainel, type Ficha,
  type Julgamento, type Rascunho, type Regra, type Tarefa,
} from "../types";

type RegistroPainel = DadosPainel[ColecaoPainel][number];
type Documento = Record<string, unknown> & { id: string };

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

/** Exclui um registro. Excluir candidatura também limpa as tarefas ligadas a ela. */
export function excluirRegistro(colecao: ColecaoPainel, id: string) {
  Banco.apagar(colecao, id);
  if (colecao === "candidaturas") {
    obterEstado().painel.tarefas
      .filter((t) => t.origem === "cand:" + id)
      .forEach((t) => Banco.apagar("tarefas", t.id));
  }
}

/** Busca por id em qualquer coleção do Painel. */
export function porId<C extends ColecaoPainel>(colecao: C, id: string): DadosPainel[C][number] | undefined {
  return (obterEstado().painel[colecao] as DadosPainel[C]).find((x) => x.id === id);
}

/** Move a candidatura no pipeline; sair de "Aprovado / Reprovado" limpa o resultado. */
export function moverCandidatura(c: Candidatura, direcao: -1 | 1) {
  const copia = clonar(c);
  copia.etapa = Math.max(0, Math.min(7, copia.etapa + direcao));
  if (copia.etapa !== 5) delete copia.result;
  salvarRegistro("candidaturas", copia);
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
  Banco.apagar("rascunhos", id);
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
export function excluirRegra(id: string) { Banco.apagar("regras", id); }
export function salvarJulgamento(j: Julgamento) {
  Banco.gravar("julgamentos", j.id, { ...clonar(j), atualizado: new Date().toISOString() });
}
export function excluirJulgamento(id: string) { Banco.apagar("julgamentos", id); }
