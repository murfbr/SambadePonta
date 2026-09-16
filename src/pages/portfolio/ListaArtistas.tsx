/* Lista de artistas do portfólio: um card por artista, com atalho de edição. */
import { usarCentral } from "../../store/central";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";

export function ListaArtistas() {
  const { painel } = usarCentral();
  return (
    <>
      <CabecalhoSecao titulo="Artistas" sub="clique numa ficha pra abrir o ambiente completo">
        <button className="btn" onClick={() => abrirNovo("artista")}>+ Novo artista</button>
      </CabecalhoSecao>
      <div className="grid g3">
        {painel.artistas.map((a) => (
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
      </div>
    </>
  );
}
