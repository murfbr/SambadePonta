/* Elenco / colaboradores: tabela de músicos e técnicos que entram nos editais. */
import { usarCentral } from "../../store/central";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";

export function Elenco() {
  const { painel } = usarCentral();
  return (
    <>
      <CabecalhoSecao titulo="Elenco / Colaboradores" sub="músicos e técnicos que entram nos editais — bio e documentos">
        <button className="btn" onClick={() => abrirNovo("elenco")}>+ Colaborador</button>
      </CabecalhoSecao>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr><th>Nome</th><th>Função</th><th>Minibiografia</th><th>Documentos</th><th></th></tr>
          </thead>
          <tbody>
            {painel.elenco.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.nome}</b>
                  {p.nomeCompleto && <div className="muted" style={{ fontSize: 11.5 }}>{p.nomeCompleto}</div>}
                  {p.email && <div className="muted" style={{ fontSize: 11 }}>✉ {p.email}</div>}
                </td>
                <td>{p.funcao}</td>
                <td className="muted">{p.bio}</td>
                <td>
                  <span className={"badge " + (p.docsStatus === "ok" ? "pill-ok" : "pill-pend")}>
                    {p.docsStatus === "ok" ? "docs ok" : "docs pend."}
                  </span>
                </td>
                <td><span className="lnk" onClick={() => abrirEdicao("elenco", p.id)}>editar</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
