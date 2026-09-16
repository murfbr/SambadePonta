/* Equipe do coletivo: cards com funções e e-mail (que alimenta os convites). */
import { usarCentral } from "../../store/central";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";

export function Equipe() {
  const { painel } = usarCentral();
  return (
    <>
      <CabecalhoSecao titulo="Equipe do coletivo" sub="pessoas a quem você designa tarefas; o e-mail alimenta os convites de reunião">
        <button className="btn" onClick={() => abrirNovo("equipe")}>+ Pessoa</button>
      </CabecalhoSecao>
      <div className="grid g3">
        {painel.equipe.map((p) => (
          <div className="card" style={{ padding: 14 }} key={p.id}>
            <button className="edit" onClick={() => abrirEdicao("equipe", p.id)}>editar</button>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span className="dot" style={{ width: 34, height: 34, fontSize: 13 }}>{p.nome[0]}</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 14 }}>{p.nome}</h3>
                {p.nomeCompleto && <div className="muted" style={{ fontSize: 11.5 }}>{p.nomeCompleto}</div>}
                <div style={{ marginTop: 4 }}>
                  {(p.funcoes || []).map((f) => <span className="chip" key={f}>{f}</span>)}
                </div>
                {p.email
                  ? <div className="muted" style={{ fontSize: 11.5, marginTop: 5 }}>✉ {p.email}</div>
                  : <div style={{ fontSize: 11, marginTop: 5, color: "var(--faint)" }}>sem e-mail — add p/ convites</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
