/* Cronograma: lista de prazos por mês, derivada dos editais com data,
   mais os previstos sem data exata. */
import { usarCentral } from "../../store/central";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { eventosAgenda } from "../../lib/agenda";
import { projetoArtistaDe } from "../../lib/nomes";
import { STATUS_EDITAL } from "../../types";
import { MESES } from "../../utils";

export function Cronograma() {
  const { painel } = usarCentral();
  const eventos = eventosAgenda(painel.editais, painel.candidaturas);
  const meses = [...new Set(eventos.map((e) => e.iso.slice(0, 7)))].sort();
  const previstosSemData = painel.editais.filter((e) => !e.prazoIso && e.status === "prev");

  return (
    <>
      <CabecalhoSecao titulo="Cronograma" sub="prazos derivados dos editais e das candidaturas" />
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
