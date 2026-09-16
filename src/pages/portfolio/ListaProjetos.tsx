/* Lista de projetos: um card por projeto, com artista, meta e janela —
   busca, filtro por artista e ordenação. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { nomeArtistaDe } from "../../lib/nomes";
import { comparar } from "../../utils";

export function ListaProjetos() {
  const { painel } = usarCentral();
  const [busca, setBusca] = useState("");
  const [filtroArtista, setFiltroArtista] = useState("");
  const [ordem, setOrdem] = useState("");

  const projetos = painel.projetos.filter((p) =>
    (!filtroArtista || p.artistaId === filtroArtista) &&
    (!busca || (p.nome + " " + p.tipo + " " + nomeArtistaDe(p)).toLowerCase().includes(busca.toLowerCase())));
  if (ordem === "nome") projetos.sort((a, b) => comparar(a.nome, b.nome));
  if (ordem === "artista") projetos.sort((a, b) => comparar(nomeArtistaDe(a), nomeArtistaDe(b)));
  if (ordem === "ano") projetos.sort((a, b) => comparar(a.ano, b.ano));
  if (ordem === "recentes") projetos.sort((a, b) => (b.atualizado || "").localeCompare(a.atualizado || ""));

  return (
    <>
      <CabecalhoSecao titulo="Projetos" sub="cada projeto reúne candidaturas, produção e equipe">
        <button className="btn" onClick={() => abrirNovo("projeto")}>+ Novo projeto</button>
      </CabecalhoSecao>

      <BarraFiltros mostrando={projetos.length} total={painel.projetos.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar projeto ou artista…" />
        <SeletorFiltro valor={filtroArtista} aoMudar={setFiltroArtista} rotuloTodos="todos os artistas"
          opcoes={painel.artistas.map((a) => ({ valor: a.id, rotulo: a.nome }))} />
        <SeletorFiltro valor={ordem} aoMudar={setOrdem} rotuloTodos="ordem do quadro"
          opcoes={[
            { valor: "nome", rotulo: "nome A→Z" },
            { valor: "artista", rotulo: "por artista" },
            { valor: "ano", rotulo: "por janela" },
            { valor: "recentes", rotulo: "editados por último" },
          ]} />
      </BarraFiltros>

      <div className="grid g3">
        {projetos.map((p) => (
          <div className="card click" key={p.id} onClick={() => abrirDetalhe("projeto", p.id)}>
            <button className="edit" onClick={(e) => { e.stopPropagation(); abrirEdicao("projeto", p.id); }}>editar</button>
            <span className="badge b-type">{p.tipo}</span>
            <h3 style={{ marginTop: 9 }}>{p.nome}</h3>
            <p className="role">{nomeArtistaDe(p)}</p>
            <div className="kv"><span>Meta:</span> <b>{p.meta}</b></div>
            <div className="kv"><span>Janela:</span> <b>{p.ano}</b></div>
            <div className="foot">
              {painel.candidaturas.filter((c) => c.projetoId === p.id).length} candidatura(s)
              <span className="arrow">abrir →</span>
            </div>
          </div>
        ))}
        {!projetos.length && <p className="muted">Nenhum projeto com esses filtros.</p>}
      </div>
    </>
  );
}
