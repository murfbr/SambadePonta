/* Reuniões: destaque da próxima, cards de todas, e o link de convite do
   Google Agenda com participantes e recorrência. */
import { usarCentral } from "../../store/central";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { emailsConvite, linkGoogleAgenda, nomesParticipantes } from "../../lib/agenda";
import { formatarData } from "../../utils";

export function Reunioes() {
  const { painel } = usarCentral();
  const reunioes = [...painel.reunioes].sort((a, b) => ((a.data || "9999") < (b.data || "9999") ? -1 : 1));
  const hoje = new Date().toISOString().slice(0, 10);
  const proxima = reunioes
    .filter((r) => r.status !== "realizada" && (r.proxima || r.data || "") >= hoje)
    .sort((a, b) => ((a.proxima || a.data) < (b.proxima || b.data) ? -1 : 1))[0];

  return (
    <>
      <CabecalhoSecao titulo="Reuniões" sub="monte a pauta antes, preencha a ata depois; encaminhamentos viram tarefas">
        <button className="btn" onClick={() => abrirNovo("reuniao")}>+ Nova reunião</button>
      </CabecalhoSecao>

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
