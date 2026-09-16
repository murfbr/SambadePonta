/* Ficha do projeto: visão geral, candidaturas, checklist de produção
   (giro de status no clique, adicionar e remover itens), equipe alocada e
   tarefas ligadas. */
import { useState, type ReactNode } from "react";
import { usarCentral } from "../../store/central";
import { porId, salvarRegistro } from "../../store/mutacoes";
import { abrirDetalhe, fecharDetalhe, mudarSubAba } from "../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { badgeTarefa, nomeArtistaDe, nomeEdital, nomeEquipe, rotuloOrigem } from "../../lib/nomes";
import { ETAPAS_PIPELINE } from "../../types";
import { clonar } from "../../utils";

const SUB_ABAS: [string, string][] = [
  ["geral", "Visão geral"], ["cand", "Candidaturas"], ["prod", "Produção"], ["equipe", "Equipe"], ["tar", "Tarefas"],
];

export function FichaProjeto({ id, sub }: { id: string; sub: string }) {
  const { painel } = usarCentral();
  const p = porId("projetos", id)!;
  const cands = painel.candidaturas.filter((c) => c.projetoId === p.id);
  const [novoItem, setNovoItem] = useState("");

  /** Alterna o status de um item de produção (a fazer → em andamento → feito). */
  function girarProducao(indice: number) {
    const copia = clonar(p);
    const ordem = ["fazer", "and", "feito"];
    const atual = copia.producao[indice];
    atual.status = ordem[(ordem.indexOf(atual.status) + 1) % 3];
    salvarRegistro("projetos", copia);
  }

  function adicionarProducao() {
    const texto = novoItem.trim();
    if (!texto) return;
    const copia = clonar(p);
    copia.producao = [...(copia.producao || []), { texto, status: "fazer" }];
    salvarRegistro("projetos", copia);
    setNovoItem("");
  }

  function removerProducao(indice: number) {
    const copia = clonar(p);
    copia.producao.splice(indice, 1);
    salvarRegistro("projetos", copia);
  }

  let corpo;
  if (sub === "geral") {
    const linha = (rotulo: string, valor: ReactNode) => (
      <div className="row-line"><span className="yr" style={{ flexBasis: 150, color: "var(--muted)" }}>{rotulo}</span><b>{valor}</b></div>
    );
    corpo = (
      <div className="panel">
        <h4>Dados do projeto</h4>
        {linha("Artista", nomeArtistaDe(p))}
        {linha("Tipo", p.tipo)}
        {linha("Meta de captação", p.meta)}
        {linha("Janela", p.ano)}
        {linha("Candidaturas", cands.length)}
      </div>
    );
  } else if (sub === "cand") {
    corpo = (
      <div className="panel">
        <h4>Candidaturas deste projeto
          <span className="act"><button className="btn sm" onClick={() => abrirNovo("candidatura", { projetoId: p.id })}>+ Candidatura</button></span>
        </h4>
        {cands.map((c) => (
          <div className="row-line" style={{ cursor: "pointer" }} key={c.id} onClick={() => abrirDetalhe("cand", c.id)}>
            <span style={{ flex: 1 }}>
              <b>{nomeEdital(c)}</b>
              <div className="muted">{c.valor || "—"} · {ETAPAS_PIPELINE[c.etapa]}</div>
            </span>
            <span className="arrow">→</span>
          </div>
        ))}
        {!cands.length && <p className="muted" style={{ margin: 0 }}>Nenhuma candidatura ainda.</p>}
        <p className="hint" style={{ marginTop: 12 }}>Cada uma vira um cartão no Pipeline. O mesmo projeto persegue várias fontes.</p>
      </div>
    );
  } else if (sub === "prod") {
    corpo = (
      <div className="panel">
        <h4>Checklist de produção</h4>
        {(p.producao || []).map((item, i) => (
          <div className="docitem" key={i}>
            <span style={{ flex: 1 }}>{item.texto}</span>
            <span
              className={"badge clicavel " + (item.status === "feito" ? "pill-ok" : item.status === "and" ? "st-prev" : "b-type")}
              title="clique para mudar o status"
              onClick={() => girarProducao(i)}
            >
              {item.status === "feito" ? "feito" : item.status === "and" ? "em andamento" : "a fazer"}
            </span>
            <button className="rm" title="remover item" onClick={() => removerProducao(i)}>×</button>
          </div>
        ))}
        {!(p.producao || []).length && <p className="muted" style={{ margin: 0 }}>nenhum item ainda — adicione abaixo</p>}
        <div className="add-linha">
          <input value={novoItem} placeholder="novo item (ex.: fechar orçamento de som)"
            onChange={(e) => setNovoItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") adicionarProducao(); }} />
          <button className="btn sm" onClick={adicionarProducao}>+ adicionar</button>
        </div>
        <p className="hint" style={{ marginTop: 12 }}>Necessidades de produção, independentes de edital. Clique no status para avançar; itens não concluídos aparecem nas Pendências.</p>
      </div>
    );
  } else if (sub === "equipe") {
    corpo = (
      <div className="panel">
        <h4>Equipe alocada
          <span className="act"><button className="btn ghost sm" onClick={() => abrirEdicao("projeto", p.id)}>editar</button></span>
        </h4>
        {(p.equipeIds || []).map((eqId) => {
          const pessoa = porId("equipe", eqId);
          return pessoa ? (
            <div className="row-line" key={eqId}>
              <span className="dot" style={{ marginRight: 8 }}>{pessoa.nome[0]}</span>
              <span>{pessoa.nome} <span className="muted">· {(pessoa.funcoes || []).join(", ")}</span></span>
            </div>
          ) : null;
        })}
        {!(p.equipeIds || []).length && <p className="muted" style={{ margin: 0 }}>ninguém alocado — use o "editar" e marque as pessoas em "Equipe alocada"</p>}
      </div>
    );
  } else if (sub === "tar") {
    const tarefas = painel.tarefas.filter((t) => t.origem === "proj:" + p.id || cands.some((c) => t.origem === "cand:" + c.id));
    corpo = (
      <div className="panel">
        <h4>Tarefas do projeto
          <span className="act"><button className="btn sm" onClick={() => abrirNovo("tarefa", { origem: "proj:" + p.id })}>+ Tarefa</button></span>
        </h4>
        {tarefas.map((t) => {
          const b = badgeTarefa(t);
          return (
            <div className="docitem" key={t.id}>
              <span style={{ flex: 1 }}>{t.titulo} <span className="muted">· {nomeEquipe(t.respId)} · {rotuloOrigem(t.origem)}</span></span>
              <span className={"badge " + b.classe}>{b.rotulo}</span>
            </div>
          );
        })}
        {!tarefas.length && <p className="muted" style={{ margin: 0 }}>Nenhuma tarefa ainda.</p>}
        <p className="hint" style={{ marginTop: 12 }}>Inclui as tarefas do projeto e das suas candidaturas — as mesmas aparecem no quadro de Tarefas.</p>
      </div>
    );
  }

  return (
    <>
      <button className="back" onClick={fecharDetalhe}>← Voltar para Projetos</button>
      <div className="dhead">
        <div className="avatar">{p.nome.replace(/[^A-Za-zÀ-ÿ0-9]/g, "")[0] || "P"}</div>
        <div>
          <h2>{p.nome}</h2>
          <span className="badge b-type">{p.tipo}</span>{" "}
          <span className="muted" style={{ fontSize: 12.5 }}>· {nomeArtistaDe(p)} · meta {p.meta}</span>
        </div>
        <span className="act"><button className="btn ghost sm" onClick={() => abrirEdicao("projeto", p.id)}>Editar</button></span>
      </div>
      <div className="subtabs">
        {SUB_ABAS.map(([k, rotulo]) => (
          <button key={k} className={sub === k ? "on" : ""} onClick={() => mudarSubAba(k)}>{rotulo}</button>
        ))}
      </div>
      {corpo}
    </>
  );
}
