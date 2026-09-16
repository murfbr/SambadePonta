/* Ficha da reunião: pauta, ata e os encaminhamentos (tarefas ligadas),
   com o checkzinho de concluir direto na lista. */
import { usarCentral } from "../../store/central";
import { alternarTarefaConcluida, porId } from "../../store/mutacoes";
import { fecharDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { emailsConvite, linkGoogleAgenda, nomesParticipantes } from "../../lib/agenda";
import { nomeEquipe } from "../../lib/nomes";
import { ROTULO_TAREFA } from "../../types";
import { formatarData } from "../../utils";

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
              <span className={"ck" + (t.status === "feito" ? " on" : "")} onClick={() => alternarTarefaConcluida(t)}>
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
