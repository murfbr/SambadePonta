/* Conexão com o Firebase, lida das variáveis de ambiente (.env / Vercel).
   Sem as variáveis, `firebaseAtivo` fica false e o site roda em MODO LOCAL:
   tudo salvo em localStorage, sem login — bom para desenvolver e testar.
   Com as variáveis, entra o Firestore (com cache offline) e o login por e-mail/senha. */
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** true quando as credenciais do Firebase estão configuradas. */
export const firebaseAtivo = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;
let bancoFirestore: Firestore | null = null;
let autenticacao: Auth | null = null;

if (firebaseAtivo) {
  app = initializeApp(config as Record<string, string>);
  // Cache local persistente: o site abre e funciona offline; sincroniza quando voltar a rede.
  bancoFirestore = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  autenticacao = getAuth(app);
}

export const db = bancoFirestore;
export const auth = autenticacao;
