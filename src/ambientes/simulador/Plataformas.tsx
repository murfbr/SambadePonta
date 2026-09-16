/* Plataformas: a parte de conhecimento do Simulador — como cada sistema funciona
   (arquitetura, armadilhas) e a tabela do que já está mapeado e migrado. */
import { PLATAFORMAS, REGISTRO, nomePlataforma } from "../../dados/estaticos";

export function Plataformas() {
  return (
    <>
      <div className="shead">
        <div>
          <h2>Plataformas</h2>
          <p className="sub">Como cada sistema funciona e quais formulários já estão mapeados. É a parte de conhecimento do Simulador.</p>
        </div>
      </div>

      <div className="plats">
        {PLATAFORMAS.map((p) => (
          <div className="plat-card" key={p.id}>
            <h3>{p.nome}</h3>
            <p className="org">{p.orgao}</p>
            <dl className="kv">
              <dt>Arquitetura</dt><dd>{p.arq}</dd>
              <dt>Porta de entrada</dt><dd>{p.porta}</dd>
              <dt>Códigos de campo</dt><dd>{p.codigos}</dd>
              <dt>Limites</dt><dd>{p.limites}</dd>
              <dt>Anexos</dt><dd>{p.anexos}</dd>
            </dl>
            <div className="arm"><b>Armadilhas:</b> {p.armadilhas}</div>
          </div>
        ))}
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>Formulários mapeados</div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Formulário</th><th>Plataforma</th><th>Etapas</th><th>Campos</th>
              <th>Extraído em</th><th>Mapeamento</th><th>No Simulador</th><th>Peças especiais</th>
            </tr>
          </thead>
          <tbody>
            {REGISTRO.map((x) => (
              <tr key={x.id}>
                <td>{x.nome}</td>
                <td>{nomePlataforma(x.plataforma)}</td>
                <td className="num">{x.etapas}</td>
                <td className="num">{x.campos ?? "—"}</td>
                <td>{x.extraido}</td>
                <td><span className={"chip " + (x.mapeamento === "atual" ? "ok" : "at")}>{x.mapeamento}</span></td>
                <td>
                  {x.migrado
                    ? <span className="chip ok">migrado</span>
                    : <a href={x.antigo} target="_blank" rel="noopener noreferrer">artefato antigo</a>}
                </td>
                <td>{x.especiais || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
