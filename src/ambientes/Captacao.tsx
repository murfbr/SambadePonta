/* Captação: o kanban do pipeline (cada cartão = candidatura projeto × edital),
   a lista de editais e as fichas completas de edital e candidatura.
   Daqui também nascem rascunhos no Simulador, quando o edital tem formulário. */
import {
  nomeCandidatura, ligarCandidatura, porId, rascunhosDaCandidatura,
  salvarRascunho, salvarRegistro, usarCentral,
} from "../banco/dados";
import { abrirDetalhe, abrirRascunho, fecharDetalhe, mudarSubAba } from "../estado/navegacao";
import { abrirEdicao, abrirNovo } from "../estado/edicao";
import { documentosPorMecanismo } from "../blocos/EdicaoRegistro";
import { Shead, editalDe, nomeEdital, nomeEquipe, projetoArtistaDe, badgeTarefa } from "./comuns";
import { novoRascunho, pctRascunho } from "./simulador/motor";
import { registroDe } from "../dados/estaticos";
import { ESFERAS, ETAPAS_PIPELINE, STATUS_EDITAL, type Candidatura } from "../tipos";
import { clonar, url } from "../util";

/** Move a candidatura no pipeline; sair da etapa "Aprovado / Reprovado" limpa o resultado. */
function moverCandidatura(c: Candidatura, direcao: -1 | 1) {
  const copia = clonar(c);
  copia.etapa = Math.max(0, Math.min(7, copia.etapa + direcao));
  if (copia.etapa !== 5) delete copia.result;
  salvarRegistro("candidaturas", copia);
}

/* ══════════ Pipeline (kanban) ══════════ */

export function VisaoPipeline() {
  const { painel } = usarCentral();
  return (
    <>
      <Shead titulo="Pipeline de captação" sub="cada cartão é uma candidatura (projeto × edital) — clique pra abrir, use ◀▶ pra mover">
        <button className="btn" onClick={() => abrirNovo("candidatura")}>+ Nova candidatura</button>
      </Shead>
      <div className="kanban">
        {ETAPAS_PIPELINE.map((etapa, i) => {
          const cards = painel.candidaturas.filter((c) => c.etapa === i);
          return (
            <div className="col" key={etapa}>
              <div className="col-h">{etapa}<span className="cnt">{cards.length}</span></div>
              {cards.map((c) => {
                const ed = editalDe(c);
                return (
                  <div className="kcard" key={c.id} onClick={() => abrirDetalhe("cand", c.id)}>
                    <p className="edt">{nomeEdital(c)}</p>
                    <p className="prj">{projetoArtistaDe(c)}</p>
                    <div className="meta">
                      <span className="dot">{nomeEquipe(c.respId)[0] || "?"}</span>
                      {ed?.prazo && <span className="prazo">⏱ {ed.prazo.replace(/\/2026|\/2027/, "")}</span>}
                      {c.result === "ok" && <span className="badge st-ok">aprovado</span>}
                      {c.result === "no" && <span className="badge st-no">reprovado</span>}
                      <span className="navb">
                        <button onClick={(e) => { e.stopPropagation(); moverCandidatura(c, -1); }}>◀</button>
                        <button onClick={(e) => { e.stopPropagation(); moverCandidatura(c, 1); }}>▶</button>
                      </span>
                    </div>
                  </div>
                );
              })}
              {!cards.length && <div style={{ fontSize: 11.5, color: "var(--faint)", padding: 6 }}>—</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ══════════ Editais ══════════ */

export function VisaoEditais() {
  const { painel } = usarCentral();
  const ordem: Record<string, number> = { open: 0, prev: 1, closed: 2 };
  const editais = [...painel.editais].sort((a, b) => (ordem[a.status] ?? 1) - (ordem[b.status] ?? 1));
  return (
    <>
      <Shead titulo="Editais & fontes" sub="clique numa ficha pra abrir tudo do edital — abertos aparecem primeiro">
        <button className="btn" onClick={() => abrirNovo("edital")}>+ Novo edital</button>
      </Shead>
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

const SUBS_EDITAL: [string, string][] = [
  ["geral", "Geral"], ["financia", "O que financia"], ["docs", "Documentos"],
  ["cands", "Candidaturas"], ["obs", "Observações & links"],
];

export function FichaEdital({ id, sub }: { id: string; sub: string }) {
  const { painel } = usarCentral();
  const e = porId("editais", id)!;
  const esf = ESFERAS[e.esfera] || { rotulo: "—", classe: "" };
  const st = STATUS_EDITAL[e.status] || STATUS_EDITAL.open;
  const cands = painel.candidaturas.filter((c) => c.editalId === e.id);

  const LinhaDado = ({ rotulo, valor }: { rotulo: string; valor?: string | number }) => (
    <div className="row-line">
      <span className="yr" style={{ flexBasis: 135, color: "var(--muted)" }}>{rotulo}</span>
      <b>{valor || "—"}</b>
    </div>
  );
  const LinhaLink = ({ rotulo, href }: { rotulo: string; href?: string }) => (
    <div className="row-line">
      <span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>{rotulo}</span>
      {href ? (
        <span><a href={url(href)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontWeight: 600, wordBreak: "break-all" }}>↗ {href}</a></span>
      ) : (
        <span className="muted">— (adicione pelo botão Editar)</span>
      )}
    </div>
  );
  const TextoOuVazio = ({ texto }: { texto?: string }) =>
    texto ? <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{texto}</p> : <p style={{ margin: 0 }}><span className="muted">—</span></p>;

  let corpo;
  if (sub === "geral") {
    corpo = (
      <div className="panel">
        <h4>Dados do edital</h4>
        <LinhaDado rotulo="Esfera" valor={esf.rotulo} />
        <LinhaDado rotulo="Órgão / promotor" valor={e.orgao} />
        <LinhaDado rotulo="Mecanismo" valor={e.mec} />
        <LinhaDado rotulo="Área" valor={e.area} />
        <LinhaDado rotulo="Teto" valor={e.teto} />
        <LinhaDado rotulo="Prazo" valor={e.prazo} />
        <div className="row-line">
          <span className="yr" style={{ flexBasis: 135, color: "var(--muted)" }}>Status</span>
          <span className={"badge " + st.classe}>{st.rotulo}</span>
        </div>
        <div className="row-line">
          <span className="yr" style={{ flexBasis: 135, color: "var(--muted)" }}>Elegibilidade</span>
          <span>{(e.eleg || []).length ? (e.eleg || []).map((x) => <span className="chip" key={x}>{x}</span>) : "—"}</span>
        </div>
        <div className="row-line">
          <span className="yr" style={{ flexBasis: 135, color: "var(--muted)" }}>Verificado</span>
          <span className="muted">{e.verif || "—"}</span>
        </div>
      </div>
    );
  } else if (sub === "financia") {
    corpo = (
      <>
        <div className="panel"><h4>O que financia</h4>{e.objeto ? <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{e.objeto}</p> : <p style={{ margin: 0 }}><span className="muted">A preencher — use o botão Editar.</span></p>}</div>
        <div className="panel"><h4>Quem pode se inscrever</h4><TextoOuVazio texto={e.publico} /></div>
        <div className="panel"><h4>Contrapartidas</h4><TextoOuVazio texto={e.contrapartidas} /></div>
      </>
    );
  } else if (sub === "docs") {
    const docs = e.docsExig || [];
    corpo = (
      <>
        <div className="panel">
          <h4>Documentos exigidos</h4>
          {docs.length
            ? docs.map((d) => <div className="docitem" key={d}><span style={{ flex: 1 }}>{d}</span></div>)
            : <p className="muted" style={{ margin: 0 }}>Ainda não cadastrados — edite o edital para listar.</p>}
          <p className="hint" style={{ marginTop: 12 }}>Referência do que juntar. O checklist de cada candidatura é gerado automaticamente pelo mecanismo do edital.</p>
        </div>
        <div className="panel"><h4>Como se inscrever</h4><TextoOuVazio texto={e.comoInscrever} /></div>
      </>
    );
  } else if (sub === "cands") {
    corpo = (
      <div className="panel">
        <h4>Candidaturas neste edital</h4>
        {cands.map((c) => (
          <div className="row-line" style={{ cursor: "pointer" }} key={c.id} onClick={() => abrirDetalhe("cand", c.id)}>
            <span style={{ flex: 1 }}>
              <b>{projetoArtistaDe(c)}</b>
              <div className="muted">{c.valor || "—"} · {ETAPAS_PIPELINE[c.etapa]}</div>
            </span>
            <span className="arrow">→</span>
          </div>
        ))}
        {!cands.length && <p className="muted" style={{ margin: 0 }}>Nenhuma candidatura neste edital ainda.</p>}
      </div>
    );
  } else if (sub === "obs") {
    corpo = (
      <>
        <div className="panel">
          <h4>Arquivos &amp; links</h4>
          <LinhaLink rotulo="Site do edital" href={e.linkEdital} />
          <LinhaLink rotulo="Pasta no Drive" href={e.linkDrive} />
          <p className="hint" style={{ marginTop: 10 }}>Os PDFs e anexos do edital ficam no Google Drive (pasta 00_Editais) — cole aqui o link da pasta pelo botão Editar.</p>
        </div>
        <div className="panel"><h4>Observações</h4><TextoOuVazio texto={e.obs} /></div>
      </>
    );
  }

  return (
    <>
      <button className="back" onClick={fecharDetalhe}>← Voltar para Editais</button>
      <div className="dhead">
        <div className="avatar" style={{ background: `linear-gradient(135deg, var(--${e.esfera || "accent"}), var(--gold))` }}>
          {esf.rotulo[0] || "E"}
        </div>
        <div>
          <h2>{e.nome}</h2>
          <span className={"badge esfera " + esf.classe}>{esf.rotulo}</span>{" "}
          <span className={"badge " + st.classe}>{st.rotulo}</span>{" "}
          <span className="muted" style={{ fontSize: 12.5 }}>· {e.mec}</span>
        </div>
        <span className="act"><button className="btn ghost sm" onClick={() => abrirEdicao("edital", e.id)}>Editar</button></span>
      </div>
      <div className="subtabs">
        {SUBS_EDITAL.map(([k, rotulo]) => (
          <button key={k} className={sub === k ? "on" : ""} onClick={() => mudarSubAba(k)}>{rotulo}</button>
        ))}
      </div>
      {corpo}
    </>
  );
}

/* ══════════ Ficha da candidatura ══════════ */

export function FichaCandidatura({ id }: { id: string }) {
  const { painel, rascunhos } = usarCentral();
  const c = porId("candidaturas", id)!;
  const projeto = porId("projetos", c.projetoId);
  const edital = porId("editais", c.editalId);
  const artista = projeto && porId("artistas", projeto.artistaId);
  const docs = c.docs || documentosPorMecanismo(edital);
  const tarefas = painel.tarefas.filter((t) => t.origem === "cand:" + c.id);
  const meusRascunhos = rascunhosDaCandidatura(c.id);
  void rascunhos; // o hook acima já garante re-render quando rascunhos mudam

  function alternarDocumento(indice: number) {
    const copia = clonar(c);
    copia.docs = copia.docs || documentosPorMecanismo(edital);
    copia.docs[indice].ok = !copia.docs[indice].ok;
    salvarRegistro("candidaturas", copia);
  }

  /** Cria um rascunho no Simulador já ligado a esta candidatura. */
  function criarRascunho() {
    if (!edital?.formId) return;
    const r = novoRascunho(edital.formId, nomeCandidatura(c), c.id);
    ligarCandidatura(r, c.id);
    salvarRascunho(r, true);
    abrirRascunho(r.id);
  }

  return (
    <>
      <button className="back" onClick={fecharDetalhe}>← Voltar</button>
      <div className="dhead">
        <div className="avatar">📄</div>
        <div>
          <h2>{edital?.nome || "—"}</h2>
          <span className="muted" style={{ fontSize: 12.5 }}>{projetoArtistaDe(c)} · pleiteado {c.valor || "—"}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            <button className="btn ghost sm" onClick={() => moverCandidatura(c, -1)}>◀</button>
            <span className="badge b-type" style={{ fontSize: 12 }}>{ETAPAS_PIPELINE[c.etapa]}</span>
            <button className="btn ghost sm" onClick={() => moverCandidatura(c, 1)}>▶</button>
            {c.result === "ok" && <span className="badge st-ok">aprovado</span>}
            {c.result === "no" && <span className="badge st-no">reprovado</span>}
          </div>
          {c.linkDrive && (
            <div style={{ marginTop: 7 }}>
              <a href={url(c.linkDrive)} target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--accent)", fontWeight: 600, fontSize: 12.5, textDecoration: "none" }}>
                📁 Pasta da inscrição no Drive ↗
              </a>
            </div>
          )}
        </div>
        <span className="act"><button className="btn ghost sm" onClick={() => abrirEdicao("candidatura", c.id)}>Editar</button></span>
      </div>

      <div className="dashgrid" style={{ marginTop: 16 }}>
        <div className="panel">
          <h4>Checklist de documentos
            <span className="act" style={{ fontSize: 11, fontWeight: 600, color: "var(--faint)" }}>
              gerado pelo mecanismo: {edital?.mec || "—"}
            </span>
          </h4>
          {docs.map((d, i) => (
            <div className="docitem" key={i}>
              <span className={"ck" + (d.ok ? " on" : "")} onClick={() => alternarDocumento(i)}>{d.ok ? "✓" : ""}</span>
              <span style={{ flex: 1 }}>{d.nome}</span>
            </div>
          ))}
        </div>

        <div className="panel">
          <h4>Documentos na ficha do artista</h4>
          {artista?.det?.docs?.length ? (
            artista.det.docs.map((d, i) => (
              <div className="docitem" key={i}>
                <span style={{ flex: 1 }}>{d.nome}</span>
                <span className={"badge " + (d.status === "ok" ? "pill-ok" : "pill-pend")}>{d.status === "ok" ? "na ficha" : "pendente"}</span>
              </div>
            ))
          ) : (
            <p className="muted" style={{ margin: 0 }}>Sem acervo na ficha do artista ainda.</p>
          )}
          <p className="hint" style={{ marginTop: 10 }}>
            O checklist puxa daqui — o que já está anexado na ficha de <b>{artista?.nome || "—"}</b> não precisa refazer.
          </p>
        </div>

        <div className="panel">
          <h4>Tarefas da candidatura
            <span className="act"><button className="btn sm" onClick={() => abrirNovo("tarefa", { origem: "cand:" + c.id })}>+ Tarefa</button></span>
          </h4>
          {tarefas.map((t) => {
            const b = badgeTarefa(t);
            return (
              <div className="docitem" key={t.id}>
                <span style={{ flex: 1 }}>{t.titulo} <span className="muted">· {nomeEquipe(t.respId)}</span></span>
                <span className={"badge " + b.classe}>{b.rotulo}</span>
              </div>
            );
          })}
          {!tarefas.length && <p className="muted" style={{ margin: 0 }}>Nenhuma tarefa ainda.</p>}
        </div>

        <div className="panel">
          <h4>Rascunhos no Simulador
            <span className="act">
              {edital?.formId && <button className="btn sm" onClick={criarRascunho}>+ Rascunho</button>}
            </span>
          </h4>
          {meusRascunhos.map((r) => (
            <div className="docitem" key={r.id}>
              <span style={{ flex: 1 }}>
                <a href="#" onClick={(e) => { e.preventDefault(); abrirRascunho(r.id); }}
                  style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>{r.nome}</a>{" "}
                <span className="muted">· {registroDe(r.form).nome}</span>
              </span>
              <span className="badge b-type">{pctRascunho(r)}%</span>
            </div>
          ))}
          {!meusRascunhos.length && <p className="muted" style={{ margin: 0 }}>Nenhum rascunho ligado a esta candidatura.</p>}
          {edital && !edital.formId && (
            <p className="hint" style={{ marginTop: 8 }}>
              Para criar rascunhos daqui, defina o "Formulário no Simulador" na ficha do edital (Editar).
              Ou crie na Mesa do Simulador e escolha esta candidatura como referência.
            </p>
          )}
        </div>

        {edital && (
          <div className="panel">
            <h4>Edital</h4>
            <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Esfera</span><b>{(ESFERAS[edital.esfera] || { rotulo: "—" }).rotulo}</b></div>
            <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Prazo</span><b>{edital.prazo}</b></div>
            <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Teto</span><b>{edital.teto}</b></div>
            <div className="row-line">
              <span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Elegibilidade</span>
              <span>{(edital.eleg || []).map((x) => <span className="chip" key={x}>{x}</span>)}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
