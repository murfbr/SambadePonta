/* Lista de editais e fontes de captação — abertos primeiro. */
import { usarCentral } from "../../store/central";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { ESFERAS, STATUS_EDITAL } from "../../types";

export function ListaEditais() {
  const { painel } = usarCentral();
  const ordem: Record<string, number> = { open: 0, prev: 1, closed: 2 };
  const editais = [...painel.editais].sort((a, b) => (ordem[a.status] ?? 1) - (ordem[b.status] ?? 1));
  return (
    <>
      <CabecalhoSecao titulo="Editais & fontes" sub="clique numa ficha pra abrir tudo do edital — abertos aparecem primeiro">
        <button className="btn" onClick={() => abrirNovo("edital")}>+ Novo edital</button>
      </CabecalhoSecao>
      <div className="grid g2">
        {editais.map((e) => {
          const esf = ESFERAS[e.esfera] || { rotulo: "—", classe: "" };
          const st = STATUS_EDITAL[e.status] || STATUS_EDITAL.open;
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
      </div>
    </>
  );
}
