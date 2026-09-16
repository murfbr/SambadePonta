/* Campos de escolha única simples: select (tipo "sel") e data (tipo "date"). */
import type { PropsCampo } from "../tipos";

export function CampoSelecao({ r, c, alterar }: PropsCampo) {
  const texto = typeof r.valores[c.n] === "string" ? (r.valores[c.n] as string) : "";
  return (
    <select name={c.n} value={texto} onChange={(e) => alterar((copia) => { copia.valores[c.n] = e.target.value; })}>
      <option value="" />
      {(c.opts || []).map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

export function CampoData({ r, c, alterar }: PropsCampo) {
  const texto = typeof r.valores[c.n] === "string" ? (r.valores[c.n] as string) : "";
  return (
    <input type="date" name={c.n} className="curto" value={texto}
      onChange={(e) => alterar((copia) => { copia.valores[c.n] = e.target.value; })} />
  );
}
