/* Pessoas: elenco/colaboradores (tabela), equipe do coletivo (cards com funções
   e e-mail p/ convites) e contatos externos (tabela). */
import { usarCentral } from "../banco/dados";
import { abrirEdicao, abrirNovo } from "../estado/edicao";
import { Shead } from "./comuns";

export function VisaoElenco() {
  const { painel } = usarCentral();
  return (
    <>
      <Shead titulo="Elenco / Colaboradores" sub="músicos e técnicos que entram nos editais — bio e documentos">
        <button className="btn" onClick={() => abrirNovo("elenco")}>+ Colaborador</button>
      </Shead>
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

export function VisaoEquipe() {
  const { painel } = usarCentral();
  return (
    <>
      <Shead titulo="Equipe do coletivo" sub="pessoas a quem você designa tarefas; o e-mail alimenta os convites de reunião">
        <button className="btn" onClick={() => abrirNovo("equipe")}>+ Pessoa</button>
      </Shead>
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

export function VisaoContatos() {
  const { painel } = usarCentral();
  return (
    <>
      <Shead titulo="Contatos externos" sub="patrocinadores, órgãos e responsáveis por editais">
        <button className="btn" onClick={() => abrirNovo("contato")}>+ Contato</button>
      </Shead>
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
