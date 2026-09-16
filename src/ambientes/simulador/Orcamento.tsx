/* Planilha orçamentária do Salic — a peça especial do Simulador.
   No Salic cada item é cadastrado num modal (produto → local → etapa); aqui a
   planilha inteira fica à vista e soma sozinha. O campo Item sugere o catálogo
   real (filtrado por produto × etapa) e preenche o código; a coluna Bloco é do
   coletivo, não existe na plataforma. */
import { useState } from "react";
import { SALIC_DADOS } from "../../dados/estaticos";
import {
  calcularLinha, catalogoDe, codigoDoItem, custosVinculados, linhaVazia,
  orcamentoDe, subtotalEtapa, textoOrcamento, totalItens, csvOrcamento,
} from "./motor";
import { copiarComAviso } from "../../blocos/Toast";
import { BRL, baixarArquivo, slug, uid } from "../../util";
import type { LinhaOrcamento, Rascunho } from "../../tipos";

type Alterar = (fn: (r: Rascunho) => void, rapido?: boolean) => void;

const SD = SALIC_DADOS;

/** Barra com os três totais (valor do projeto, vinculados, custo total). */
function BarraTotais({ r }: { r: Rascunho }) {
  const v = custosVinculados(r);
  return (
    <dl className="money">
      <div><dt>Valor do projeto</dt><dd>{BRL(v.vp)}</dd></div>
      <div><dt>Custos vinculados</dt><dd>{BRL(v.total)}</dd></div>
      <div className="dest"><dt>Custo total</dt><dd className={v.estourou ? "alerta" : ""}>{BRL(v.vp + v.total)}</dd></div>
    </dl>
  );
}

export function PlanilhaOrcamento({ r, alterar }: { r: Rascunho; alterar: Alterar }) {
  const [colunasSalic, setColunasSalic] = useState(false);
  const o = orcamentoDe(r);
  const v = custosVinculados(r);
  const catalogosComNome = Object.keys(SD.catalogos);

  /** Muda um campo de uma linha; item conhecido preenche o código sozinho. */
  const mudarLinha = (id: string, campo: keyof LinhaOrcamento, valor: string) =>
    alterar((copia) => {
      const linha = orcamentoDe(copia).linhas.find((l) => l.id === id);
      if (!linha) return;
      (linha[campo] as string) = valor;
      if (campo === "item") {
        const codigo = codigoDoItem(valor);
        if (codigo) linha.cod = codigo;
      }
    });

  // Um datalist por combinação produto × etapa em uso (catálogo do Salic + curadoria).
  const combinacoes = new Map<string, string>();
  o.linhas.forEach((l) => {
    const chave = (l.produto || "") + "|" + l.etapa;
    if (!combinacoes.has(chave)) combinacoes.set(chave, "cat-" + combinacoes.size);
  });

  return (
    <>
      <BarraTotais r={r} />
      <p className="instr">
        No Salic cada item é cadastrado num modal, dentro de um produto, dentro de um local, dentro de
        uma etapa, e o total só aparece depois de salvar. Aqui a planilha inteira fica à vista e soma
        sozinha. A coluna <b>Bloco</b> é sua, não existe na plataforma. O campo <b>Item</b> sugere o
        catálogo real do Salic ({catalogosComNome.join(", ")}) filtrado por produto e etapa, e preenche
        o código sozinho; outros produtos caem no catálogo de {SD.catalogoPadrao}.
      </p>
      <div className="orcbar">
        <label className="togg">
          <input type="checkbox" checked={colunasSalic} onChange={(e) => setColunasSalic(e.target.checked)} />
          {" "}Mostrar colunas do Salic (produto, local, código, fonte, detalhamento)
        </label>
      </div>

      <div className="tablewrap">
        <table className={"orc" + (colunasSalic ? " full" : "")}>
          <thead>
            <tr>
              <th className="c-bl">Bloco</th><th className="sc">Produto</th><th className="sc">Local</th>
              <th>Etapa</th><th className="c-it">Item</th><th className="sc">Cód.</th><th>Unid.</th>
              <th>Qtd</th><th>Ocor.</th><th>Vlr unit.</th><th>Total</th>
              <th className="sc">Fonte</th><th className="sc">Detalhamento</th><th></th>
            </tr>
          </thead>
          <tbody>
            {o.linhas.map((l) => {
              const idLista = combinacoes.get((l.produto || "") + "|" + l.etapa);
              return (
                <tr key={l.id}>
                  <td><input className="cell" list="lista-blocos" value={l.bloco} placeholder="—" onChange={(e) => mudarLinha(l.id, "bloco", e.target.value)} /></td>
                  <td className="sc">
                    <select className="cell" value={l.produto} onChange={(e) => mudarLinha(l.id, "produto", e.target.value)}>
                      <option value="">—</option>
                      {(SD.produtos || []).map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="sc"><input className="cell" value={l.local} placeholder="Cidade - UF" onChange={(e) => mudarLinha(l.id, "local", e.target.value)} /></td>
                  <td>
                    <select className="cell" value={l.etapa} onChange={(e) => mudarLinha(l.id, "etapa", e.target.value)} data-ok="etapa">
                      {(SD.etapas || []).map((e2) => <option key={e2[0]} value={e2[0]}>{e2[1]}</option>)}
                    </select>
                  </td>
                  <td><input className="cell" list={idLista} value={l.item} placeholder="descrição do gasto" onChange={(e) => mudarLinha(l.id, "item", e.target.value)} /></td>
                  <td className="sc"><input className="cell n" value={l.cod} placeholder="—" onChange={(e) => mudarLinha(l.id, "cod", e.target.value)} /></td>
                  <td>
                    <select className="cell" value={String(l.unidade)} onChange={(e) => mudarLinha(l.id, "unidade", e.target.value)} data-ok="unidade">
                      {(SD.unidade || []).map((u) => <option key={u[1]} value={u[1]}>{u[0]}</option>)}
                    </select>
                  </td>
                  <td><input className="cell n" inputMode="decimal" value={l.qtd} onChange={(e) => mudarLinha(l.id, "qtd", e.target.value)} data-ok="qtd" /></td>
                  <td><input className="cell n" inputMode="decimal" value={l.oco} onChange={(e) => mudarLinha(l.id, "oco", e.target.value)} data-ok="oco" /></td>
                  <td><input className="cell n" inputMode="decimal" value={l.vu} placeholder="0,00" onChange={(e) => mudarLinha(l.id, "vu", e.target.value)} data-ok="vu" /></td>
                  <td className="tot">{BRL(calcularLinha(l))}</td>
                  <td className="sc">
                    <select className="cell" value={String(l.fonte)} onChange={(e) => mudarLinha(l.id, "fonte", e.target.value)} data-ok="fonte">
                      {(SD.fonte || []).map((f) => <option key={f[1]} value={f[1]}>{f[0]}</option>)}
                    </select>
                  </td>
                  <td className="sc"><input className="cell" value={l.obs} placeholder="justificativa do item" onChange={(e) => mudarLinha(l.id, "obs", e.target.value)} /></td>
                  <td className="c-x">
                    <button type="button" className="xbtn" title="Duplicar"
                      onClick={() => alterar((copia) => {
                        const linhas = orcamentoDe(copia).linhas;
                        const i = linhas.findIndex((x) => x.id === l.id);
                        if (i < 0) return;
                        const nova = { ...linhas[i], id: uid("l") };
                        linhas.splice(i + 1, 0, nova);
                      }, true)}>⧉</button>
                    <button type="button" className="xbtn" title="Remover"
                      onClick={() => alterar((copia) => {
                        const orc = orcamentoDe(copia);
                        const i = orc.linhas.findIndex((x) => x.id === l.id);
                        if (i >= 0) orc.linhas.splice(i, 1);
                        if (!orc.linhas.length) orc.linhas.push(linhaVazia());
                      }, true)}>×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={9}>{o.linhas.length} {o.linhas.length === 1 ? "linha" : "linhas"}</td>
              <td className="tot">{BRL(totalItens(o))}</td>
              <td colSpan={4}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="orcbar">
        <button type="button" className="btn primary sm"
          onClick={() => alterar((copia) => {
            const linhas = orcamentoDe(copia).linhas;
            linhas.push(linhaVazia(linhas[linhas.length - 1]));
          }, true)}>+ Nova linha</button>
        <button type="button" className="btn sm" onClick={() => baixarArquivo(`orcamento-${slug(r.nome)}.csv`, csvOrcamento(r), "text/csv")}>Exportar CSV</button>
        <button type="button" className="btn sm" onClick={() => void copiarComAviso(textoOrcamento(r), "Planilha copiada em texto")}>Copiar planilha em texto</button>
      </div>

      {[...combinacoes.entries()].map(([chave, id]) => {
        const [produto, etapa] = chave.split("|");
        return (
          <datalist id={id} key={id}>
            {(SD.curadoria || []).map((c) => <option value={c[0]} key={"cur" + c[1] + c[0]} />)}
            {catalogoDe(produto, etapa).map((c) => <option value={c[0]} key={c[1] + c[0]} />)}
          </datalist>
        );
      })}
      <datalist id="lista-blocos">
        {(SD.blocos || []).map((b) => <option value={b} key={b} />)}
      </datalist>

      <details className="orcabs" open={o.usarAbs}>
        <summary>Custos vinculados em valores absolutos (em vez dos percentuais da tela "Custos vinculados")</summary>
        <label className="togg">
          <input type="checkbox" checked={o.usarAbs}
            onChange={(e) => alterar((copia) => { orcamentoDe(copia).usarAbs = e.target.checked; }, true)} />
          {" "}Usar valores absolutos (útil ao importar um orçamento antigo; o Salic só aceita percentual)
        </label>
        {o.usarAbs && (
          <div className="absgrid">
            {([["acess", "Acessibilidade"], ["adm", "Administração"], ["capt", "Captação (limite R$ 150.000,00)"]] as const).map(([k, rotulo]) => (
              <label key={k}>{rotulo}
                <input type="text" inputMode="decimal" value={o.abs[k]} placeholder="0,00"
                  onChange={(e) => alterar((copia) => { orcamentoDe(copia).abs[k] = e.target.value; })} />
              </label>
            ))}
          </div>
        )}
        {v.estourou && (
          <p className="aviso-in">
            <b>Acima do limite:</b> a remuneração de captação daria {BRL(v.captBruto)}, mas o Salic trava
            em R$ 150.000,00. Os totais já consideram o limite.
          </p>
        )}
      </details>
    </>
  );
}

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

  const PASSOS = [
    "Cadastrar os itens no Salic, etapa por etapa, dentro de cada produto e local",
    "Definir os percentuais em Custos vinculados e salvar, para a planilha recalcular",
    "Preencher o detalhamento do plano de distribuição",
    "Anexar os documentos exigidos",
    "Gerar o PDF e conferir",
    "Enviar a proposta ao MinC",
  ];

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
        {PASSOS.map((passo, i) => (
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
