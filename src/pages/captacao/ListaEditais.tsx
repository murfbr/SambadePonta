/* Lista de editais e fontes de captação — abertos primeiro (padrão), com
   busca, filtros por esfera/status e outras ordenações. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { ESFERAS, STATUS_EDITAL, type EsferaEdital, type StatusEdital } from "../../types";
import { comparar } from "../../utils";

export function ListaEditais() {
  const { painel } = usarCentral();
  const [busca, setBusca] = useState("");
  const [filtroEsfera, setFiltroEsfera] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [ordem, setOrdem] = useState("status");

  const editais = painel.editais.filter((e) =>
    (!filtroEsfera || e.esfera === filtroEsfera) &&
    (!filtroStatus || e.status === filtroStatus) &&
    (!busca || [e.nome, e.orgao || "", e.mec, e.area, e.teto].join(" ").toLowerCase().includes(busca.toLowerCase())));

  const porStatus: Record<string, number> = { open: 0, prev: 1, closed: 2 };
  if (ordem === "status") editais.sort((a, b) => (porStatus[a.status] ?? 1) - (porStatus[b.status] ?? 1));
  if (ordem === "prazo") editais.sort((a, b) => (a.prazoIso || "9999") < (b.prazoIso || "9999") ? -1 : 1);
  if (ordem === "nome") editais.sort((a, b) => comparar(a.nome, b.nome));
  if (ordem === "recentes") editais.sort((a, b) => (b.atualizado || "").localeCompare(a.atualizado || ""));

  return (
    <>
      <CabecalhoSecao titulo="Editais & fontes" sub="clique numa ficha pra abrir tudo do edital">
        <button className="btn" onClick={() => abrirNovo("edital")}>+ Novo edital</button>
      </CabecalhoSecao>

      <BarraFiltros mostrando={editais.length} total={painel.editais.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar nome, órgão, mecanismo…" />
        <SeletorFiltro valor={filtroEsfera} aoMudar={setFiltroEsfera} rotuloTodos="todas as esferas"
          opcoes={Object.entries(ESFERAS).map(([v, e]) => ({ valor: v, rotulo: e.rotulo }))} />
        <SeletorFiltro valor={filtroStatus} aoMudar={setFiltroStatus} rotuloTodos="qualquer status"
          opcoes={Object.entries(STATUS_EDITAL).map(([v, s]) => ({ valor: v, rotulo: s.rotulo }))} />
        <SeletorFiltro valor={ordem} aoMudar={setOrdem}
          opcoes={[
            { valor: "status", rotulo: "abertos primeiro" },
            { valor: "prazo", rotulo: "prazo mais próximo" },
            { valor: "nome", rotulo: "nome A→Z" },
            { valor: "recentes", rotulo: "editados por último" },
          ]} />
      </BarraFiltros>

      <div className="grid g2">
        {editais.map((e) => {
          const esf = ESFERAS[e.esfera as EsferaEdital] || { rotulo: "—", classe: "" };
          const st = STATUS_EDITAL[e.status as StatusEdital] || STATUS_EDITAL.open;
          const n = painel.candidaturas.filter((c) => c.editalId === e.id).length;
          return (
            <div className="card click" key={e.id} onClick={() => abrirDetalhe("edital", e.id)}>
              <button className="edit" onClick={(ev) => { ev.stopPropagation(); abrirEdicao("edital", e.id); }}>editar</button>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 9 }}>
                <span className={"badge esfera " + esf.classe}>{esf.rotulo}</span>
                <span className={"badge " + st.classe}>{st.rotulo}</span>
                {e.linkDrive && <span className="badge b-type">📁 Drive</span>}
              </div>
              <h3>{e.nome}</h3>
              <p className="role">{e.area}</p>
              {e.orgao && <div className="kv"><span>Órgão:</span> <b>{e.orgao}</b></div>}
              <div className="kv"><span>Mecanismo:</span> <b>{e.mec}</b></div>
              <div className="kv"><span>Teto:</span> <b>{e.teto}</b></div>
              <div className="kv"><span>Prazo:</span> <b>{e.prazo}</b></div>
              <div style={{ marginTop: 8 }}>{(e.eleg || []).map((x) => <span className="chip" key={x}>{x}</span>)}</div>
              <div className="foot">{n} candidatura(s) <span className="arrow">abrir ficha →</span></div>
            </div>
          );
        })}
        {!editais.length && <p className="muted">Nenhum edital com esses filtros.</p>}
      </div>
    </>
  );
}
