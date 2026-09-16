/* Impacto de excluir um registro do Painel: o que está ligado a ele e a
   exclusão em duas formas — LEVANDO os vínculos junto (apaga o que depende
   dele) ou DESVINCULANDO (mantém os registros, só limpando a ligação).
   Rascunhos do Simulador nunca são apagados daqui, só desvinculados; os docs
   do Contexto apontam pelo mesmo id e ficam sempre como estão (viram nota). */
import { obterEstado } from "./central";
import { excluirRegistro, salvarRascunho, salvarRegistro } from "./mutacoes";
import { ENTIDADES, type ChaveEntidade } from "../forms/especificacoes";
import type { Candidatura, Tarefa } from "../types";

export type DestinoVinculos = "junto" | "desvincular";

export interface ImpactoExclusao {
  /** O que está ligado — some no "levar junto", fica solto no "desvincular". */
  vinculos: string[];
  /** Avisos informativos (o que acontece de qualquer jeito). */
  notas: string[];
  /** Executa a exclusão com o destino escolhido para os vínculos. */
  excluir: (destino: DestinoVinculos) => void;
}

const n = (qtd: number, singular: string, plural: string) =>
  qtd + " " + (qtd === 1 ? singular : plural);

const tarefasDe = (origem: string): Tarefa[] =>
  obterEstado().painel.tarefas.filter((t) => t.origem === origem);

const rascunhosDe = (candidaturaId: string) =>
  Object.values(obterEstado().rascunhos).filter((r) => r.ref === candidaturaId);

const desvincularTarefas = (origem: string) =>
  tarefasDe(origem).forEach((t) => salvarRegistro("tarefas", { ...t, origem: "" }));

const excluirTarefas = (origem: string) =>
  tarefasDe(origem).forEach((t) => excluirRegistro("tarefas", t.id));

/** Limpa a referência dos rascunhos ligados a uma candidatura (nunca os apaga). */
const desvincularRascunhos = (candidaturaId: string) =>
  rascunhosDe(candidaturaId).forEach((r) => salvarRascunho({ ...r, ref: "" }, true));

/** Exclui uma candidatura tratando tarefas e rascunhos conforme o destino. */
function excluirCandidatura(c: Candidatura, destino: DestinoVinculos) {
  if (destino === "desvincular") desvincularTarefas("cand:" + c.id);
  desvincularRascunhos(c.id);
  // A cascata interna do excluirRegistro apaga as tarefas "cand:" que sobraram.
  excluirRegistro("candidaturas", c.id);
}

/** Nota sobre docs do Contexto que apontam os ids (ficam como estão). */
function notaContexto(ids: string[]): string[] {
  const { fichas, regras, julgamentos } = obterEstado();
  const partes: string[] = [];
  const nF = ids.filter((id) => fichas[id]).length;
  const nR = Object.values(regras).filter((r) => ids.includes(r.escopo.id)).length;
  const nJ = Object.values(julgamentos).filter((j) => ids.includes(j.edital) || ids.includes(j.projeto)).length;
  if (nF) partes.push(n(nF, "ficha", "fichas"));
  if (nR) partes.push(n(nR, "regra", "regras"));
  if (nJ) partes.push(n(nJ, "julgamento", "julgamentos"));
  return partes.length
    ? ["No Contexto, " + partes.join(", ") + " apontam para o que será excluído — ficam registrados como estão."]
    : [];
}

function notaRascunhos(candidaturaIds: string[]): string[] {
  const qtd = candidaturaIds.reduce((soma, id) => soma + rascunhosDe(id).length, 0);
  return qtd
    ? [n(qtd, "rascunho do Simulador fica desvinculado", "rascunhos do Simulador ficam desvinculados") + " (rascunho nunca é apagado daqui)."]
    : [];
}

/** Calcula o impacto de excluir um registro e devolve as formas de executar. */
export function impactoExclusao(chave: ChaveEntidade, id: string): ImpactoExclusao {
  const { painel } = obterEstado();

  if (chave === "artista") {
    const projetos = painel.projetos.filter((p) => p.artistaId === id);
    const idsProjeto = new Set(projetos.map((p) => p.id));
    const candidaturas = painel.candidaturas.filter((c) => idsProjeto.has(c.projetoId));
    const idsCand = new Set(candidaturas.map((c) => c.id));
    const tarefas = painel.tarefas.filter((t) => {
      const dois = t.origem.indexOf(":");
      const tipo = t.origem.slice(0, dois), ref = t.origem.slice(dois + 1);
      return (tipo === "proj" && idsProjeto.has(ref)) || (tipo === "cand" && idsCand.has(ref));
    });
    const vinculos = [
      ...(projetos.length ? [n(projetos.length, "projeto", "projetos")] : []),
      ...(candidaturas.length ? [n(candidaturas.length, "candidatura no pipeline", "candidaturas no pipeline")] : []),
      ...(tarefas.length ? [n(tarefas.length, "tarefa ligada", "tarefas ligadas")] : []),
    ];
    return {
      vinculos,
      notas: [...notaRascunhos([...idsCand]), ...notaContexto([id, ...idsProjeto, ...idsCand])],
      excluir(destino) {
        if (destino === "junto") {
          candidaturas.forEach((c) => excluirCandidatura(c, "junto"));
          projetos.forEach((p) => { excluirTarefas("proj:" + p.id); excluirRegistro("projetos", p.id); });
        } else {
          projetos.forEach((p) => salvarRegistro("projetos", { ...p, artistaId: "" }));
        }
        excluirRegistro("artistas", id);
      },
    };
  }

  if (chave === "projeto") {
    const candidaturas = painel.candidaturas.filter((c) => c.projetoId === id);
    const idsCand = candidaturas.map((c) => c.id);
    const tarefas = [...tarefasDe("proj:" + id), ...idsCand.flatMap((cid) => tarefasDe("cand:" + cid))];
    const vinculos = [
      ...(candidaturas.length ? [n(candidaturas.length, "candidatura no pipeline", "candidaturas no pipeline")] : []),
      ...(tarefas.length ? [n(tarefas.length, "tarefa ligada", "tarefas ligadas")] : []),
    ];
    return {
      vinculos,
      notas: [...notaRascunhos(idsCand), ...notaContexto([id, ...idsCand])],
      excluir(destino) {
        if (destino === "junto") {
          candidaturas.forEach((c) => excluirCandidatura(c, "junto"));
          excluirTarefas("proj:" + id);
        } else {
          candidaturas.forEach((c) => salvarRegistro("candidaturas", { ...c, projetoId: "" }));
          desvincularTarefas("proj:" + id);
        }
        excluirRegistro("projetos", id);
      },
    };
  }

  if (chave === "edital") {
    const candidaturas = painel.candidaturas.filter((c) => c.editalId === id);
    const idsCand = candidaturas.map((c) => c.id);
    const tarefas = idsCand.flatMap((cid) => tarefasDe("cand:" + cid));
    const vinculos = [
      ...(candidaturas.length ? [n(candidaturas.length, "candidatura no pipeline", "candidaturas no pipeline")] : []),
      ...(tarefas.length ? [n(tarefas.length, "tarefa ligada", "tarefas ligadas")] : []),
    ];
    return {
      vinculos,
      notas: [...notaRascunhos(idsCand), ...notaContexto([id, ...idsCand])],
      excluir(destino) {
        if (destino === "junto") candidaturas.forEach((c) => excluirCandidatura(c, "junto"));
        else candidaturas.forEach((c) => salvarRegistro("candidaturas", { ...c, editalId: "" }));
        excluirRegistro("editais", id);
      },
    };
  }

  if (chave === "candidatura") {
    const tarefas = tarefasDe("cand:" + id);
    const c = painel.candidaturas.find((x) => x.id === id);
    return {
      vinculos: tarefas.length ? [n(tarefas.length, "tarefa ligada", "tarefas ligadas")] : [],
      notas: [...notaRascunhos([id]), ...notaContexto([id])],
      excluir(destino) {
        if (c) excluirCandidatura(c, destino);
      },
    };
  }

  if (chave === "reuniao") {
    const tarefas = tarefasDe("reuniao:" + id);
    return {
      vinculos: tarefas.length ? [n(tarefas.length, "encaminhamento (tarefa)", "encaminhamentos (tarefas)")] : [],
      notas: [],
      excluir(destino) {
        if (destino === "junto") excluirTarefas("reuniao:" + id);
        else desvincularTarefas("reuniao:" + id);
        excluirRegistro("reunioes", id);
      },
    };
  }

  if (chave === "equipe") {
    const tarefas = painel.tarefas.filter((t) => t.respId === id);
    const candidaturas = painel.candidaturas.filter((c) => c.respId === id);
    const reunioes = painel.reunioes.filter((r) => (r.participanteIds || []).includes(id));
    const notas: string[] = [];
    if (tarefas.length) notas.push(n(tarefas.length, "tarefa fica", "tarefas ficam") + " sem responsável.");
    if (candidaturas.length) notas.push(n(candidaturas.length, "candidatura fica", "candidaturas ficam") + " sem responsável.");
    if (reunioes.length) notas.push("Sai de " + n(reunioes.length, "reunião", "reuniões") + ".");
    return {
      vinculos: [],
      notas,
      excluir() {
        tarefas.forEach((t) => salvarRegistro("tarefas", { ...t, respId: "" }));
        candidaturas.forEach((c) => salvarRegistro("candidaturas", { ...c, respId: "" }));
        reunioes.forEach((r) => salvarRegistro("reunioes", {
          ...r, participanteIds: (r.participanteIds || []).filter((p) => p !== id),
        }));
        excluirRegistro("equipe", id);
      },
    };
  }

  // Tarefa, elenco e contato: nada aponta para eles.
  return { vinculos: [], notas: [], excluir: () => excluirRegistro(ENTIDADES[chave].colecao, id) };
}
