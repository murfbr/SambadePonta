/* Portfólio: cards de artistas e projetos + as fichas completas de cada um.
   A ficha do artista tem sub-abas (geral, portfólio, documentos, fotos, links,
   marca) alimentadas pelo acervo `det`; a do projeto tem candidaturas, produção,
   equipe e tarefas. */
import type { ReactNode } from "react";
import { porId, salvarRegistro, usarCentral } from "../banco/dados";
import { abrirDetalhe, fecharDetalhe, mudarSubAba } from "../estado/navegacao";
import { abrirEdicao, abrirNovo } from "../estado/edicao";
import { Shead, nomeArtistaDe, nomeEdital, nomeEquipe, rotuloOrigem, badgeTarefa } from "./comuns";
import { ETAPAS_PIPELINE } from "../tipos";
import { clonar } from "../util";

/* ══════════ Artistas ══════════ */

export function VisaoArtistas() {
  const { painel } = usarCentral();
  return (
    <>
      <Shead titulo="Artistas" sub="clique numa ficha pra abrir o ambiente completo">
        <button className="btn" onClick={() => abrirNovo("artista")}>+ Novo artista</button>
      </Shead>
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

const SUBS_ARTISTA: [string, string][] = [
  ["geral", "Geral"], ["portfolio", "Portfólio cultural"], ["docs", "Documentos"],
  ["fotos", "Fotos"], ["links", "Links"], ["marca", "Manual de marca"],
];

export function FichaArtista({ id, sub }: { id: string; sub: string }) {
  usarCentral();
  const a = porId("artistas", id)!;
  const d = a.det;

  let corpo;
  if (!d) {
    corpo = <div className="panel"><p className="muted">Ficha ainda a preencher. As sub-abas já existem — edite o artista para começar a alimentar.</p></div>;
  } else if (sub === "geral") {
    corpo = (
      <>
        <div className="panel">
          <h4>Dados gerais</h4>
          {Object.entries(d.geral || {}).map(([k, v]) => (
            <div className="row-line" key={k}>
              <span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>{k}</span><b>{v}</b>
            </div>
          ))}
        </div>
        <div className="panel">
          <h4>Sobre</h4>
          <p style={{ margin: 0 }}>{a.bio}</p>
          <div style={{ marginTop: 8 }}>{(a.tags || []).map((t) => <span className="chip" key={t}>{t}</span>)}</div>
        </div>
      </>
    );
  } else if (sub === "portfolio") {
    corpo = (
      <div className="panel">
        <h4>Histórico &amp; realizações</h4>
        {(d.portfolio || []).map((item, i) => (
          <div className="row-line" key={i}><span className="yr">{item.ano}</span><span>{item.texto}</span></div>
        ))}
      </div>
    );
  } else if (sub === "docs") {
    corpo = (
      <div className="panel">
        <h4>Documentos</h4>
        {(d.docs || []).map((doc, i) => (
          <div className="docitem" key={i}>
            <span style={{ flex: 1 }}>{doc.nome}</span>
            <span className={"badge " + (doc.status === "ok" ? "pill-ok" : "pill-pend")}>{doc.status === "ok" ? "anexado" : "pendente"}</span>
          </div>
        ))}
        <p className="hint" style={{ marginTop: 12 }}>Esse acervo abastece o checklist de documentos das candidaturas deste artista.</p>
      </div>
    );
  } else if (sub === "fotos") {
    corpo = (
      <div className="panel">
        <h4>Fotos</h4>
        <div className="photos">
          {Array.from({ length: d.fotos || 0 }).map((_, i) => <div className="photo" key={i}>Foto {i + 1}</div>)}
        </div>
      </div>
    );
  } else if (sub === "links") {
    corpo = (
      <div className="panel">
        <h4>Links</h4>
        {(d.links || []).map((l, i) => (
          <div className="row-line" key={i}>
            <span className="yr" style={{ flexBasis: "auto", color: "var(--accent)" }}>↗</span>
            <span><b>{l.rotulo}</b> <span className="muted">— {l.url}</span></span>
          </div>
        ))}
      </div>
    );
  } else if (sub === "marca") {
    corpo = (
      <div className="panel">
        <h4>Manual de marca</h4>
        <div style={{ marginBottom: 14 }}>
          {(d.marca?.cores || []).map((c) => (
            <span className="swatch" key={c}><span className="sw" style={{ background: c }} /><span className="lb">{c}</span></span>
          ))}
        </div>
        <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Logo</span><b>{d.marca?.logo}</b></div>
        <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Tipografia</span><b>{d.marca?.fonte}</b></div>
        <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Observações</span><span>{d.marca?.obs}</span></div>
      </div>
    );
  }

  return (
    <>
      <button className="back" onClick={fecharDetalhe}>← Voltar para Artistas</button>
      <div className="dhead">
        <div className="avatar">{a.nome[0]}</div>
        <div>
          <h2>{a.nome}</h2>
          <span className="badge b-type">{a.tipo}</span>{" "}
          <span className="muted" style={{ fontSize: 12.5 }}>· {a.enq} · {a.mun}</span>
        </div>
        <span className="act"><button className="btn ghost sm" onClick={() => abrirEdicao("artista", a.id)}>Editar</button></span>
      </div>
      <div className="subtabs">
        {SUBS_ARTISTA.map(([k, rotulo]) => (
          <button key={k} className={sub === k ? "on" : ""} onClick={() => mudarSubAba(k)}>{rotulo}</button>
        ))}
      </div>
      {corpo}
    </>
  );
}

/* ══════════ Projetos ══════════ */

export function VisaoProjetos() {
  const { painel } = usarCentral();
  return (
    <>
      <Shead titulo="Projetos" sub="cada projeto reúne candidaturas, produção e equipe">
        <button className="btn" onClick={() => abrirNovo("projeto")}>+ Novo projeto</button>
      </Shead>
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

const SUBS_PROJETO: [string, string][] = [
  ["geral", "Visão geral"], ["cand", "Candidaturas"], ["prod", "Produção"], ["equipe", "Equipe"], ["tar", "Tarefas"],
];

export function FichaProjeto({ id, sub }: { id: string; sub: string }) {
  const { painel } = usarCentral();
  const p = porId("projetos", id)!;
  const cands = painel.candidaturas.filter((c) => c.projetoId === p.id);

  /** Alterna o status de um item de produção (a fazer → em andamento → feito). */
  function girarProducao(indice: number) {
    const copia = clonar(p);
    const ordem = ["fazer", "and", "feito"];
    const atual = copia.producao[indice];
    atual.status = ordem[(ordem.indexOf(atual.status) + 1) % 3];
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
              className={"badge " + (item.status === "feito" ? "pill-ok" : item.status === "and" ? "st-prev" : "b-type")}
              style={{ cursor: "pointer" }}
              title="clique para mudar o status"
              onClick={() => girarProducao(i)}
            >
              {item.status === "feito" ? "feito" : item.status === "and" ? "em andamento" : "a fazer"}
            </span>
          </div>
        ))}
        {!(p.producao || []).length && <p className="muted" style={{ margin: 0 }}>—</p>}
        <p className="hint" style={{ marginTop: 12 }}>Necessidades de produção, independentes de edital. Clique no status para avançar.</p>
      </div>
    );
  } else if (sub === "equipe") {
    corpo = (
      <div className="panel">
        <h4>Equipe alocada</h4>
        {(p.equipeIds || []).map((eqId) => {
          const pessoa = porId("equipe", eqId);
          return pessoa ? (
            <div className="row-line" key={eqId}>
              <span className="dot" style={{ marginRight: 8 }}>{pessoa.nome[0]}</span>
              <span>{pessoa.nome} <span className="muted">· {(pessoa.funcoes || []).join(", ")}</span></span>
            </div>
          ) : null;
        })}
        {!(p.equipeIds || []).length && <p className="muted" style={{ margin: 0 }}>—</p>}
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
        {SUBS_PROJETO.map(([k, rotulo]) => (
          <button key={k} className={sub === k ? "on" : ""} onClick={() => mudarSubAba(k)}>{rotulo}</button>
        ))}
      </div>
      {corpo}
    </>
  );
}
