/* Lista de projetos: um card por projeto, com artista, meta e janela. */
import { usarCentral } from "../../store/central";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { nomeArtistaDe } from "../../lib/nomes";

export function ListaProjetos() {
  const { painel } = usarCentral();
  return (
    <>
      <CabecalhoSecao titulo="Projetos" sub="cada projeto reúne candidaturas, produção e equipe">
        <button className="btn" onClick={() => abrirNovo("projeto")}>+ Novo projeto</button>
      </CabecalhoSecao>
      <div className="grid g3">
        {painel.projetos.map((p) => (
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
      </div>
    </>
  );
}
