/* Sessão de login (Firebase Auth, e-mail e senha).
   As contas são criadas no console do Firebase (Authentication → Users → Add user):
   o site não tem auto-cadastro de propósito — só entra quem o coletivo cadastrar.
   No modo local (sem Firebase) não existe login: o site abre direto. */
import { useSyncExternalStore } from "react";
import {
  onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User,
} from "firebase/auth";
import { auth, firebaseAtivo } from "./firebase";

export interface Sessao {
  /** Ainda esperando o Firebase dizer se há sessão salva. */
  carregando: boolean;
  usuario: User | null;
}

let sessao: Sessao = { carregando: firebaseAtivo, usuario: null };
const assinantes = new Set<() => void>();

if (firebaseAtivo && auth) {
  onAuthStateChanged(auth, (usuario) => {
    sessao = { carregando: false, usuario };
    assinantes.forEach((f) => f());
  });
}

export function usarSessao(): Sessao {
  return useSyncExternalStore(
    (cb) => { assinantes.add(cb); return () => assinantes.delete(cb); },
    () => sessao,
  );
}

/** Entra com e-mail e senha. Lança erro com mensagem em português se falhar. */
export async function entrar(email: string, senha: string) {
  if (!auth) throw new Error("Firebase não configurado");
  try {
    await signInWithEmailAndPassword(auth, email.trim(), senha);
  } catch (e) {
    throw new Error(traduzirErro(e));
  }
}

/** Envia o e-mail de redefinição de senha. */
export async function redefinirSenha(email: string) {
  if (!auth) throw new Error("Firebase não configurado");
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (e) {
    throw new Error(traduzirErro(e));
  }
}

export async function sair() {
  if (auth) await signOut(auth);
}

function traduzirErro(e: unknown): string {
  const codigo = (e as { code?: string })?.code || "";
  const mapa: Record<string, string> = {
    "auth/invalid-credential": "E-mail ou senha incorretos",
    "auth/invalid-email": "E-mail inválido",
    "auth/user-not-found": "E-mail não cadastrado — peça a quem administra para criar sua conta",
    "auth/wrong-password": "Senha incorreta",
    "auth/too-many-requests": "Muitas tentativas — espere um pouco e tente de novo",
    "auth/network-request-failed": "Sem conexão — verifique a internet",
    "auth/missing-password": "Digite a senha",
  };
  return mapa[codigo] || "Não deu para entrar (" + codigo + ")";
}
