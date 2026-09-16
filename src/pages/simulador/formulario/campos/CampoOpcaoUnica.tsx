/* Campo de opção única (tipo "rad"), como os rádios da plataforma. */
import type { PropsCampo } from "../tipos";

export function CampoOpcaoUnica({ r, c, alterar }: PropsCampo) {
  const v = r.valores[c.n];
  return (
    <div className={"opts" + (c.inline ? " inline" : "")}>
      {(c.opts || []).map((o) => (
        <label className={"opt" + (o === v ? " sel" : "")} key={o}>
          <input type="radio" name={c.n} value={o} checked={o === v}
            onChange={() => alterar((copia) => { copia.valores[c.n] = o; })} />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}
