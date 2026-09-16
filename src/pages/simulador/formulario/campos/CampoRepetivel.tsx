/* Campo repetível (tipo "rep"): lista de itens com subcampos, como sócios da
   empresa ou a equipe da proposta. */
import type { PropsCampo } from "../tipos";

export function CampoRepetivel({ r, c, alterar }: PropsCampo) {
  const v = r.valores[c.n];
  const itens = Array.isArray(v) ? (v as Record<string, string>[]) : [];

  return (
    <>
      <div className="rep">
        {itens.map((item, i) => (
          <div className="repitem" key={i}>
            <div className="rephead">
              <span>{i + 1}</span>
              <button type="button" className="x" aria-label="remover"
                onClick={() => alterar((copia) => { (copia.valores[c.n] as unknown[]).splice(i, 1); }, true)}>×</button>
            </div>
            {(c.campos || []).map((sub) => {
              const valorSub = item[sub.n!] || "";
              const definirSub = (novo: string) => alterar((copia) => {
                const arr = copia.valores[c.n] as Record<string, string>[];
                (arr[i] = arr[i] || {})[sub.n!] = novo;
              });
              return (
                <label className="replab" key={sub.n}>
                  {sub.l}{sub.req ? <> <span className="req">*</span></> : null}
                  {sub.t === "ta"
                    ? <textarea maxLength={sub.max || undefined} rows={3} value={valorSub} onChange={(e) => definirSub(e.target.value)} />
                    : sub.t === "sel"
                      ? (
                        <select value={valorSub} onChange={(e) => definirSub(e.target.value)}>
                          <option value="" />
                          {(sub.opts || []).map((o) => <option key={o}>{o}</option>)}
                        </select>
                      )
                      : <input type={sub.t === "date" ? "date" : "text"} value={valorSub} onChange={(e) => definirSub(e.target.value)} />}
                </label>
              );
            })}
          </div>
        ))}
      </div>
      <button type="button" className="btn sm" style={{ marginTop: 8 }}
        onClick={() => alterar((copia) => {
          const arr = Array.isArray(copia.valores[c.n]) ? (copia.valores[c.n] as unknown[]) : (copia.valores[c.n] = []);
          (arr as Record<string, string>[]).push({});
        }, true)}>+ adicionar</button>
    </>
  );
}
