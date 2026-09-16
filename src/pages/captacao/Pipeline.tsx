/* Pipeline de captação: o kanban onde cada cartão é uma candidatura
   (projeto × edital). Arraste o cartão para outra etapa (soltar sobre um
   cartão insere antes dele); ◀▶ segue funcionando para teclado e toque.
   A barra de cima filtra por busca, edital e responsável. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { definirResultado, moverCandidatura, soltarCandidatura } from "../../store/mutacoes";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { usarArrasto } from "../../lib/arrastar";
import { editalDe, nomeEdital, nomeEquipe, projetoArtistaDe } from "../../lib/nomes";
import { ETAPA_RESULTADO, ETAPAS_PIPELINE, type Candidatura } from "../../types";

/** Botões aprovado/reprovado do cartão na etapa "Aprovado / Reprovado". */
function EscolhaResultado({ c }: { c: Candidatura }) {
  const opcao = (valor: "ok" | "no", classe: string, rotulo: string) => (
    <button className={"badge " + classe + (c.result === valor ? " on" : "")}
      title={"marcar " + rotulo}
      onClick={(e) => { e.stopPropagation(); definirResultado(c, c.result === valor ? undefined : valor); }}>
      {rotulo}
    </button>
  );
  return <span className="resultado">{opcao("ok", "st-ok", "aprovado")}{opcao("no", "st-no", "reprovado")}</span>;
}

export function Pipeline() {
  const { painel } = usarCentral();
  const [busca, setBusca] = useState("");
  const [filtroEdital, setFiltroEdital] = useState("");
  const [filtroResp, setFiltroResp] = useState("");
  const arrasto = usarArrasto<number>(soltarCandidatura);

  const visiveis = painel.candidaturas.filter((c) =>
    (!filtroEdital || c.editalId === filtroEdital) &&
    (!filtroResp || c.respId === filtroResp) &&
    (!busca || (nomeEdital(c) + " " + projetoArtistaDe(c)).toLowerCase().includes(busca.toLowerCase())));

  return (
    <>
      <CabecalhoSecao titulo="Pipeline de captação" sub="cada cartão é uma candidatura (projeto × edital) — arraste entre as etapas, ou use ◀▶">
        <button className="btn" onClick={() => abrirNovo("candidatura")}>+ Nova candidatura</button>
      </CabecalhoSecao>

      <BarraFiltros mostrando={visiveis.length} total={painel.candidaturas.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar projeto, artista ou edital…" />
        <SeletorFiltro valor={filtroEdital} aoMudar={setFiltroEdital} rotuloTodos="todos os editais"
          opcoes={painel.editais.map((e) => ({ valor: e.id, rotulo: e.nome }))} />
        <SeletorFiltro valor={filtroResp} aoMudar={setFiltroResp} rotuloTodos="qualquer responsável"
          opcoes={painel.equipe.map((p) => ({ valor: p.id, rotulo: p.nome }))} />
      </BarraFiltros>

      <div className="kanban">
        {ETAPAS_PIPELINE.map((etapa, i) => {
          const cards = visiveis.filter((c) => c.etapa === i);
          return (
            <div className={"col" + (arrasto.alvo === i ? " col-alvo" : "")} key={etapa}
              {...arrasto.propsColuna(i)}>
              <div className="col-h">{etapa}<span className="cnt">{cards.length}</span></div>
              {cards.map((c) => {
                const ed = editalDe(c);
                return (
                  <div key={c.id}
                    className={"kcard"
                      + (arrasto.arrastando === c.id ? " arrastando" : "")
                      + (arrasto.antesDe === c.id && arrasto.arrastando !== c.id ? " antes-daqui" : "")}
                    onClick={() => abrirDetalhe("cand", c.id)}
                    {...arrasto.propsCartao(c.id, i)}>
                    <p className="edt">{nomeEdital(c)}</p>
                    <p className="prj">{projetoArtistaDe(c)}</p>
                    <div className="meta">
                      <span className="dot">{nomeEquipe(c.respId)[0] || "?"}</span>
                      {ed?.prazo && <span className="prazo">⏱ {ed.prazo.replace(/\/2026|\/2027/, "")}</span>}
                      {i === ETAPA_RESULTADO
                        ? <EscolhaResultado c={c} />
                        : <>
                          {c.result === "ok" && <span className="badge st-ok">aprovado</span>}
                          {c.result === "no" && <span className="badge st-no">reprovado</span>}
                        </>}
                      <span className="navb">
                        <button onClick={(e) => { e.stopPropagation(); moverCandidatura(c, -1); }}>◀</button>
                        <button onClick={(e) => { e.stopPropagation(); moverCandidatura(c, 1); }}>▶</button>
                      </span>
                    </div>
                  </div>
                );
              })}
              {!cards.length && (
                <div className="col-vazia">{arrasto.arrastando ? "solte aqui" : "—"}</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
