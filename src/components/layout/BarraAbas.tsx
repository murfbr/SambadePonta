/* Barra de abas do ambiente ativo. No Simulador, "Formulário" e "Transferência"
   só habilitam com um rascunho aberto. */
import { usarCentral } from "../../store/central";
import { ambienteDe, irParaAba, usarNavegacao } from "../../store/navegacao";

export function BarraAbas() {
  const nav = usarNavegacao();
  const { rascunhos } = usarCentral();
  const ambiente = ambienteDe(nav.amb);
  const rascunhoExiste = nav.rascunhoAberto != null && Boolean(rascunhos[nav.rascunhoAberto]);

  return (
    <nav className="tabs">
      <div className="tabs-in">
        {ambiente.abas.map(([id, rotulo]) => {
          const desligada = nav.amb === "simulador"
            && (id === "formulario" || id === "transferencia")
            && !rascunhoExiste;
          return (
            <button key={id} className={id === nav.aba ? "on" : ""} disabled={desligada} onClick={() => irParaAba(id)}>
              {rotulo}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
