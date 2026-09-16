/* Camada de armazenamento: a mesma API para os dois modos.
   - MODO NUVEM (Firebase configurado): cada coleção é uma coleção do Firestore,
     cada registro um documento. Mudanças chegam em tempo real via onSnapshot.
   - MODO LOCAL (sem Firebase): tudo num espelho em localStorage, com sincronização
     entre abas pelo evento "storage".
   As gravações são adiadas (debounce) por documento, como no artefato original,
   para digitação fluida sem uma gravação por tecla. */
import {
  collection, deleteDoc, doc, onSnapshot, setDoc,
} from "firebase/firestore";
import { db, firebaseAtivo } from "./firebase";
import { clonar, hora } from "../util";

type Documento = Record<string, unknown> & { id: string };
type Mapa = Record<string, Documento>;
/** `confirmado` = o dado veio do servidor (ou é modo local): seguro para decidir semeadura. */
type Observador = (m: Mapa, confirmado: boolean) => void;

const CHAVE_LOCAL = "central-coletivo-local-v1";

/** Texto e cor do indicador "salvo às..." no topo do site. */
export type StatusSalvamento = { texto: string; classe: "" | "ok" | "sv" | "er" };

const espelho: Record<string, Mapa> = carregarEspelho();
const observadores: Record<string, Set<Observador>> = {};
const timers: Record<string, ReturnType<typeof setTimeout>> = {};
const aoStatus: Set<(s: StatusSalvamento) => void> = new Set();
let statusAtual: StatusSalvamento = { texto: "carregando…", classe: "" };

function carregarEspelho(): Record<string, Mapa> {
  try { return JSON.parse(localStorage.getItem(CHAVE_LOCAL) || "{}").colls || {}; }
  catch { return {}; }
}
function salvarEspelho() {
  try { localStorage.setItem(CHAVE_LOCAL, JSON.stringify({ colls: espelho })); } catch { /* sem espaço: segue só em memória */ }
}

function avisar(colecao: string, confirmado = !firebaseAtivo) {
  for (const cb of observadores[colecao] || []) cb(espelho[colecao] || {}, confirmado);
}

function mudarStatus(s: StatusSalvamento) {
  statusAtual = s;
  for (const cb of aoStatus) cb(s);
}

/* No modo local, outras abas avisam via evento "storage". */
if (!firebaseAtivo) {
  window.addEventListener("storage", (e) => {
    if (e.key !== CHAVE_LOCAL) return;
    const novo = carregarEspelho();
    for (const colecao of new Set([...Object.keys(espelho), ...Object.keys(novo)])) {
      if (JSON.stringify(espelho[colecao]) !== JSON.stringify(novo[colecao])) {
        espelho[colecao] = novo[colecao] || {};
        avisar(colecao);
      }
    }
  });
}

export const Banco = {
  /** "nuvem" com Firebase; "local" sem. */
  modo: (firebaseAtivo ? "nuvem" : "local") as "nuvem" | "local",

  statusAtual: () => statusAtual,
  aoMudarStatus(cb: (s: StatusSalvamento) => void) {
    aoStatus.add(cb);
    return () => { aoStatus.delete(cb); };
  },

  /**
   * Conecta uma coleção: devolve o estado atual e chama `cb` a cada mudança
   * (inclusive a primeira carga, no modo nuvem). Devolve função para desligar.
   */
  assinar(colecao: string, cb: Observador): () => void {
    (observadores[colecao] = observadores[colecao] || new Set()).add(cb);
    espelho[colecao] = espelho[colecao] || {};

    if (!firebaseAtivo || !db) {
      // Modo local: o espelho já É o banco.
      cb(espelho[colecao], true);
      mudarStatus({ texto: "salvo só neste navegador", classe: "" });
      return () => observadores[colecao].delete(cb);
    }

    const parar = onSnapshot(
      collection(db, colecao),
      (snap) => {
        const mapa: Mapa = {};
        snap.forEach((d) => { mapa[d.id] = clonar(d.data()) as Documento; });
        // Documentos com gravação pendente aqui não são sobrescritos pelo snapshot.
        for (const chave of Object.keys(timers)) {
          const [c, id] = dividirChave(chave);
          if (c === colecao && espelho[colecao][id]) mapa[id] = espelho[colecao][id];
        }
        espelho[colecao] = mapa;
        salvarEspelho();
        mudarStatus({ texto: snap.metadata.fromCache ? "sincronizando…" : "sincronizado", classe: snap.metadata.fromCache ? "sv" : "ok" });
        avisar(colecao, !snap.metadata.fromCache);
      },
      () => mudarStatus({ texto: "banco indisponível — mudanças ficam na fila", classe: "er" }),
    );
    // Entrega o que já existe no espelho enquanto o primeiro snapshot não chega.
    cb(espelho[colecao], false);
    return () => { observadores[colecao].delete(cb); parar(); };
  },

  /** Estado atual de uma coleção (mapa id → documento). */
  ler(colecao: string): Mapa {
    return espelho[colecao] || {};
  },

  /**
   * Grava um documento com debounce (800 ms; 50 ms quando `rapido`).
   * O espelho e os observadores são atualizados na hora — a rede vem depois.
   */
  gravar(colecao: string, id: string, documento: Documento, rapido = false) {
    const copia = clonar(documento);
    (espelho[colecao] = espelho[colecao] || {})[id] = copia;
    salvarEspelho();
    avisar(colecao);
    const chave = colecao + "/" + id;
    clearTimeout(timers[chave]);
    mudarStatus({ texto: "salvando…", classe: "sv" });
    timers[chave] = setTimeout(() => this.descarregar(colecao, id), rapido ? 50 : 800);
  },

  /** Envia de fato um documento pendente (chamado pelo debounce). */
  async descarregar(colecao: string, id: string) {
    const chave = colecao + "/" + id;
    delete timers[chave];
    const documento = (espelho[colecao] || {})[id];
    if (!documento) return;
    if (!firebaseAtivo || !db) {
      mudarStatus({ texto: "salvo neste navegador " + hora(), classe: "" });
      return;
    }
    try {
      await setDoc(doc(db, colecao, id), documento);
      mudarStatus({ texto: "salvo " + hora(), classe: "ok" });
    } catch {
      mudarStatus({ texto: "sem conexão — salvo na fila local", classe: "er" });
    }
  },

  async apagar(colecao: string, id: string) {
    const chave = colecao + "/" + id;
    clearTimeout(timers[chave]);
    delete timers[chave];
    if (espelho[colecao]) delete espelho[colecao][id];
    salvarEspelho();
    avisar(colecao);
    if (firebaseAtivo && db) {
      try { await deleteDoc(doc(db, colecao, id)); } catch { /* offline: o cache do Firestore enfileira */ }
    }
  },

  /** Há gravações na fila? (usado no aviso de sair da página) */
  pendente(): boolean {
    return Object.keys(timers).length > 0;
  },
};

function dividirChave(chave: string): [string, string] {
  const i = chave.lastIndexOf("/");
  return [chave.slice(0, i), chave.slice(i + 1)];
}

/* Aviso ao fechar a aba com gravações pendentes. */
window.addEventListener("beforeunload", (e) => {
  if (Banco.pendente()) { e.preventDefault(); }
});
