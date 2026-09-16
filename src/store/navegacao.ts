/* Navegação do site: ambiente ativo, aba ativa e a ficha de detalhe aberta.
   É um mini-estado global (como o Shell do artefato) para que qualquer bloco possa
   navegar — ex.: a ficha da candidatura abre um rascunho no Simulador.
   Ambiente e aba ficam gravados no localStorage para reabrir onde parou. */
import { useSyncExternalStore } from "react";

export interface Ambiente {
  id: string;
  rotulo: string;
  abas: [id: string, rotulo: string][];
}

/** Os oito ambientes do site, com suas abas (iguais ao artefato). */
export const AMBIENTES: Ambiente[] = [
  { id: "painel", rotulo: "Painel", abas: [["resumo", "Resumo"], ["pendencias", "Pendências"]] },
  { id: "portfolio", rotulo: "Portfólio", abas: [["artistas", "Artistas"], ["projetos", "Projetos"]] },
  { id: "captacao", rotulo: "Captação", abas: [["pipeline", "Pipeline"], ["editais", "Editais"]] },
  { id: "agenda", rotulo: "Agenda", abas: [["cronograma", "Cronograma"], ["calendario", "Calendário"]] },
  { id: "pessoas", rotulo: "Pessoas", abas: [["elenco", "Elenco / Colaboradores"], ["equipe", "Equipe"], ["contatos", "Contatos externos"]] },
  { id: "gestao", rotulo: "Gestão", abas: [["reunioes", "Reuniões"], ["quadro", "Tarefas"]] },
  { id: "simulador", rotulo: "Simulador", abas: [["mesa", "Mesa"], ["plataformas", "Plataformas"], ["formulario", "Formulário"], ["transferencia", "Transferência"]] },
  { id: "contexto", rotulo: "Contexto", abas: [["geral", "Geral"], ["fichas", "Fichas"], ["regras", "Regras"], ["julgamentos", "Julgamentos"], ["trocar", "Trocar com o Claude"]] },
];

/** Ficha de detalhe aberta no Painel (artista, projeto, candidatura...). */
export interface Detalhe {
  tipo: "artista" | "projeto" | "cand" | "edital" | "reuniao";
  id: string;
  /** Sub-aba dentro da ficha ("geral", "docs"...). */
  sub?: string;
}

interface EstadoNavegacao {
  amb: string;
  aba: string;
  detalhe: Detalhe | null;
  /** Rascunho aberto no Simulador (persiste entre visitas). */
  rascunhoAberto: string | null;
  /** Ficha selecionada na aba Fichas do Contexto. */
  fichaAberta: string | null;
  /** Julgamento selecionado no Contexto. */
  julgamentoAberto: string | null;
}

const CHAVE = "central-nav-v1";

function carregar(): EstadoNavegacao {
  const padrao: EstadoNavegacao = { amb: "painel", aba: "resumo", detalhe: null, rascunhoAberto: null, fichaAberta: null, julgamentoAberto: null };
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) || "{}");
    return { ...padrao, ...salvo, detalhe: null };
  } catch { return padrao; }
}

let nav = carregar();
const assinantes = new Set<() => void>();

function publicar() {
  nav = { ...nav };
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ amb: nav.amb, aba: nav.aba, rascunhoAberto: nav.rascunhoAberto }));
  } catch { /* sem localStorage: só não lembra a aba */ }
  assinantes.forEach((f) => f());
}

export function usarNavegacao(): EstadoNavegacao {
  return useSyncExternalStore(
    (cb) => { assinantes.add(cb); return () => assinantes.delete(cb); },
    () => nav,
  );
}

export const ambienteDe = (id: string): Ambiente =>
  AMBIENTES.find((a) => a.id === id) || AMBIENTES[0];

/** Troca de ambiente (e opcionalmente de aba). Fecha a ficha de detalhe. */
export function irParaAmbiente(amb: string, aba?: string) {
  const a = ambienteDe(amb);
  nav.amb = a.id;
  nav.aba = aba || a.abas[0][0];
  nav.detalhe = null;
  publicar();
  window.scrollTo({ top: 0 });
}

export function irParaAba(aba: string) {
  nav.aba = aba;
  nav.detalhe = null;
  publicar();
}

/** Abre a ficha de detalhe de um registro do Painel. */
export function abrirDetalhe(tipo: Detalhe["tipo"], id: string, sub?: string) {
  nav.detalhe = { tipo, id, sub: sub || "geral" };
  publicar();
  window.scrollTo({ top: 0 });
}

export function mudarSubAba(sub: string) {
  if (nav.detalhe) { nav.detalhe = { ...nav.detalhe, sub }; publicar(); }
}

export function fecharDetalhe() {
  nav.detalhe = null;
  publicar();
}

/** Abre um rascunho no Simulador (vindo de qualquer lugar do site). */
export function abrirRascunho(id: string) {
  nav.rascunhoAberto = id;
  nav.amb = "simulador";
  nav.aba = "formulario";
  nav.detalhe = null;
  publicar();
  window.scrollTo({ top: 0 });
}

/** Marca o rascunho aberto sem trocar de tela (uso interno do Simulador). */
export function definirRascunhoAberto(id: string | null) {
  nav.rascunhoAberto = id;
  publicar();
}

/** Abre uma ficha na aba Fichas do Contexto. */
export function abrirFichaContexto(id: string) {
  nav.fichaAberta = id;
  nav.amb = "contexto";
  nav.aba = "fichas";
  nav.detalhe = null;
  publicar();
  window.scrollTo({ top: 0 });
}

export function definirFichaAberta(id: string | null) {
  nav.fichaAberta = id;
  publicar();
}

/** Abre um julgamento na aba Julgamentos do Contexto. */
export function abrirJulgamento(id: string) {
  nav.julgamentoAberto = id;
  nav.amb = "contexto";
  nav.aba = "julgamentos";
  nav.detalhe = null;
  publicar();
  window.scrollTo({ top: 0 });
}

export function definirJulgamentoAberto(id: string | null) {
  nav.julgamentoAberto = id;
  publicar();
}
