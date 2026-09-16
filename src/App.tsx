/* Casca do site: login (quando o Firebase está ativo), cabeçalho com os oito
   ambientes, abas, barra de exportar/importar e a troca de conteúdo.
   O conteúdo em si vive em src/ambientes/. */
import { useEffect, useRef, useSyncExternalStore, type ChangeEvent } from "react";
import { Banco, type StatusSalvamento } from "./banco/banco";
import { firebaseAtivo } from "./banco/firebase";
import { exportarTudo, importarPacote, iniciarDados, usarCentral } from "./banco/dados";
import { sair, usarSessao } from "./banco/sessao";
import {
  AMBIENTES, ambienteDe, irParaAba, irParaAmbiente, usarNavegacao,
} from "./estado/navegacao";
import { Login } from "./blocos/Login";
import { Toast, toast } from "./blocos/Toast";
import { EdicaoRegistro } from "./blocos/EdicaoRegistro";
import { AmbientePainel } from "./ambientes/AmbientePainel";
import { Simulador } from "./ambientes/simulador/Simulador";
import { Contexto } from "./ambientes/contexto/Contexto";

/** Indicador "salvo às..." do cabeçalho, ligado direto no Banco. */
function usarStatusBanco(): StatusSalvamento {
  return useSyncExternalStore(
    (cb) => Banco.aoMudarStatus(cb),
    () => Banco.statusAtual(),
  );
}

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
  const status = usarStatusBanco();
  const arquivoRef = useRef<HTMLInputElement>(null);

  // Liga as 13 coleções (uma vez; a função é idempotente).
  useEffect(() => { iniciarDados(); }, []);

  const ambiente = ambienteDe(nav.amb);
  const rascunhoExiste = nav.rascunhoAberto != null && Boolean(central.rascunhos[nav.rascunhoAberto]);

  function aoImportar(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    arquivo.text().then((texto) => {
      try {
        toast(importarPacote(JSON.parse(texto)));
      } catch (erro) {
        toast("Arquivo inválido: " + (erro as Error).message);
      }
    });
  }

  return (
    <>
      <div className="aviso">
        <b>Cópia interna de trabalho.</b> O Simulador reproduz a estrutura dos formulários só para
        redigir fora das plataformas; não é canal de inscrição, não usa a identidade visual de nenhum
        órgão e a inscrição válida é a feita no site oficial, dentro do prazo.
      </div>

      <header className="top">
        <div className="top-in">
          <div className="brand">
            <h1>Central do Coletivo</h1>
            <p>
              <span className={"dot" + (status.classe ? " " + status.classe : "")} />
              <span>{status.texto}</span> · captação, escrita e contexto dos projetos culturais
              {emailUsuario && <button className="sair" onClick={() => void sair()}>sair ({emailUsuario})</button>}
            </p>
          </div>
          <div className="amb">
            {AMBIENTES.map((a) => (
              <button key={a.id} className={a.id === nav.amb ? "on" : ""} onClick={() => irParaAmbiente(a.id)}>
                {a.rotulo}
              </button>
            ))}
          </div>
        </div>
      </header>

      <nav className="tabs">
        <div className="tabs-in">
          {ambiente.abas.map(([id, rotulo]) => {
            const desligada = nav.amb === "simulador" && (id === "formulario" || id === "transferencia") && !rascunhoExiste;
            return (
              <button key={id} className={id === nav.aba ? "on" : ""} disabled={desligada} onClick={() => irParaAba(id)}>
                {rotulo}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="toolbar">
        <span className="note">
          {Banco.modo === "nuvem"
            ? "Tudo o que você edita aqui fica salvo no banco do coletivo e aparece para quem mais estiver no site. Exportar gera um .json com Painel, rascunhos e contexto."
            : "Sem Firebase configurado: tudo fica salvo só neste navegador. Configure o .env para sincronizar com o coletivo."}
        </span>
        <span className="sp">
          <button className="btn ghost sm" onClick={exportarTudo}>⤓ Exportar tudo</button>
          <button className="btn ghost sm" onClick={() => arquivoRef.current?.click()}>⤒ Importar</button>
          <input ref={arquivoRef} type="file" accept="application/json" style={{ display: "none" }} onChange={aoImportar} />
        </span>
      </div>

      {!central.pronto && Banco.modo === "nuvem" ? (
        <div className="carregando-tela">carregando os dados do coletivo…</div>
      ) : nav.amb === "simulador" ? (
        <Simulador />
      ) : nav.amb === "contexto" ? (
        <Contexto />
      ) : (
        <div className="wrap"><AmbientePainel /></div>
      )}

      <EdicaoRegistro />
      <Toast />
    </>
  );
}
