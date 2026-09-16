/* Resumo: a visão de chegada — KPIs, próximos prazos, pipeline por etapa,
   tarefas em aberto e alertas. Tudo derivado, nada editável aqui. */
import { usarCentral } from "../../store/central";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { eventosAgenda, tituloCurto } from "../../lib/agenda";
import { nomeEquipe } from "../../lib/nomes";
import { ETAPAS_PIPELINE } from "../../types";
import { formatarData } from "../../utils";

export function Resumo() {
  const { painel } = usarCentral();
  const ativas = painel.candidaturas.filter((c) => c.etapa < 5).length;
  const abertos = painel.editais.filter((e) => e.status === "open").length;
  const tarefasAbertas = painel.tarefas.filter((t) => t.status !== "feito").length;
  const eventos = eventosAgenda(painel.editais, painel.candidaturas).filter((e) => e.status !== "closed");
  const kpis: [string, number][] = [
    ["Candidaturas ativas", ativas],
    ["Editais abertos", abertos],
    ["Tarefas em aberto", tarefasAbertas],
    ["Artistas", painel.artistas.length],
  ];
  const maiorColuna = Math.max(1, ...ETAPAS_PIPELINE.map((_, i) => painel.candidaturas.filter((c) => c.etapa === i).length));
  const artistasComDocPendente = painel.artistas.filter((a) => a.det?.docs?.some((d) => d.status !== "ok"));

  return (
    <>
      <CabecalhoSecao titulo="Resumo" sub="visão de chegada — tudo se atualiza sozinho conforme você edita" />
      <div className="kpis">
        {kpis.map(([rotulo, n]) => (
          <div className="kpi" key={rotulo}><div className="n">{n}</div><div className="l">{rotulo}</div></div>
        ))}
      </div>
      <div className="dashgrid">
        <div className="panel">
          <h4>Próximos prazos</h4>
          {eventos.slice(0, 5).map((e, i) => (
            <div className="mini" key={i}>
              <span>{tituloCurto(e.titulo)}</span>
              <b>{e.iso.slice(8)}/{e.iso.slice(5, 7)}</b>
            </div>
          ))}
          {!eventos.length && <div className="mini muted">sem prazos com data</div>}
        </div>
        <div className="panel">
          <h4>Pipeline por etapa</h4>
          {ETAPAS_PIPELINE.map((etapa, i) => {
            const n = painel.candidaturas.filter((c) => c.etapa === i).length;
            return (
              <div key={etapa}>
                <div className="stagerow"><span>{etapa}</span><b>{n}</b></div>
                <div className="bar"><span style={{ width: `${(n / maiorColuna) * 100}%` }} /></div>
              </div>
            );
          })}
        </div>
        <div className="panel">
          <h4>Tarefas da equipe</h4>
          {painel.tarefas.filter((t) => t.status !== "feito").slice(0, 5).map((t) => (
            <div className="mini" key={t.id}>
              <span>
                <span className="dot" style={{ width: 18, height: 18, fontSize: 9, marginRight: 6 }}>{nomeEquipe(t.respId)[0] || "?"}</span>
                {t.titulo}
              </span>
              <span className="muted">{t.prazo ? formatarData(t.prazo) : ""}</span>
            </div>
          ))}
        </div>
        <div className="panel">
          <h4>Alertas</h4>
          {eventos.slice(0, 2).map((e, i) => (
            <div className="mini" key={"p" + i}>
              <span>⏱ <b>{tituloCurto(e.titulo)}</b> — prazo</span>
              <span className="badge st-open">{e.iso.slice(8)}/{e.iso.slice(5, 7)}</span>
            </div>
          ))}
          {artistasComDocPendente.map((a) => (
            <div className="mini" key={a.id}>
              <span>📄 {a.nome}: documentos pendentes</span>
              <span className="badge st-prev">pend.</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
