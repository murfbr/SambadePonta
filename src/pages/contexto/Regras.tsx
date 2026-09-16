/* Regras: a tabela filtrável (escopo, tipo, busca). Sem fonte, a regra vira lenda. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { entidades, textoFonte } from "../../lib/contexto/consultas";
import { clonar } from "../../utils";
import { ROTULO_TIPO_REGRA, type Regra, type TipoFicha } from "../../types";
import type { PedidoModalRegra } from "./ModalRegra";

export function TelaRegras({ aoAbrirRegra }: { aoAbrirRegra: (p: PedidoModalRegra) => void }) {
  const { regras } = usarCentral();
  const [filtroEscopo, setFiltroEscopo] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [busca, setBusca] = useState("");

  const todas = Object.values(regras);
  const filtradas = todas.filter((r) =>
    (!filtroEscopo || r.escopo.tipo === filtroEscopo) &&
    (!filtroTipo || r.tipoRegra === filtroTipo) &&
    (!busca || (r.texto + " " + (r.fonte?.ref || "")).toLowerCase().includes(busca.toLowerCase())));

  const nomeEscopo = (r: Regra) => {
    if (r.escopo.tipo === "geral") return <span className="esc"><b>Geral</b></span>;
    if (r.escopo.tipo === "mecanismo") return <span className="esc">mecanismo <b>{r.escopo.id}</b></span>;
    const entidade = entidades(r.escopo.tipo as TipoFicha).find((x) => x.id === r.escopo.id);
    return <span className="esc">{r.escopo.tipo} <b>{entidade?.nome || r.escopo.id}</b></span>;
  };

  return (
    <>
      <div className="shead">
        <div>
          <h2>Regras</h2>
          <p className="sub">Uma linha por regra: o que fazer ou evitar, em que escopo, de que tipo, e de onde veio. Sem fonte, a regra vira lenda.</p>
        </div>
        <div className="acts">
          <button className="btn primary" onClick={() => aoAbrirRegra({ contexto: { tipo: "geral" } })}>+ nova regra</button>
        </div>
      </div>

      <div className="filtros">
        <select value={filtroEscopo} onChange={(e) => setFiltroEscopo(e.target.value)}>
          <option value="">todos os escopos</option>
          <option value="geral">geral</option>
          <option value="artista">por artista</option>
          <option value="projeto">por projeto</option>
          <option value="edital">por edital</option>
          <option value="mecanismo">por mecanismo</option>
        </select>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="">todos os tipos</option>
          {Object.entries(ROTULO_TIPO_REGRA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="search" placeholder="buscar no texto ou na fonte" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <span className="n">{filtradas.length} de {todas.length}</span>
      </div>

      <div className="tbl-wrap">
        <table className="rg">
          <thead>
            <tr><th>Tipo</th><th>Regra</th><th>Escopo</th><th>Fonte</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {filtradas.map((r) => (
              <tr key={r.id}>
                <td><span className={"tp " + r.tipoRegra}>{ROTULO_TIPO_REGRA[r.tipoRegra]}</span></td>
                <td className="tx">{r.texto}</td>
                <td>{nomeEscopo(r)}</td>
                <td className="fo">{textoFonte(r.fonte)}</td>
                <td>
                  {r.status === "duvida"
                    ? <span className="duvida">a confirmar</span>
                    : <span style={{ fontSize: 12.5, color: "var(--ink2)" }}>vigente</span>}
                </td>
                <td><button className="btn sm quiet" onClick={() => aoAbrirRegra({ regra: clonar(r) })}>editar</button></td>
              </tr>
            ))}
            {!filtradas.length && <tr><td colSpan={6} className="vazio">nenhuma regra com esse filtro</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
