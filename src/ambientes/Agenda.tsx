/* Agenda: cronograma (lista por mês) e calendário (grade mensal).
   Não tem cadastro próprio — os marcadores derivam dos prazos dos editais
   e das candidaturas ligadas a eles. */
import { useState } from "react";
import { usarCentral } from "../banco/dados";
import { Shead, eventosAgenda, projetoArtistaDe, tituloCurto } from "./comuns";
import { STATUS_EDITAL } from "../tipos";
import { MESES } from "../util";

/** Meses que aparecem no calendário: os que têm evento + o mês atual. */
function mesesDoCalendario(eventos: { iso: string }[]): string[] {
  const conjunto = new Set(eventos.map((e) => e.iso.slice(0, 7)));
  conjunto.add(new Date().toISOString().slice(0, 7));
  return [...conjunto].sort();
}

export function VisaoCronograma() {
  const { painel } = usarCentral();
  const eventos = eventosAgenda(painel.editais, painel.candidaturas);
  const meses = [...new Set(eventos.map((e) => e.iso.slice(0, 7)))].sort();
  const previstosSemData = painel.editais.filter((e) => !e.prazoIso && e.status === "prev");

  return (
    <>
      <Shead titulo="Cronograma" sub="prazos derivados dos editais e das candidaturas" />
      {meses.map((chave) => {
        const [ano, mes] = chave.split("-");
        return (
          <div className="month" key={chave}>
            <div className="mh">{MESES[Number(mes) - 1]} {ano}</div>
            {eventos.filter((e) => e.iso.slice(0, 7) === chave).map((e, i) => {
              const st = STATUS_EDITAL[e.status] || STATUS_EDITAL.open;
              const sub = e.candidaturas.length
                ? e.candidaturas.map(projetoArtistaDe).join(" · ")
                : "sem candidatura vinculada";
              return (
                <div className="ev" key={i}>
                  <div className="d">
                    <div className="dd">{e.iso.slice(8)}</div>
                    <div className="mm">{MESES[Number(mes) - 1].slice(0, 3)}</div>
                  </div>
                  <div className="body"><div className="t">{e.titulo}</div><div className="s">{sub}</div></div>
                  <span className={"tag badge " + st.classe}>{st.rotulo}</span>
                </div>
              );
            })}
          </div>
        );
      })}
      {previstosSemData.length > 0 && (
        <div className="month">
          <div className="mh">Sem data exata (previstos)</div>
          {previstosSemData.map((e) => (
            <div className="ev" key={e.id}>
              <div className="d">
                <div className="dd">—</div>
                <div className="mm">{(e.prazo.match(/[a-z]{3}/i) || [""])[0]}</div>
              </div>
              <div className="body"><div className="t">{e.nome}</div><div className="s">{e.prazo}</div></div>
              <span className="tag badge st-prev">Previsto</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function VisaoCalendario() {
  const { painel } = usarCentral();
  const eventos = eventosAgenda(painel.editais, painel.candidaturas);
  const meses = mesesDoCalendario(eventos);
  const mesAtual = new Date().toISOString().slice(0, 7);
  const [indice, setIndice] = useState(() => Math.max(0, meses.indexOf(mesAtual)));

  const i = Math.min(indice, meses.length - 1);
  const [ano, mes] = meses[i].split("-").map(Number);
  const primeiroDia = new Date(ano, mes - 1, 1);
  const inicioSemana = (primeiroDia.getDay() + 6) % 7; // semana começa na segunda
  const diasNoMes = new Date(ano, mes, 0).getDate();

  const celulas = [];
  for (let v = 0; v < inicioSemana; v++) celulas.push(<div className="cell off" key={"v" + v} />);
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const iso = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    celulas.push(
      <div className="cell" key={dia}>
        <div className="num">{dia}</div>
        {eventos.filter((e) => e.iso === iso).map((e, k) => (
          <div className="evt" key={k}>{tituloCurto(e.titulo)}</div>
        ))}
      </div>,
    );
  }

  return (
    <>
      <Shead titulo="Calendário" sub="visão de mês — prazos posicionados no dia" />
      <div className="calbar">
        <button className="btn ghost sm" onClick={() => setIndice(Math.max(0, i - 1))}>←</button>
        <span className="mname">{MESES[mes - 1]} {ano}</span>
        <button className="btn ghost sm" onClick={() => setIndice(Math.min(meses.length - 1, i + 1))}>→</button>
      </div>
      <div className="calgrid">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => <div className="cah" key={d}>{d}</div>)}
        {celulas}
      </div>
      <p className="hint">Os marcadores vêm sozinhos dos editais cadastrados.</p>
    </>
  );
}
