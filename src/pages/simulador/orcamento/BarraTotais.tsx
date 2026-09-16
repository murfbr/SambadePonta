/* Barra com os três totais do orçamento: valor do projeto, custos vinculados
   e custo total (em alerta quando a captação estoura o teto legal). */
import { custosVinculados } from "../../../lib/simulador/orcamento";
import { BRL } from "../../../utils";
import type { Rascunho } from "../../../types";

export function BarraTotais({ r }: { r: Rascunho }) {
  const v = custosVinculados(r);
  return (
    <dl className="money">
      <div><dt>Valor do projeto</dt><dd>{BRL(v.vp)}</dd></div>
      <div><dt>Custos vinculados</dt><dd>{BRL(v.total)}</dd></div>
      <div className="dest"><dt>Custo total</dt><dd className={v.estourou ? "alerta" : ""}>{BRL(v.vp + v.total)}</dd></div>
    </dl>
  );
}
