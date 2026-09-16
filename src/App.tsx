/* Casca do site: gate de login (modo nuvem), aviso, cabeçalho, abas, barra de
   ferramentas e a troca entre os três grandes roteadores (Painel-família,
   Simulador e Contexto). O conteúdo em si vive em src/pages/. */
import { useEffect } from "react";
import { Banco } from "./services/banco";
import { firebaseAtivo } from "./services/firebase";
import { usarSessao } from "./services/sessao";
import { iniciarDados, usarCentral } from "./store/central";
import { usarNavegacao } from "./store/navegacao";
import { Cabecalho } from "./components/layout/Cabecalho";
import { BarraAbas } from "./components/layout/BarraAbas";
import { BarraFerramentas } from "./components/layout/BarraFerramentas";
import { Toast } from "./components/Toast";
import { FormularioRegistro } from "./forms/FormularioRegistro";
import { Login } from "./pages/Login";
import { RoteadorPainel } from "./pages/RoteadorPainel";
import { Simulador } from "./pages/simulador/Simulador";
import { Contexto } from "./pages/contexto/Contexto";

export default function App() {
  const sessao = usarSessao();

  // Modo nuvem: só entra (e só conecta no banco) depois do login.
  if (firebaseAtivo) {
    if (sessao.carregando) return <div className="carregando-tela">abrindo a Central…</div>;
    if (!sessao.usuario) return <Login />;
  }
  return <Central emailUsuario={sessao.usuario?.email || null} />;
}

function Central({ emailUsuario }: { emailUsuario: string | null }) {
  const nav = usarNavegacao();
  const central = usarCentral();

  // Liga as 13 coleções (uma vez; a função é idempotente).
  useEffect(() => { iniciarDados(); }, []);

  return (
    <>
      <div className="aviso">
        <b>Cópia interna de trabalho.</b> O Simulador reproduz a estrutura dos formulários só para
        redigir fora das plataformas; não é canal de inscrição, não usa a identidade visual de nenhum
        órgão e a inscrição válida é a feita no site oficial, dentro do prazo.
      </div>

      <Cabecalho emailUsuario={emailUsuario} />
      <BarraAbas />
      <BarraFerramentas />

      {!central.pronto && Banco.modo === "nuvem" ? (
        <div className="carregando-tela">carregando os dados do coletivo…</div>
      ) : nav.amb === "simulador" ? (
        <Simulador />
      ) : nav.amb === "contexto" ? (
        <Contexto />
      ) : (
        <div className="wrap"><RoteadorPainel /></div>
      )}

      <FormularioRegistro />
      <Toast />
    </>
  );
}
