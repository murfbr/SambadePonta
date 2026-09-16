/* Equipe do coletivo: cards com funções e e-mail (que alimenta os convites) —
   busca e ordenação. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { comparar } from "../../utils";

export function Equipe() {
  const { painel } = usarCentral();
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("");

  const equipe = painel.equipe.filter((p) =>
    !busca || [p.nome, p.nomeCompleto || "", p.email || "", ...(p.funcoes || [])].join(" ").toLowerCase().includes(busca.toLowerCase()));
  if (ordem === "nome") equipe.sort((a, b) => comparar(a.nome, b.nome));

  return (
    <>
      <CabecalhoSecao titulo="Equipe do coletivo" sub="pessoas a quem você designa tarefas; o e-mail alimenta os convites de reunião">
        <button className="btn" onClick={() => abrirNovo("equipe")}>+ Pessoa</button>
      </CabecalhoSecao>

      <BarraFiltros mostrando={equipe.length} total={painel.equipe.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar nome, função, e-mail…" />
        <SeletorFiltro valor={ordem} aoMudar={setOrdem} rotuloTodos="ordem do quadro"
          opcoes={[{ valor: "nome", rotulo: "nome A→Z" }]} />
      </BarraFiltros>

      <div className="grid g3">
        {equipe.map((p) => (
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
        {!equipe.length && <p className="muted">Ninguém com essa busca.</p>}
      </div>
    </>
  );
}
