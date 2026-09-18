/* Modal de criar/editar regra. Cobra a fonte (a não ser "experiência") e,
   quando a regra nasce de uma lição de julgamento, aponta a lição de volta. */
import { useState } from "react";
import { Modal, RodapeModal } from "../../components/Modal";
import { BotaoExcluir } from "../../components/BotaoExcluir";
import { toast } from "../../components/Toast";
import { obterEstado } from "../../store/central";
import { excluirRegra, salvarJulgamento, salvarRegra } from "../../store/mutacoes";
import { entidades } from "../../lib/contexto/consultas";
import { clonar, uid } from "../../utils";
import {
  ROTULO_FONTE, ROTULO_TIPO_REGRA,
  type Regra, type TipoFicha, type TipoFonte, type TipoRegra,
} from "../../types";

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
    excluirRegra(regra.id); // o toast com Desfazer vem da lixeira
    aoFechar();
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
    <Modal titulo={editando ? "Editar regra" : "Nova regra"} aoFechar={aoFechar}>
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
      <RodapeModal>
        {editando && <BotaoExcluir aoConfirmar={excluir} />}
        <span className="sp">
          <button className="btn quiet" onClick={aoFechar}>Cancelar</button>
          <button className="btn primary" onClick={salvar}>Salvar</button>
        </span>
      </RodapeModal>
    </Modal>
  );
}
