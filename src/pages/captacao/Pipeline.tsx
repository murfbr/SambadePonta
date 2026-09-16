/* Pipeline de captação: o kanban onde cada cartão é uma candidatura
   (projeto × edital), movida de etapa pelos botões ◀▶. */
import { usarCentral } from "../../store/central";
import { moverCandidatura } from "../../store/mutacoes";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { editalDe, nomeEdital, nomeEquipe, projetoArtistaDe } from "../../lib/nomes";
import { ETAPAS_PIPELINE } from "../../types";

export function Pipeline() {
  const { painel } = usarCentral();
  return (
    <>
      <CabecalhoSecao titulo="Pipeline de captação" sub="cada cartão é uma candidatura (projeto × edital) — clique pra abrir, use ◀▶ pra mover">
        <button className="btn" onClick={() => abrirNovo("candidatura")}>+ Nova candidatura</button>
      </CabecalhoSecao>
      <div className="kanban">
        {ETAPAS_PIPELINE.map((etapa, i) => {
          const cards = painel.candidaturas.filter((c) => c.etapa === i);
          return (
            <div className="col" key={etapa}>
              <div className="col-h">{etapa}<span className="cnt">{cards.length}</span></div>
              {cards.map((c) => {
                const ed = editalDe(c);
                return (
                  <div className="kcard" key={c.id} onClick={() => abrirDetalhe("cand", c.id)}>
                    <p className="edt">{nomeEdital(c)}</p>
                    <p className="prj">{projetoArtistaDe(c)}</p>
                    <div className="meta">
                      <span className="dot">{nomeEquipe(c.respId)[0] || "?"}</span>
                      {ed?.prazo && <span className="prazo">⏱ {ed.prazo.replace(/\/2026|\/2027/, "")}</span>}
                      {c.result === "ok" && <span className="badge st-ok">aprovado</span>}
                      {c.result === "no" && <span className="badge st-no">reprovado</span>}
                      <span className="navb">
                        <button onClick={(e) => { e.stopPropagation(); moverCandidatura(c, -1); }}>◀</button>
                        <button onClick={(e) => { e.stopPropagation(); moverCandidatura(c, 1); }}>▶</button>
                      </span>
                    </div>
                  </div>
                );
              })}
              {!cards.length && <div style={{ fontSize: 11.5, color: "var(--faint)", padding: 6 }}>—</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}
