/* Gestão: reuniões (pauta antes, ata depois, encaminhamentos viram tarefas)
   e o quadro de tarefas (por pessoa ou por status). */
import { useState } from "react";
import { porId, salvarRegistro, usarCentral } from "../banco/dados";
import { abrirDetalhe, fecharDetalhe } from "../estado/navegacao";
import { abrirEdicao, abrirNovo } from "../estado/edicao";
import {
  Shead, badgeTarefa, linkGoogleAgenda, nomeEquipe, rotuloOrigem,
} from "./comuns";
import { ROTULO_TAREFA, STATUS_TAREFA, type Reuniao, type Tarefa } from "../tipos";
import { clonar, formatarData } from "../util";

/* ══════════ Reuniões ══════════ */

/** Nomes dos participantes de uma reunião. */
const nomesParticipantes = (r: Reuniao): string[] =>
  (r.participanteIds || []).map((id) => porId("equipe", id)?.nome).filter(Boolean) as string[];

/** E-mails de convite: participantes com e-mail + convidados externos. */
const emailsConvite = (r: Reuniao): string[] => [
  ...((r.participanteIds || []).map((id) => porId("equipe", id)?.email).filter(Boolean) as string[]),
  ...(r.emailsExtra || []),
];

export function VisaoReunioes() {
  const { painel } = usarCentral();
  const reunioes = [...painel.reunioes].sort((a, b) => ((a.data || "9999") < (b.data || "9999") ? -1 : 1));
  const hoje = new Date().toISOString().slice(0, 10);
  const proxima = reunioes
    .filter((r) => r.status !== "realizada" && (r.proxima || r.data || "") >= hoje)
    .sort((a, b) => ((a.proxima || a.data) < (b.proxima || b.data) ? -1 : 1))[0];

  return (
    <>
      <Shead titulo="Reuniões" sub="monte a pauta antes, preencha a ata depois; encaminhamentos viram tarefas">
        <button className="btn" onClick={() => abrirNovo("reuniao")}>+ Nova reunião</button>
      </Shead>

      {proxima && (
        <div className="panel" style={{ borderLeft: "3px solid var(--accent)" }}>
          <h4>Próxima reunião</h4>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <b style={{ fontSize: 15 }}>{proxima.titulo}</b>
            <span className="badge b-type">
              {formatarData(proxima.proxima || proxima.data)}{proxima.hora ? " · " + proxima.hora : ""}
            </span>
            {proxima.recorrencia && proxima.recorrencia !== "Avulsa" && <span className="badge st-prev">{proxima.recorrencia}</span>}
            <a className="btn sm" style={{ textDecoration: "none", marginLeft: "auto" }}
              href={linkGoogleAgenda({ ...proxima, data: proxima.proxima || proxima.data }, emailsConvite(proxima))}
              target="_blank" rel="noopener noreferrer">
              📅 Adicionar ao Google Agenda
            </a>
          </div>
        </div>
      )}

      <div className="grid g2">
        {reunioes.map((r) => {
          const encaminhamentos = painel.tarefas.filter((t) => t.origem === "reuniao:" + r.id).length;
          return (
            <div className="card click" key={r.id} onClick={() => abrirDetalhe("reuniao", r.id)}>
              <button className="edit" onClick={(e) => { e.stopPropagation(); abrirEdicao("reuniao", r.id); }}>editar</button>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                <span className={"badge " + (r.status === "realizada" ? "st-closed" : "st-open")}>
                  {r.status === "realizada" ? "Realizada" : "Agendada"}
                </span>
                {r.recorrencia && r.recorrencia !== "Avulsa" && <span className="badge st-prev">{r.recorrencia}</span>}
              </div>
              <h3>{r.titulo}</h3>
              <p className="role">{formatarData(r.data)}{r.hora ? " · " + r.hora : ""}{r.local ? " · " + r.local : ""}</p>
              {nomesParticipantes(r).length > 0 && (
                <div style={{ marginTop: 6 }}>{nomesParticipantes(r).map((n) => <span className="chip" key={n}>{n}</span>)}</div>
              )}
              <div className="foot">{(r.pauta || []).length} de pauta · {encaminhamentos} encaminhamento(s) <span className="arrow">abrir →</span></div>
            </div>
          );
        })}
        {!reunioes.length && <p className="muted">Nenhuma reunião ainda. Crie a primeira em "+ Nova reunião".</p>}
      </div>
    </>
  );
}

export function FichaReuniao({ id }: { id: string }) {
  const { painel } = usarCentral();
  const r = porId("reunioes", id)!;
  const encaminhamentos = painel.tarefas.filter((t) => t.origem === "reuniao:" + r.id);

  return (
    <>
      <button className="back" onClick={fecharDetalhe}>← Voltar para Reuniões</button>
      <div className="dhead">
        <div className="avatar">📅</div>
        <div>
          <h2>{r.titulo}</h2>
          <span className="muted" style={{ fontSize: 12.5 }}>
            {formatarData(r.data)}{r.hora ? " · " + r.hora : ""}{r.local ? " · " + r.local : ""}
          </span>
          <div style={{ marginTop: 5 }}>
            {r.recorrencia && r.recorrencia !== "Avulsa" && <><span className="badge st-prev">{r.recorrencia}</span>{" "}</>}
            {r.proxima && <><span className="badge b-type">próxima: {formatarData(r.proxima)}</span>{" "}</>}
            <span className={"badge " + (r.status === "realizada" ? "st-closed" : "st-open")}>
              {r.status === "realizada" ? "Realizada" : "Agendada"}
            </span>
          </div>
        </div>
        <span className="act">
          <a className="btn ghost sm" style={{ textDecoration: "none" }}
            href={linkGoogleAgenda(r, emailsConvite(r))} target="_blank" rel="noopener noreferrer">📅 Google Agenda</a>{" "}
          <button className="btn ghost sm" onClick={() => abrirEdicao("reuniao", r.id)}>Editar</button>
        </span>
      </div>

      {nomesParticipantes(r).length > 0 && (
        <div style={{ margin: "2px 0 10px" }}>{nomesParticipantes(r).map((n) => <span className="chip" key={n}>{n}</span>)}</div>
      )}

      <div className="dashgrid" style={{ marginTop: 8 }}>
        <div className="panel">
          <h4>Pauta</h4>
          {(r.pauta || []).map((p, i) => <div className="docitem" key={i}><span style={{ flex: 1 }}>{p}</span></div>)}
          {!(r.pauta || []).length && <p className="muted" style={{ margin: 0 }}>Sem itens de pauta.</p>}
        </div>
        <div className="panel">
          <h4>Ata / o que rolou</h4>
          {r.ata
            ? <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{r.ata}</p>
            : <p style={{ margin: 0 }}><span className="muted">A preencher depois da reunião (botão Editar).</span></p>}
        </div>
        <div className="panel" style={{ gridColumn: "1/-1" }}>
          <h4>Encaminhamentos → Tarefas
            <span className="act"><button className="btn sm" onClick={() => abrirNovo("tarefa", { origem: "reuniao:" + r.id })}>+ Encaminhamento</button></span>
          </h4>
          {encaminhamentos.map((t) => (
            <div className="docitem" key={t.id}>
              <span className={"ck" + (t.status === "feito" ? " on" : "")} onClick={() => alternarConcluida(t)}>
                {t.status === "feito" ? "✓" : ""}
              </span>
              <span style={{ flex: 1, cursor: "pointer" }} onClick={() => abrirEdicao("tarefa", t.id)}>
                {t.titulo} <span className="muted">· {nomeEquipe(t.respId)} · {ROTULO_TAREFA[t.status]}</span>
              </span>
            </div>
          ))}
          {!encaminhamentos.length && <p className="muted" style={{ margin: 0 }}>Nenhum encaminhamento ainda.</p>}
          <p className="hint" style={{ marginTop: 10 }}>
            Cada encaminhamento é uma tarefa ligada a esta reunião — aparece também na aba Tarefas, no responsável. Marque ✓ para concluir.
          </p>
        </div>
      </div>
    </>
  );
}

/* ══════════ Tarefas (quadro) ══════════ */

/** Concluir/reabrir uma tarefa pelo checkzinho. */
function alternarConcluida(t: Tarefa) {
  const copia = clonar(t);
  copia.status = copia.status === "feito" ? "fazer" : "feito";
  salvarRegistro("tarefas", copia);
}

/** Avança ou volta o status da tarefa (a fazer ⇄ em andamento ⇄ concluído). */
function girarStatus(t: Tarefa, direcao: -1 | 1) {
  const copia = clonar(t);
  const i = Math.max(0, Math.min(2, STATUS_TAREFA.indexOf(copia.status) + direcao));
  copia.status = STATUS_TAREFA[i];
  salvarRegistro("tarefas", copia);
}

function CartaoTarefa({ t, mostrarStatus }: { t: Tarefa; mostrarStatus: boolean }) {
  const b = badgeTarefa(t);
  return (
    <div className="kcard" onClick={() => abrirEdicao("tarefa", t.id)}>
      <p className="edt" style={{ fontWeight: 600 }}>{t.titulo}</p>
      <p className="prj">{rotuloOrigem(t.origem)}</p>
      {t.obs && <p className="prj" style={{ color: "var(--faint)", fontStyle: "italic" }}>{t.obs}</p>}
      <div className="meta">
        {mostrarStatus
          ? <span className={"badge " + b.classe} style={{ fontSize: 10 }}>{b.rotulo}</span>
          : <span className="dot">{nomeEquipe(t.respId)[0] || "?"}</span>}
        {t.prazo && <span className="prazo">⏱ {formatarData(t.prazo)}</span>}
        <span className="navb">
          <button title="voltar status" onClick={(e) => { e.stopPropagation(); girarStatus(t, -1); }}>◀</button>
          <button title="avançar status" onClick={(e) => { e.stopPropagation(); girarStatus(t, 1); }}>▶</button>
        </span>
      </div>
    </div>
  );
}

const ColunaVazia = () => <div style={{ fontSize: 11.5, color: "var(--faint)", padding: 6 }}>—</div>;

export function VisaoTarefas() {
  const { painel } = usarCentral();
  const [visao, setVisao] = useState<"pessoa" | "status">("pessoa");

  let quadro;
  if (visao === "status") {
    quadro = (
      <div className="kanban">
        {STATUS_TAREFA.map((k) => {
          const ts = painel.tarefas.filter((t) => t.status === k);
          return (
            <div className="col" style={{ flexBasis: 300 }} key={k}>
              <div className="col-h">{ROTULO_TAREFA[k]}<span className="cnt">{ts.length}</span></div>
              {ts.map((t) => <CartaoTarefa t={t} mostrarStatus={false} key={t.id} />)}
              {!ts.length && <ColunaVazia />}
            </div>
          );
        })}
      </div>
    );
  } else {
    const comTarefa = painel.equipe.filter((e) => painel.tarefas.some((t) => t.respId === e.id));
    const semResponsavel = painel.tarefas.filter((t) => !t.respId || !porId("equipe", t.respId));
    quadro = (
      <div className="kanban">
        {comTarefa.map((pessoa) => {
          const ts = painel.tarefas.filter((t) => t.respId === pessoa.id);
          const abertas = ts.filter((t) => t.status !== "feito").length;
          return (
            <div className="col" style={{ flexBasis: 280 }} key={pessoa.id}>
              <div className="col-h">
                <span className="dot" style={{ marginRight: 6 }}>{pessoa.nome[0]}</span>
                {pessoa.nome}<span className="cnt">{abertas}/{ts.length}</span>
              </div>
              {ts.map((t) => <CartaoTarefa t={t} mostrarStatus={true} key={t.id} />)}
              {!ts.length && <ColunaVazia />}
            </div>
          );
        })}
        {semResponsavel.length > 0 && (
          <div className="col" style={{ flexBasis: 280 }}>
            <div className="col-h">Sem responsável<span className="cnt">{semResponsavel.length}</span></div>
            {semResponsavel.map((t) => <CartaoTarefa t={t} mostrarStatus={true} key={t.id} />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Shead titulo="Tarefas" sub="designadas à equipe; nascem em projetos, candidaturas e reuniões">
        <button className="btn ghost sm" onClick={() => setVisao(visao === "pessoa" ? "status" : "pessoa")}>
          Ver por: <b>{visao}</b> ⇄
        </button>
        <button className="btn" onClick={() => abrirNovo("tarefa")}>+ Tarefa</button>
      </Shead>
      {quadro}
    </>
  );
}
