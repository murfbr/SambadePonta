/* Resumo do orçamento (tipo "orcresumo"): por etapa como o Salic mostra,
   por bloco (o corte de gestão do coletivo) e o checklist de antes de enviar. */
import { SALIC_DADOS } from "../../../data";
import {
  calcularLinha, custosVinculados, orcamentoDe, subtotalEtapa,
} from "../../../lib/simulador/orcamento";
import { BarraTotais } from "./BarraTotais";
import { BRL } from "../../../utils";
import type { Rascunho } from "../../../types";
import type { Alterar } from "../formulario/tipos";

const SD = SALIC_DADOS;

const PASSOS_ANTES_DE_ENVIAR = [
  "Cadastrar os itens no Salic, etapa por etapa, dentro de cada produto e local",
  "Definir os percentuais em Custos vinculados e salvar, para a planilha recalcular",
  "Preencher o detalhamento do plano de distribuição",
  "Anexar os documentos exigidos",
  "Gerar o PDF e conferir",
  "Enviar a proposta ao MinC",
];

export function ResumoOrcamento({ r, alterar }: { r: Rascunho; alterar: Alterar }) {
  const o = orcamentoDe(r);
  const v = custosVinculados(r);
  const total = v.vp + v.total;

  // Soma por bloco (o corte de gestão do coletivo).
  const porBloco: Record<string, number> = {};
  const ordem: string[] = [];
  o.linhas.forEach((l) => {
    const chave = (l.bloco || "").trim() || "(sem bloco)";
    if (!(chave in porBloco)) { porBloco[chave] = 0; ordem.push(chave); }
    porBloco[chave] += calcularLinha(l);
  });

  return (
    <>
      <BarraTotais r={r} />
      <h5 className="orch">Por etapa, como o Salic mostra</h5>
      <dl className="resumo">
        {(SD.etapas || []).map((e) => (
          <div key={e[0]}><dt>{e[1]}</dt><dd>{BRL(subtotalEtapa(o, e[0]))}</dd></div>
        ))}
        <div><dt>Acessibilidade</dt><dd>{BRL(v.acess)}</dd></div>
        <div><dt>Administração</dt><dd>{BRL(v.adm)}</dd></div>
        <div><dt>Captação</dt><dd>{BRL(v.capt)}</dd></div>
      </dl>

      <h5 className="orch">Por bloco, o seu corte de gestão</h5>
      {!ordem.length && !v.total ? (
        <p className="instr">Nada lançado ainda.</p>
      ) : (
        <div className="peso">
          {ordem.map((chave) => {
            const pc = total ? Math.round((porBloco[chave] / total) * 100) : 0;
            return (
              <div className="r" key={chave}>
                <span className="nm">{chave}</span>
                <span className="bb"><i style={{ width: pc + "%" }} /></span>
                <span className="vl">{BRL(porBloco[chave])}</span>
                <span className="pc">{pc}%</span>
              </div>
            );
          })}
          {v.total > 0 && (
            <div className="r">
              <span className="nm">Custos vinculados</span>
              <span className="bb"><i style={{ width: (total ? Math.round((v.total / total) * 100) : 0) + "%", background: "var(--s-rasc)" }} /></span>
              <span className="vl">{BRL(v.total)}</span>
              <span className="pc">{total ? Math.round((v.total / total) * 100) : 0}%</span>
            </div>
          )}
          <div className="r tt">
            <span className="nm">Custo total</span>
            <span className="bb" style={{ visibility: "hidden" }} />
            <span className="vl">{BRL(total)}</span>
            <span className="pc">100%</span>
          </div>
        </div>
      )}

      <h5 className="orch">Antes de enviar, na plataforma</h5>
      <div className="docs">
        {PASSOS_ANTES_DE_ENVIAR.map((passo, i) => (
          <label className={"doc" + (o.check[i] ? " ok" : "")} key={i}>
            <input type="checkbox" checked={Boolean(o.check[i])}
              onChange={(e) => alterar((copia) => { orcamentoDe(copia).check[i] = e.target.checked; }, true)} />
            <span>{passo}</span>
          </label>
        ))}
      </div>
    </>
  );
}
