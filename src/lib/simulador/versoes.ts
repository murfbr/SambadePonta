/* Versões de rascunho: fotografias automáticas do texto das propostas.
   A coleção `versoes` fica FORA do espelho e das assinaturas do site —
   gravação direta e leitura sob demanda (só quando o modal Versões abre),
   com o cache offline do Firestore segurando o que já foi visto. No modo
   local, uma chave própria do localStorage. Além do teto por rascunho,
   as fotografias mais antigas caem quando entra uma nova. */
import {
  collection, deleteDoc, doc, getDocs, query, setDoc, where,
} from "firebase/firestore";
import { db, firebaseAtivo } from "../../services/firebase";
import { emailSessao } from "../../services/sessao";
import { clonar, uid } from "../../utils";
import { temValor } from "./motor";
import type { Rascunho } from "../../types";

export interface VersaoRascunho {
  id: string;
  rascunhoId: string;
  criadoEm: string;
  autor: string;
  rascunho: Rascunho;
}

/** Teto de versões por rascunho (menor no modo local: o localStorage é apertado). */
const TETO = firebaseAtivo ? 20 : 5;
const QUATRO_HORAS = 4 * 3600 * 1000;
const CHAVE_LOCAL = "central-versoes-v1";

/** Rascunhos já verificados nesta sessão: uma fotografia por sessão de escrita. */
const verificados = new Set<string>();

function lerLocais(): Record<string, VersaoRascunho> {
  try { return JSON.parse(localStorage.getItem(CHAVE_LOCAL) || "{}"); } catch { return {}; }
}
function salvarLocais(mapa: Record<string, VersaoRascunho>) {
  try { localStorage.setItem(CHAVE_LOCAL, JSON.stringify(mapa)); } catch { /* sem espaço */ }
}

/** Versões de um rascunho, da mais nova para a mais antiga. */
export async function listarVersoes(rascunhoId: string): Promise<VersaoRascunho[]> {
  let todas: VersaoRascunho[];
  if (firebaseAtivo && db) {
    const resposta = await getDocs(query(collection(db, "versoes"), where("rascunhoId", "==", rascunhoId)));
    todas = resposta.docs.map((d) => d.data() as VersaoRascunho);
  } else {
    todas = Object.values(lerLocais()).filter((v) => v.rascunhoId === rascunhoId);
  }
  return todas.sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)));
}

/** Grava uma fotografia do rascunho agora e poda o que passar do teto. */
export async function fotografar(r: Rascunho): Promise<void> {
  const versao: VersaoRascunho = {
    id: uid(r.id + "-v"),
    rascunhoId: r.id,
    criadoEm: new Date().toISOString(),
    autor: emailSessao(),
    rascunho: clonar(r),
  };
  if (firebaseAtivo && db) {
    // Sem await: offline, a promessa só resolve quando a rede volta — mas a
    // gravação já está na fila persistente do Firestore (sobrevive a reload).
    setDoc(doc(db, "versoes", versao.id), versao as unknown as Record<string, unknown>)
      .catch(() => { /* sem permissão: fica só a fila local do SDK */ });
  } else {
    const mapa = lerLocais();
    mapa[versao.id] = versao;
    salvarLocais(mapa);
  }
  verificados.add(r.id);
  const todas = await listarVersoes(r.id);
  for (const velha of todas.slice(TETO)) apagarVersao(velha.id);
}

export function apagarVersao(id: string) {
  if (firebaseAtivo && db) {
    deleteDoc(doc(db, "versoes", id)).catch(() => { /* offline: o SDK reenvia */ });
  } else {
    const mapa = lerLocais();
    delete mapa[id];
    salvarLocais(mapa);
  }
}

/**
 * Fotografa ao abrir um rascunho — no máximo uma vez a cada 4 horas (e uma
 * verificação por sessão). Chamada com o estado ANTES das edições da sessão;
 * rascunho ainda vazio não gera versão.
 */
export async function talvezFotografar(r: Rascunho): Promise<void> {
  if (verificados.has(r.id)) return;
  verificados.add(r.id); // mesmo se a consulta falhar, não insiste nesta sessão
  const temAlgo = Object.values(r.valores || {}).some(temValor) || Boolean((r.interno?.anot || "").trim());
  if (!temAlgo) return;
  try {
    const [ultima] = await listarVersoes(r.id);
    if (ultima && Date.now() - new Date(ultima.criadoEm).getTime() < QUATRO_HORAS) return;
    await fotografar(r);
  } catch { /* sem acesso agora: tenta na próxima sessão */ }
}
