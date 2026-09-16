/* Campo de linha única (tipo "txt"), com o limite real da plataforma. */
import { Contador } from "../Contador";
import type { PropsCampo } from "../tipos";

export function CampoTexto({ r, c, alterar }: PropsCampo) {
  const texto = typeof r.valores[c.n] === "string" ? (r.valores[c.n] as string) : "";
  return (
    <>
      <input type="text" name={c.n} className={c.cls || ""} maxLength={c.max || 190} value={texto}
        placeholder={c.ro ? "preenchido pela plataforma" : undefined}
        onChange={(e) => alterar((copia) => { copia.valores[c.n] = e.target.value; })} />
      {c.max && <div className="campo-f"><Contador atual={texto.length} max={c.max} /></div>}
    </>
  );
}
