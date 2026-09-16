/* Cabeçalho do site: marca, indicador "salvo às..." (ligado direto no Banco),
   botão sair e a navegação entre os oito ambientes. */
import { useSyncExternalStore } from "react";
import { Banco, type StatusSalvamento } from "../../services/banco";
import { sair } from "../../services/sessao";
import { AMBIENTES, irParaAmbiente, usarNavegacao } from "../../store/navegacao";

/** Indicador de salvamento, sincronizado com a camada de armazenamento. */
function usarStatusBanco(): StatusSalvamento {
  return useSyncExternalStore(
    (cb) => Banco.aoMudarStatus(cb),
    () => Banco.statusAtual(),
  );
}

export function Cabecalho({ emailUsuario }: { emailUsuario: string | null }) {
  const nav = usarNavegacao();
  const status = usarStatusBanco();

  return (
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
  );
}
