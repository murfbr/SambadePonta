/* Contatos externos: patrocinadores, órgãos e responsáveis por editais. */
import { usarCentral } from "../../store/central";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";

export function Contatos() {
  const { painel } = usarCentral();
  return (
    <>
      <CabecalhoSecao titulo="Contatos externos" sub="patrocinadores, órgãos e responsáveis por editais">
        <button className="btn" onClick={() => abrirNovo("contato")}>+ Contato</button>
      </CabecalhoSecao>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr><th>Nome</th><th>Tipo</th><th>Referência</th><th>Contato</th><th></th></tr>
          </thead>
          <tbody>
            {painel.contatos.map((c) => (
              <tr key={c.id}>
                <td><b>{c.nome}</b></td>
                <td>{c.tipo}</td>
                <td>{c.ref}</td>
                <td className="muted">{c.contato}</td>
                <td><span className="lnk" onClick={() => abrirEdicao("contato", c.id)}>editar</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
