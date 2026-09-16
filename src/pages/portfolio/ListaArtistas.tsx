/* Lista de artistas do portfólio: um card por artista, com atalho de edição,
   busca, filtro por tipo e ordenação. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { comparar } from "../../utils";

export function ListaArtistas() {
  const { painel } = usarCentral();
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [ordem, setOrdem] = useState("");

  const tipos = [...new Set(painel.artistas.map((a) => a.tipo).filter(Boolean))].sort(comparar);
  const artistas = painel.artistas.filter((a) =>
    (!filtroTipo || a.tipo === filtroTipo) &&
    (!busca || [a.nome, a.tipo, a.mun, a.bio, ...(a.tags || [])].join(" ").toLowerCase().includes(busca.toLowerCase())));
  if (ordem === "nome") artistas.sort((a, b) => comparar(a.nome, b.nome));
  if (ordem === "recentes") artistas.sort((a, b) => (b.atualizado || "").localeCompare(a.atualizado || ""));

  return (
    <>
      <CabecalhoSecao titulo="Artistas" sub="clique numa ficha pra abrir o ambiente completo">
        <button className="btn" onClick={() => abrirNovo("artista")}>+ Novo artista</button>
      </CabecalhoSecao>

      <BarraFiltros mostrando={artistas.length} total={painel.artistas.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar nome, cidade, tag…" />
        <SeletorFiltro valor={filtroTipo} aoMudar={setFiltroTipo} rotuloTodos="todos os tipos" opcoes={tipos} />
        <SeletorFiltro valor={ordem} aoMudar={setOrdem} rotuloTodos="ordem do quadro"
          opcoes={[{ valor: "nome", rotulo: "nome A→Z" }, { valor: "recentes", rotulo: "editados por último" }]} />
      </BarraFiltros>

      <div className="grid g3">
        {artistas.map((a) => (
          <div className="card click" key={a.id} onClick={() => abrirDetalhe("artista", a.id)}>
            <button className="edit" onClick={(e) => { e.stopPropagation(); abrirEdicao("artista", a.id); }}>editar</button>
            <span className="badge b-type">{a.tipo}</span>
            <h3 style={{ marginTop: 9 }}>{a.nome}</h3>
            <p className="role">{a.bio}</p>
            <div className="kv"><span>Enquadramento:</span> <b>{a.enq}</b></div>
            <div className="kv"><span>CNPJ:</span> <b>{a.cnpj}</b></div>
            <div className="kv"><span>Sede:</span> <b>{a.mun}</b></div>
            <div className="foot">
              {painel.projetos.filter((p) => p.artistaId === a.id).length} projeto(s)
              <span className="arrow">abrir ficha →</span>
            </div>
          </div>
        ))}
        {!artistas.length && <p className="muted">Nenhum artista com esses filtros.</p>}
      </div>
    </>
  );
}
