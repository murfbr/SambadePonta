/* Navegação do site: ambiente ativo, aba ativa e a ficha de detalhe aberta.
   É um mini-estado global (como o Shell do artefato) para que qualquer bloco possa
   navegar — ex.: a ficha da candidatura abre um rascunho no Simulador.
   Ambiente e aba ficam gravados no localStorage para reabrir onde parou.

   Cada tela tem endereço na URL (#/ambiente/aba/tipo/id): o hash espelha o
   estado, o voltar/avançar do navegador funciona e um link colado abre direto
   na ficha — o link na URL vence o "reabrir onde parou". */
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
  { id: "gestao", rotulo: "Gestão", abas: [["reunioes", "Reuniões"], ["quadro", "Tarefas"], ["lixeira", "Lixeira"]] },
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

/* ══════════ endereço na URL ══════════ */

const TIPOS_DETALHE = ["artista", "projeto", "cand", "edital", "reuniao"] as const;

/** Estado de navegação → hash ("#/captacao/editais/edital/ed-3"). */
function paraHash(n: EstadoNavegacao): string {
  const partes = [n.amb, n.aba];
  if (n.detalhe) {
    partes.push(n.detalhe.tipo, n.detalhe.id);
    if (n.detalhe.sub && n.detalhe.sub !== "geral") partes.push(n.detalhe.sub);
  } else if (n.amb === "simulador" && n.aba === "formulario" && n.rascunhoAberto) {
    partes.push(n.rascunhoAberto);
  } else if (n.amb === "contexto" && n.aba === "fichas" && n.fichaAberta) {
    partes.push(n.fichaAberta);
  } else if (n.amb === "contexto" && n.aba === "julgamentos" && n.julgamentoAberto) {
    partes.push(n.julgamentoAberto);
  }
  return "#/" + partes.map(encodeURIComponent).join("/");
}

/** Hash → pedaço de estado de navegação; null quando não reconhece nada. */
function deHash(hash: string): Partial<EstadoNavegacao> | null {
  const partes = hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const amb = AMBIENTES.find((a) => a.id === partes[0]);
  if (!amb) return null;
  const aba = (amb.abas.find(([id]) => id === partes[1]) || amb.abas[0])[0];
  const lido: Partial<EstadoNavegacao> = { amb: amb.id, aba, detalhe: null };
  const [alvo, id, sub] = partes.slice(2);
  if (!alvo) return lido;
  if (amb.id === "simulador" && aba === "formulario") lido.rascunhoAberto = alvo;
  else if (amb.id === "contexto" && aba === "fichas") lido.fichaAberta = alvo;
  else if (amb.id === "contexto" && aba === "julgamentos") lido.julgamentoAberto = alvo;
  else if ((TIPOS_DETALHE as readonly string[]).includes(alvo) && id) {
    lido.detalhe = { tipo: alvo as Detalhe["tipo"], id, sub: sub || "geral" };
  }
  return lido;
}

function carregar(): EstadoNavegacao {
  const padrao: EstadoNavegacao = { amb: "painel", aba: "resumo", detalhe: null, rascunhoAberto: null, fichaAberta: null, julgamentoAberto: null };
  let base = padrao;
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) || "{}");
    base = { ...padrao, ...salvo, detalhe: null };
  } catch { /* fica o padrão */ }
  const daUrl = deHash(window.location.hash);
  return daUrl ? { ...base, ...daUrl } : base;
}

let nav = carregar();
const assinantes = new Set<() => void>();

/** Quando true, a próxima troca de URL substitui a entrada do histórico
    (sub-aba, normalização de link digitado) em vez de criar uma nova. */
let trocaSemHistorico = false;

/** Espelha o estado na URL. pushState não dispara hashchange — sem eco. */
function sincronizarHash() {
  const alvo = paraHash(nav);
  const substituir = trocaSemHistorico;
  trocaSemHistorico = false;
  if (window.location.hash === alvo) return;
  try {
    if (substituir) history.replaceState(null, "", alvo);
    else history.pushState(null, "", alvo);
  } catch { window.location.hash = alvo; }
}

// Voltar/avançar do navegador e URL editada à mão entram por aqui.
window.addEventListener("hashchange", () => {
  const daUrl = deHash(window.location.hash);
  if (!daUrl || paraHash({ ...nav, ...daUrl }) === paraHash(nav)) return;
  nav = { ...nav, ...daUrl };
  trocaSemHistorico = true; // a URL normalizada substitui a digitada
  publicar();
  window.scrollTo({ top: 0 });
});

// A URL nasce espelhando o estado, sem criar entrada no histórico.
try { history.replaceState(null, "", paraHash(nav)); } catch { /* ambiente sem history */ }

function publicar() {
  nav = { ...nav };
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ amb: nav.amb, aba: nav.aba, rascunhoAberto: nav.rascunhoAberto }));
  } catch { /* sem localStorage: só não lembra a aba */ }
  sincronizarHash();
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

/** Ambiente/aba "casa" de cada tipo de ficha, para quando o detalhe é aberto
    de fora da família do Painel (busca global no Simulador ou no Contexto). */
const CASA_DO_DETALHE: Record<Detalhe["tipo"], [string, string]> = {
  artista: ["portfolio", "artistas"], projeto: ["portfolio", "projetos"],
  cand: ["captacao", "pipeline"], edital: ["captacao", "editais"], reuniao: ["gestao", "reunioes"],
};

/** Abre a ficha de detalhe de um registro do Painel. */
export function abrirDetalhe(tipo: Detalhe["tipo"], id: string, sub?: string) {
  if (nav.amb === "simulador" || nav.amb === "contexto") {
    [nav.amb, nav.aba] = CASA_DO_DETALHE[tipo];
  }
  nav.detalhe = { tipo, id, sub: sub || "geral" };
  publicar();
  window.scrollTo({ top: 0 });
}

export function mudarSubAba(sub: string) {
  if (nav.detalhe) {
    nav.detalhe = { ...nav.detalhe, sub };
    trocaSemHistorico = true; // sub-aba não vira degrau no "voltar"
    publicar();
  }
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
