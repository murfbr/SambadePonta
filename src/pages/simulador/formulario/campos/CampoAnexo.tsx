/* Campo de anexo avulso (tipo "anexo"): marca "arquivo pronto" e anota o nome
   ou link do arquivo — o upload é só na plataforma. */
import type { PropsCampo } from "../tipos";

export function CampoAnexo({ r, c, alterar }: PropsCampo) {
  const texto = typeof r.valores[c.n] === "string" ? (r.valores[c.n] as string) : "";
  return (
    <div className="anexo">
      <label className="marca">
        <input type="checkbox" checked={Boolean(r.anexos[c.n])}
          onChange={(e) => alterar((copia) => { copia.anexos[c.n] = e.target.checked; })} />
        {" "}arquivo pronto <span style={{ color: "var(--ink3)" }}>· upload só na plataforma</span>
      </label>
      <input type="text" name={c.n} maxLength={190} placeholder="nome do arquivo ou link" value={texto}
        onChange={(e) => alterar((copia) => { copia.valores[c.n] = e.target.value; })} />
    </div>
  );
}
