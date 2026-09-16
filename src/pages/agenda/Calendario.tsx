/* Calendário: grade mensal com os prazos posicionados no dia. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { eventosAgenda, tituloCurto } from "../../lib/agenda";
import { MESES } from "../../utils";

/** Meses que aparecem no calendário: os que têm evento + o mês atual. */
function mesesDoCalendario(eventos: { iso: string }[]): string[] {
  const conjunto = new Set(eventos.map((e) => e.iso.slice(0, 7)));
  conjunto.add(new Date().toISOString().slice(0, 7));
  return [...conjunto].sort();
}

export function Calendario() {
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
      <CabecalhoSecao titulo="Calendário" sub="visão de mês — prazos posicionados no dia" />
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
