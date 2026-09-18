/* Busca global (Ctrl+K): monta um índice leve com tudo o que o site conhece —
   as nove coleções do Painel, rascunhos do Simulador e docs do Contexto — e
   filtra por texto sem acento. Cada resultado sabe se abrir (ficha, modal de
   edição ou tela). O índice é montado na hora: com centenas de registros já
   em memória, não precisa de índice persistente. */
import type { EstadoCentral } from "../store/central";
import {
  abrirDetalhe, abrirFichaContexto, abrirJulgamento, abrirRascunho, irParaAmbiente,
} from "../store/navegacao";
import { abrirEdicao } from "../store/edicao";
import { nomeCandidatura } from "../store/mutacoes";
import { nomeArtistaDe, nomeEquipe } from "./nomes";
import { nomeDaEntidade } from "./contexto/consultas";
import { ETAPAS_PIPELINE, ROTULO_RESULTADO, ROTULO_TIPO_REGRA } from "../types";
import { formatarData } from "../utils";

export interface ResultadoBusca {
  /** Rótulo do tipo, mostrado como badge ("Artista", "Edital"...). */
  grupo: string;
  titulo: string;
  /** Linha de apoio (responsável, prazo, etapa...). */
  detalhe: string;
  /** Título normalizado (para o ranking). */
  tituloNorm: string;
  /** Tudo o que é buscável, normalizado. */
  texto: string;
  abrir: () => void;
}

/** Minúsculas e sem acento — "São" e "sao" se encontram. */
export const semAcento = (s: unknown) =>
  String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Índice de busca com o estado atual. */
export function montarIndice(estado: EstadoCentral): ResultadoBusca[] {
  const r: ResultadoBusca[] = [];
  const { painel } = estado;
  const item = (grupo: string, titulo: string, detalhe: string, extra: unknown[], abrir: () => void) => {
    const partes = [titulo, detalhe, ...extra.flat(2)].map(semAcento).filter(Boolean);
    r.push({ grupo, titulo, detalhe, tituloNorm: semAcento(titulo), texto: partes.join(" "), abrir });
  };
  const junta = (...p: (string | undefined)[]) => p.filter(Boolean).join(" · ");

  painel.artistas.forEach((a) =>
    item("Artista", a.nome, junta(a.tipo, a.mun), [a.tags, a.bio, a.enq], () => abrirDetalhe("artista", a.id)));
  painel.projetos.forEach((p) =>
    item("Projeto", p.nome, junta(nomeArtistaDe(p), p.ano), [p.tipo, p.meta], () => abrirDetalhe("projeto", p.id)));
  painel.editais.forEach((e) =>
    item("Edital", e.nome, junta(e.orgao, e.prazo && "prazo " + e.prazo), [e.mec, e.area, e.objeto], () => abrirDetalhe("edital", e.id)));
  painel.candidaturas.forEach((c) =>
    item("Candidatura", nomeCandidatura(c), junta(ETAPAS_PIPELINE[c.etapa], c.valor), [], () => abrirDetalhe("cand", c.id)));
  painel.tarefas.forEach((t) =>
    item("Tarefa", t.titulo, junta(nomeEquipe(t.respId), t.prazo && formatarData(t.prazo)), [t.obs], () => abrirEdicao("tarefa", t.id)));
  painel.reunioes.forEach((x) =>
    item("Reunião", x.titulo || "Reunião de " + formatarData(x.data), junta(formatarData(x.data), x.hora), [x.pauta, x.local, x.ata], () => abrirDetalhe("reuniao", x.id)));
  painel.equipe.forEach((p) =>
    item("Equipe", p.nome, (p.funcoes || []).join(", "), [p.nomeCompleto, p.email], () => abrirEdicao("equipe", p.id)));
  painel.elenco.forEach((c) =>
    item("Elenco", c.nome, c.funcao || "", [c.nomeCompleto, c.bio], () => abrirEdicao("elenco", c.id)));
  painel.contatos.forEach((c) =>
    item("Contato", c.nome, junta(c.tipo, c.ref), [c.contato], () => abrirEdicao("contato", c.id)));

  Object.values(estado.rascunhos).forEach((x) =>
    item("Rascunho", x.nome, x.arquivado ? "Simulador · arquivado" : "Simulador", [], () => abrirRascunho(x.id)));
  Object.values(estado.fichas).forEach((f) =>
    item("Ficha de escrita", nomeDaEntidade(f.id), { artista: "artista", projeto: "projeto", edital: "edital" }[f.tipo] || "",
      [f.posicionamento, f.argumentos, f.julgador], () => abrirFichaContexto(f.id)));
  Object.values(estado.regras).forEach((g) =>
    item("Regra", g.texto, ROTULO_TIPO_REGRA[g.tipoRegra] || "", [g.fonte?.ref], () => irParaAmbiente("contexto", "regras")));
  Object.values(estado.julgamentos).forEach((j) =>
    item("Julgamento", junta(nomeDaEntidade(j.edital), j.ano), ROTULO_RESULTADO[j.resultado] || "",
      [j.resumo, j.projeto && nomeDaEntidade(j.projeto)], () => abrirJulgamento(j.id)));

  return r;
}

/**
 * Filtra e ordena: todas as palavras precisam aparecer; quem tem a palavra no
 * título vem antes, e título que começa pelo termo vem primeiro de todos.
 */
export function filtrar(indice: ResultadoBusca[], termo: string, maximo = 30): ResultadoBusca[] {
  const palavras = semAcento(termo).split(/\s+/).filter(Boolean);
  if (!palavras.length) return [];
  const pontuados: { x: ResultadoBusca; pontos: number }[] = [];
  for (const x of indice) {
    let pontos = 0;
    for (const p of palavras) {
      if (x.tituloNorm.includes(p)) pontos += 2;
      else if (x.texto.includes(p)) pontos += 1;
      else { pontos = -1; break; }
    }
    if (pontos < 0) continue;
    if (x.tituloNorm.startsWith(palavras[0])) pontos += 2;
    pontuados.push({ x, pontos });
  }
  return pontuados
    .sort((a, b) => b.pontos - a.pontos || a.x.titulo.localeCompare(b.x.titulo, "pt-BR"))
    .slice(0, maximo)
    .map((p) => p.x);
}
