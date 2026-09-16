/* Lateral do editor: a seção Interno + as etapas do formulário, com percentual
   preenchido e os agrupadores do menu (Salic). */
import { porId } from "../../../store/mutacoes";
import { FORMULARIOS } from "../../../data";
import { pctEtapa } from "../../../lib/simulador/motor";
import type { Rascunho } from "../../../types";

interface Props {
  r: Rascunho;
  vista: string;
  etapaAberta: number;
  aoMudarVista: (vista: "interno" | "etapa", ei?: number) => void;
}

export function LateralEtapas({ r, vista, etapaAberta, aoMudarVista }: Props) {
  const f = FORMULARIOS[r.form];
  const candidatura = porId("candidaturas", r.ref);
  const docsTodos = [...(candidatura?.docs || []), ...r.interno.docs];
  const docsProntos = docsTodos.filter((d) => d.ok).length;

  return (
    <>
      <div className="eyebrow">interno</div>
      <button className={"int" + (vista === "interno" ? " on" : "")} onClick={() => aoMudarVista("interno")}>
        <span className="k">◐</span>Geral
        <span className="pct">{docsTodos.length ? `${docsProntos}/${docsTodos.length} docs` : ""}</span>
      </button>
      <div className="eyebrow sep">{f.nav === "lateral" ? "menu da proposta" : "etapas"}</div>
      {f.etapas.map((e, k) => (
        <span key={e.id}>
          {e.grupo && (k === 0 || f.etapas[k - 1].grupo !== e.grupo) && <div className="eyebrow grp">{e.grupo}</div>}
          <button
            className={(vista === "etapa" && etapaAberta === k ? "on " : "") + (e.grupo ? "sub" : "")}
            onClick={() => { aoMudarVista("etapa", k); window.scrollTo({ top: 0 }); }}>
            <span className="k">{f.nav === "lateral" ? "" : e.cod || k + 1}</span>
            {e.nome}
            <span className="pct">{pctEtapa(r, k)}%</span>
          </button>
        </span>
      ))}
      <div className="obs">{f.obs || ""}</div>
    </>
  );
}
