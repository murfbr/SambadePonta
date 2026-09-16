/* Linha de regra reutilizada nas fichas: tipo, texto, status e fonte. */
import { textoFonte } from "../../lib/contexto/consultas";
import { ROTULO_TIPO_REGRA, type Regra } from "../../types";

export function LinhaRegra({ r, aoEditar }: { r: Regra; aoEditar: () => void }) {
  return (
    <div className="regra">
      <span className={"tp " + r.tipoRegra}>{ROTULO_TIPO_REGRA[r.tipoRegra]}</span>
      <span className="t">{r.texto} {r.status === "duvida" && <span className="duvida">a confirmar</span>}</span>
      <button className="btn sm quiet" onClick={aoEditar}>editar</button>
      <span className="f">{textoFonte(r.fonte)}</span>
    </div>
  );
}
