/* Checklist de anexos da plataforma (tipo "docs"): marque o que já está
   pronto — o upload em si é só na plataforma oficial. */
import type { PropsCampo } from "../tipos";

export function CampoDocumentos({ r, c, alterar }: PropsCampo) {
  const v = r.valores[c.n];
  const marcados = v && typeof v === "object" ? (v as Record<string, boolean>) : {};

  return (
    <>
      <div className="docs">
        {(c.opts || []).map((o) => {
          const obrigatorio = o.endsWith("*");
          const nome = o.replace(/\*$/, "");
          return (
            <label className={"doc" + (marcados[nome] ? " ok" : "")} key={o}>
              <input type="checkbox" checked={Boolean(marcados[nome])}
                onChange={(e) => alterar((copia) => {
                  const d = (copia.valores[c.n] = (copia.valores[c.n] && typeof copia.valores[c.n] === "object" ? copia.valores[c.n] : {}) as Record<string, boolean>);
                  d[nome] = e.target.checked;
                })} />
              <span>{nome}</span>
              {obrigatorio && <span className="obr">obrigatório</span>}
            </label>
          );
        })}
      </div>
      <div className="campo-f"><span>marque o que já está pronto; o upload é só na plataforma</span></div>
    </>
  );
}
