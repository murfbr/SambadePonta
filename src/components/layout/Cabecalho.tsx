/* Cabeçalho do site: marca, indicador "salvo às..." (ligado direto no Banco),
   botão sair, busca global e a navegação entre os oito ambientes — o botão
   Agenda mostra quantos prazos pedem atenção (vencidos ou em até 7 dias). */
import { useSyncExternalStore } from "react";
import { Banco, type StatusSalvamento } from "../../services/banco";
import { sair } from "../../services/sessao";
import { usarCentral } from "../../store/central";
import { AMBIENTES, irParaAmbiente, usarNavegacao } from "../../store/navegacao";
import { abrirBusca } from "../BuscaGlobal";
import { contarUrgentes } from "../../lib/prazos";

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
  const { painel } = usarCentral();
  const urgentes = contarUrgentes(painel);

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
          <button className="lupa" onClick={abrirBusca} title="Buscar em tudo (Ctrl+K)">
            🔍 buscar <span className="tecla">ctrl K</span>
          </button>
          {AMBIENTES.map((a) => (
            <button key={a.id} className={a.id === nav.amb ? "on" : ""} onClick={() => irParaAmbiente(a.id)}>
              {a.rotulo}
              {a.id === "agenda" && urgentes > 0 && <span className="amb-badge">{urgentes}</span>}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
