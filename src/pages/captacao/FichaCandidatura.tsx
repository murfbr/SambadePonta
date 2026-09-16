/* Ficha da candidatura: etapa no pipeline, checklist de documentos (gerado
   pelo mecanismo do edital), acervo do artista, tarefas ligadas, rascunhos no
   Simulador e o resumo do edital. */
import { usarCentral } from "../../store/central";
import {
  definirResultado, ligarCandidatura, moverCandidatura, nomeCandidatura, porId,
  rascunhosDaCandidatura, salvarRascunho, salvarRegistro,
} from "../../store/mutacoes";
import { abrirRascunho, fecharDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { documentosPorMecanismo } from "../../lib/documentos";
import { badgeTarefa, nomeEquipe, projetoArtistaDe } from "../../lib/nomes";
import { novoRascunho, pctRascunho } from "../../lib/simulador/motor";
import { registroDe } from "../../data";
import { ESFERAS, ETAPA_RESULTADO, ETAPAS_PIPELINE } from "../../types";
import { clonar, url } from "../../utils";

export function FichaCandidatura({ id }: { id: string }) {
  const { painel, rascunhos } = usarCentral();
  const c = porId("candidaturas", id)!;
  const projeto = porId("projetos", c.projetoId);
  const edital = porId("editais", c.editalId);
  const artista = projeto && porId("artistas", projeto.artistaId);
  const docs = c.docs || documentosPorMecanismo(edital);
  const tarefas = painel.tarefas.filter((t) => t.origem === "cand:" + c.id);
  const meusRascunhos = rascunhosDaCandidatura(c.id);
  void rascunhos; // o hook acima garante re-render quando rascunhos mudam

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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
            <button className="btn ghost sm" onClick={() => moverCandidatura(c, -1)}>◀</button>
            <span className="badge b-type" style={{ fontSize: 12 }}>{ETAPAS_PIPELINE[c.etapa]}</span>
            <button className="btn ghost sm" onClick={() => moverCandidatura(c, 1)}>▶</button>
            {c.etapa === ETAPA_RESULTADO && (
              <span className="resultado">
                <button className={"badge st-ok" + (c.result === "ok" ? " on" : "")} title="marcar aprovado"
                  onClick={() => definirResultado(c, c.result === "ok" ? undefined : "ok")}>aprovado</button>
                <button className={"badge st-no" + (c.result === "no" ? " on" : "")} title="marcar reprovado"
                  onClick={() => definirResultado(c, c.result === "no" ? undefined : "no")}>reprovado</button>
              </span>
            )}
            {c.etapa === ETAPA_RESULTADO && c.result === "ok" && (
              <button className="btn sm" onClick={() => moverCandidatura(c, 1)}>→ mover para Em execução</button>
            )}
            {c.etapa !== ETAPA_RESULTADO && c.result === "ok" && <span className="badge st-ok">aprovado</span>}
            {c.etapa !== ETAPA_RESULTADO && c.result === "no" && <span className="badge st-no">reprovado</span>}
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
