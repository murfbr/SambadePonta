/* Campo de texto longo (tipo "ta"), com contador e o limite real da plataforma. */
import { Contador } from "../Contador";
import type { PropsCampo } from "../tipos";

export function CampoTextoLongo({ r, c, alterar }: PropsCampo) {
  const texto = typeof r.valores[c.n] === "string" ? (r.valores[c.n] as string) : "";
  return (
    <>
      <textarea name={c.n} rows={(c.max || 0) > 1500 ? 9 : (c.max || 0) > 600 ? 6 : 4} value={texto}
        onChange={(e) => alterar((copia) => { copia.valores[c.n] = e.target.value; })} />
      <div className="campo-f">
        <Contador atual={texto.length} max={c.max} />
        {c.max && <span>limite real da plataforma</span>}
      </div>
    </>
  );
}
