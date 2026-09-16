/* Modal de criar/editar julgamento: edital, projeto, ano/resultado/nota,
   resumo e as listas (fortes, fracos, lições — uma por linha). */
import { useState } from "react";
import { Modal, RodapeModal } from "../../components/Modal";
import { BotaoExcluir } from "../../components/BotaoExcluir";
import { toast } from "../../components/Toast";
import { excluirJulgamento, salvarJulgamento } from "../../store/mutacoes";
import { definirJulgamentoAberto } from "../../store/navegacao";
import { entidades } from "../../lib/contexto/consultas";
import { uid } from "../../utils";
import { ROTULO_RESULTADO, type Julgamento } from "../../types";

export function ModalJulgamento({ inicial, aoFechar }: { inicial: Julgamento | null; aoFechar: () => void }) {
  const [j, setJ] = useState<Julgamento>(inicial || {
    id: "", edital: "", projeto: "", ano: String(new Date().getFullYear()),
    resultado: "aguardando", nota: "", resumo: "", fortes: [], fracos: [], licoes: [],
  });
  // Listas como texto (um item por linha) enquanto edita.
  const [fortes, setFortes] = useState((inicial?.fortes || []).join("\n"));
  const [fracos, setFracos] = useState((inicial?.fracos || []).join("\n"));
  const [licoes, setLicoes] = useState((inicial?.licoes || []).map((l) => l.texto).join("\n"));

  const linhas = (v: string) => v.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const mudar = (parte: Partial<Julgamento>) => setJ((atual) => ({ ...atual, ...parte }));

  function salvar() {
    if (!j.edital) { toast("Escolha o edital"); return; }
    const pronta: Julgamento = {
      ...j,
      id: j.id || uid("j"),
      ano: j.ano.trim(), nota: j.nota.trim(), resumo: j.resumo.trim(),
      fortes: linhas(fortes), fracos: linhas(fracos),
      // preserva o vínculo lição→regra quando o texto da lição não mudou
      licoes: linhas(licoes).map((texto) => {
        const antiga = (inicial?.licoes || []).find((l) => l.texto === texto);
        return { texto, regra: antiga?.regra || "" };
      }),
    };
    salvarJulgamento(pronta);
    definirJulgamentoAberto(pronta.id);
    aoFechar();
    toast("Julgamento salvo");
  }

  function excluir() {
    excluirJulgamento(j.id);
    definirJulgamentoAberto(null);
    aoFechar();
  }

  const seletor = (valor: string, aoMudar: (v: string) => void, lista: { id: string; nome: string }[], vazio?: string) => (
    <select value={valor} onChange={(e) => aoMudar(e.target.value)}>
      {vazio != null && <option value="">{vazio}</option>}
      {lista.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
    </select>
  );

  return (
    <Modal titulo={j.id ? "Editar julgamento" : "Novo julgamento"} aoFechar={aoFechar}>
      <div className="field"><label>Edital</label>{seletor(j.edital, (v) => mudar({ edital: v }), entidades("edital"), "escolha")}</div>
      <div className="field"><label>Projeto</label>{seletor(j.projeto, (v) => mudar({ projeto: v }), entidades("projeto"), "sem projeto")}</div>
      <div className="linha3">
        <div className="field"><label>Ano</label><input value={j.ano} onChange={(e) => mudar({ ano: e.target.value })} /></div>
        <div className="field">
          <label>Resultado</label>
          <select value={j.resultado} onChange={(e) => mudar({ resultado: e.target.value as Julgamento["resultado"] })}>
            {Object.entries(ROTULO_RESULTADO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="field"><label>Nota</label><input value={j.nota} onChange={(e) => mudar({ nota: e.target.value })} /></div>
      </div>
      <div className="field"><label>O que aconteceu</label><textarea rows={3} value={j.resumo} onChange={(e) => mudar({ resumo: e.target.value })} /></div>
      <div className="field"><label>Pontos fortes (um por linha)</label><textarea rows={3} value={fortes} onChange={(e) => setFortes(e.target.value)} /></div>
      <div className="field"><label>Pontos fracos (um por linha)</label><textarea rows={3} value={fracos} onChange={(e) => setFracos(e.target.value)} /></div>
      <div className="field"><label>Lições (uma por linha)</label><textarea rows={3} value={licoes} onChange={(e) => setLicoes(e.target.value)} /></div>
      <RodapeModal>
        {j.id && <BotaoExcluir aoConfirmar={excluir} />}
        <span className="sp">
          <button className="btn quiet" onClick={aoFechar}>Cancelar</button>
          <button className="btn primary" onClick={salvar}>Salvar</button>
        </span>
      </RodapeModal>
    </Modal>
  );
}
