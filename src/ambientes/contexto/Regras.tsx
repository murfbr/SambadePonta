/* Regras: a tabela filtrável (escopo, tipo, busca) e o modal de criar/editar.
   Regra sem fonte não entra — o modal cobra a fonte, a não ser "experiência".
   Uma regra criada a partir de uma lição de julgamento aponta a lição de volta. */
import { useState } from "react";
import { excluirRegra, obterEstado, salvarJulgamento, salvarRegra, usarCentral } from "../../banco/dados";
import { entidades, regrasDe, textoFonte } from "./contexto-util";
import { toast } from "../../blocos/Toast";
import { clonar, uid } from "../../util";
import {
  ROTULO_FONTE, ROTULO_TIPO_REGRA, type Regra, type TipoFicha, type TipoFonte, type TipoRegra,
} from "../../tipos";

/** Pedido para abrir o modal: regra existente (editar) e/ou contexto de criação. */
export interface PedidoModalRegra {
  regra?: Regra;
  contexto?: {
    tipo?: string;
    id?: string;
    /** Quando a regra nasce de uma lição: julgamento e índice da lição. */
    julgamentoId?: string;
    licao?: number;
    /** Texto inicial (a própria lição). */
    texto?: string;
    fonte?: Regra["fonte"];
  };
}

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

/** Linha de regra usada dentro das fichas. */
export function LinhaRegra({ r, aoEditar }: { r: Regra; aoEditar: () => void }) {
  return (
    <div className="regra">
      <span className={"tp " + r.tipoRegra}>{ROTULO_TIPO_REGRA[r.tipoRegra]}</span>
      <span className="t">{r.texto} {r.status === "duvida" && <span className="duvida">a confirmar</span>}</span>
      <button className="btn sm quiet" onClick={aoEditar}>editar</button>
      <span className="f">{textoFonte(r.fonte)}</span>
    </div>
  );
}

/* ══════════ modal ══════════ */

export function ModalRegra({ pedido, aoFechar }: { pedido: PedidoModalRegra; aoFechar: () => void }) {
  const inicial: Regra = pedido.regra || {
    id: "",
    texto: pedido.contexto?.texto || "",
    escopo: { tipo: (pedido.contexto?.tipo || "geral") as Regra["escopo"]["tipo"], id: pedido.contexto?.id || "" },
    tipoRegra: "dica",
    fonte: pedido.contexto?.fonte || { tipo: "experiencia", ref: "" },
    status: "vigente",
  };
  const [regra, setRegra] = useState<Regra>(inicial);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const editando = Boolean(pedido.regra?.id);

  const mudar = (parte: Partial<Regra>) => setRegra((r) => ({ ...r, ...parte }));

  function salvar() {
    if (!regra.texto.trim()) { toast("Escreva a regra"); return; }
    if (!regra.fonte.ref.trim() && regra.fonte.tipo !== "experiencia") {
      toast("Regra sem fonte não entra: informe a fonte");
      return;
    }
    const pronta: Regra = {
      ...regra,
      id: regra.id || uid("r"),
      texto: regra.texto.trim(),
      escopo: { ...regra.escopo, id: regra.escopo.tipo === "geral" ? "" : regra.escopo.id },
      fonte: { ...regra.fonte, ref: regra.fonte.ref.trim() || "experiência" },
    };
    salvarRegra(pronta);
    // Se a regra nasceu de uma lição de julgamento, aponta a lição para ela.
    const ctx = pedido.contexto;
    if (ctx?.julgamentoId != null && ctx.licao != null) {
      const j = obterEstado().julgamentos[ctx.julgamentoId];
      if (j?.licoes[ctx.licao]) {
        const copia = clonar(j);
        copia.licoes[ctx.licao].regra = pronta.id;
        salvarJulgamento(copia);
      }
    }
    aoFechar();
    toast("Regra salva");
  }

  function excluir() {
    if (!confirmandoExclusao) { setConfirmandoExclusao(true); return; }
    excluirRegra(regra.id);
    aoFechar();
    toast("Regra excluída");
  }

  const seletorEntidade = () => {
    if (regra.escopo.tipo === "geral") return null;
    if (regra.escopo.tipo === "mecanismo") {
      return <input value={regra.escopo.id} placeholder="ex.: rouanet, iss, pnab"
        onChange={(e) => mudar({ escopo: { ...regra.escopo, id: e.target.value } })} />;
    }
    const lista = entidades(regra.escopo.tipo as TipoFicha);
    return (
      <select value={regra.escopo.id}
        onChange={(e) => mudar({ escopo: { ...regra.escopo, id: e.target.value } })}>
        {!regra.escopo.id && <option value="">—</option>}
        {lista.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
      </select>
    );
  };

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div className="modal">
        <h3>{editando ? "Editar regra" : "Nova regra"}</h3>
        <div className="field">
          <label>Regra (uma linha)</label>
          <textarea rows={3} value={regra.texto} onChange={(e) => mudar({ texto: e.target.value })} />
        </div>
        <div className="field">
          <label>Escopo</label>
          <div className="linha2">
            <select value={regra.escopo.tipo}
              onChange={(e) => mudar({ escopo: { tipo: e.target.value as Regra["escopo"]["tipo"], id: "" } })}>
              {["geral", "artista", "projeto", "edital", "mecanismo"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <span>{seletorEntidade()}</span>
          </div>
        </div>
        <div className="field">
          <label>Tipo</label>
          <select value={regra.tipoRegra} onChange={(e) => mudar({ tipoRegra: e.target.value as TipoRegra })}>
            {Object.entries(ROTULO_TIPO_REGRA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Fonte</label>
          <div className="linha2">
            <select value={regra.fonte.tipo}
              onChange={(e) => mudar({ fonte: { ...regra.fonte, tipo: e.target.value as TipoFonte } })}>
              {Object.entries(ROTULO_FONTE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input value={regra.fonte.ref} placeholder="edital + item, norma, id do julgamento, ou 'experiência'"
              onChange={(e) => mudar({ fonte: { ...regra.fonte, ref: e.target.value } })} />
          </div>
        </div>
        <div className="field">
          <label>Status</label>
          <select value={regra.status} onChange={(e) => mudar({ status: e.target.value })}>
            <option value="vigente">vigente</option>
            <option value="duvida">a confirmar</option>
          </select>
        </div>
        <div className="mfoot">
          {editando && (
            <button className="del" onClick={excluir}>{confirmandoExclusao ? "Confirmar exclusão" : "Excluir"}</button>
          )}
          <span className="sp">
            <button className="btn quiet" onClick={aoFechar}>Cancelar</button>
            <button className="btn primary" onClick={salvar}>Salvar</button>
          </span>
        </div>
      </div>
    </div>
  );
}
