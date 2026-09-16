/* Campo de múltipla escolha (tipo "chk"): checkboxes, grupos com cabeçalho e
   caixa de filtro nas listas longas (como as 78 áreas socioeconômicas). */
import { useState } from "react";
import type { PropsCampo } from "../tipos";

export function CampoMultiplaEscolha({ r, c, alterar }: PropsCampo) {
  const [filtro, setFiltro] = useState("");
  const v = r.valores[c.n];
  const selecionados = Array.isArray(v) ? (v as string[]) : [];
  const grupos = c.grupos || [{ g: null, op: c.opts || [] }];
  const filtroAtivo = filtro.toLowerCase();

  const alternar = (opcao: string, marcado: boolean) =>
    alterar((copia) => {
      const atual = new Set(Array.isArray(copia.valores[c.n]) ? (copia.valores[c.n] as string[]) : []);
      if (marcado) atual.add(opcao); else atual.delete(opcao);
      copia.valores[c.n] = [...atual];
    });

  return (
    <>
      {Boolean(c.filter) && (
        <input type="text" className="filtro medio" placeholder="filtrar opções…" value={filtro}
          onChange={(e) => setFiltro(e.target.value)} />
      )}
      <div className="opts chk">
        {grupos.map((g, gi) => (
          <span style={{ display: "contents" }} key={gi}>
            {g.g && <div className="grp-h">{g.g}</div>}
            {g.op.map((o) => {
              const escondida = Boolean(filtroAtivo) && !o.toLowerCase().includes(filtroAtivo);
              return (
                <label className={"opt" + (selecionados.includes(o) ? " sel" : "")} key={o} hidden={escondida}>
                  <input type="checkbox" checked={selecionados.includes(o)} onChange={(e) => alternar(o, e.target.checked)} />
                  <span>{o}</span>
                </label>
              );
            })}
          </span>
        ))}
      </div>
    </>
  );
}
