/* Cálculos da planilha orçamentária do Salic: linhas, totais, custos vinculados
   (com o teto legal da captação), catálogo de itens e exportações em texto/CSV.
   Funções puras — nada de React. */
import { SALIC_DADOS } from "../../data";
import type { LinhaOrcamento, Orcamento, Rascunho } from "../../types";
import { BRL, dinheiro, num, uid } from "../../utils";

/** Limite legal da remuneração de captação. */
export const LIMITE_CAPTACAO = 150000;

const SD = SALIC_DADOS;

/** item (minúsculo) → código, juntando curadoria e todos os catálogos. */
const MAPA_CODIGOS: Record<string, string> = {};
(SD.curadoria || []).forEach((c) => { MAPA_CODIGOS[c[0].toLowerCase()] = c[1]; });
Object.values(SD.catalogos || {}).forEach((porEtapa) =>
  Object.values(porEtapa).forEach((itens) => itens.forEach((i) => { MAPA_CODIGOS[i[0].toLowerCase()] = i[1]; })));

export const codigoDoItem = (item: string) => MAPA_CODIGOS[item.toLowerCase()] || "";

/** Nome de um par [nome, código] a partir do código. */
export const nomePorCodigo = (arr: [string, string][], v: string) =>
  (arr || []).find((x) => String(x[1]) === String(v))?.[0] || "";

/** Catálogo de itens de um produto × etapa (cai no catálogo padrão). */
export const catalogoDe = (produto: string, etapa: string): [string, string][] => {
  const c = SD.catalogos[produto] || SD.catalogos[SD.catalogoPadrao];
  return (c && c[etapa]) || [];
};

/** Linha nova da planilha, herdando contexto da anterior. */
export const linhaVazia = (p: Partial<LinhaOrcamento> = {}): LinhaOrcamento => ({
  id: uid("l"), bloco: p.bloco || "", produto: p.produto || "", local: p.local || "",
  etapa: p.etapa || "prod", item: "", cod: "", unidade: p.unidade || "7",
  qtd: "1", oco: "1", vu: "", fonte: p.fonte || "109", obs: "",
});

/** Orçamento do rascunho, criando a estrutura se não existir. */
export function orcamentoDe(r: Rascunho): Orcamento {
  let o = r.valores.orcamento as Orcamento | undefined;
  if (!o || typeof o !== "object" || !Array.isArray(o.linhas)) {
    o = { linhas: [linhaVazia()], abs: { acess: "", adm: "", capt: "" }, usarAbs: false, check: {} };
    r.valores.orcamento = o;
  }
  o.abs = o.abs || { acess: "", adm: "", capt: "" };
  o.check = o.check || {};
  if (!o.linhas.length) o.linhas.push(linhaVazia());
  return o;
}

export const calcularLinha = (l: LinhaOrcamento) => num(l.qtd) * num(l.oco) * dinheiro(l.vu);
export const totalItens = (o: Orcamento) => o.linhas.reduce((s, l) => s + calcularLinha(l), 0);
export const pctDe = (v: unknown) => num(String(v || "").replace("%", ""));

/** Custos vinculados (acessibilidade, administração, captação) + valor do projeto. */
export function custosVinculados(r: Rascunho) {
  const o = orcamentoDe(r);
  const vp = totalItens(o);
  if (o.usarAbs) {
    const a = dinheiro(o.abs.acess), d = dinheiro(o.abs.adm), c = dinheiro(o.abs.capt);
    const capt = Math.min(c, LIMITE_CAPTACAO);
    return { acess: a, adm: d, capt, captBruto: c, estourou: c > LIMITE_CAPTACAO, total: a + d + capt, vp };
  }
  const a = (vp * pctDe(r.valores.cv_acessibilidade)) / 100;
  const d = (vp * pctDe(r.valores.cv_administracao)) / 100;
  const cb = (vp * pctDe(r.valores.cv_captacao)) / 100;
  const c = Math.min(cb, LIMITE_CAPTACAO);
  return { acess: a, adm: d, capt: c, captBruto: cb, estourou: cb > LIMITE_CAPTACAO, total: a + d + c, vp };
}

export const subtotalEtapa = (o: Orcamento, etapa: string) =>
  o.linhas.filter((l) => l.etapa === etapa).reduce((s, l) => s + calcularLinha(l), 0);

/** Planilha como texto, na ordem de digitação no Salic. */
export function textoOrcamento(r: Rascunho): string {
  const o = orcamentoDe(r);
  const ls = ["ORÇAMENTO, ordem de digitação no Salic"];
  const grupos: Record<string, LinhaOrcamento[]> = {};
  const ordem: string[] = [];
  o.linhas.forEach((l) => {
    const k = ((l.produto || "").trim() || "(produto a definir)") + " ||| " + ((l.local || "").trim() || "(local a definir)");
    if (!(k in grupos)) { grupos[k] = []; ordem.push(k); }
    grupos[k].push(l);
  });
  ordem.forEach((k) => {
    const [prod, loc] = k.split(" ||| ");
    let subtotalProduto = 0;
    ls.push("", "PRODUTO: " + prod, "LOCAL:   " + loc);
    (SD.etapas || []).forEach((e) => {
      const itens = grupos[k].filter((l) => l.etapa === e[0]);
      if (!itens.length) return;
      let subtotal = 0;
      ls.push("  ETAPA: " + e[1]);
      itens.forEach((l) => {
        const t = calcularLinha(l);
        subtotal += t; subtotalProduto += t;
        ls.push("    • " + (l.item || "(item)") + (l.cod ? ` [cód ${l.cod}]` : "") + (l.bloco ? `   {bloco: ${l.bloco}}` : ""));
        ls.push(`        Unidade: ${nomePorCodigo(SD.unidade, l.unidade)} [${l.unidade}]  |  Qtd: ${l.qtd || 0}  |  Ocorrência: ${l.oco || 0}  |  Valor unit.: ${BRL(dinheiro(l.vu))}  |  Total: ${BRL(t)}`);
        ls.push(`        Fonte: ${nomePorCodigo(SD.fonte, l.fonte)} [${l.fonte}]`);
        if (l.obs) ls.push("        Detalhamento: " + l.obs);
      });
      ls.push("    Subtotal da etapa: " + BRL(subtotal));
    });
    ls.push("  SUBTOTAL DO PRODUTO: " + BRL(subtotalProduto));
  });
  const v = custosVinculados(r);
  ls.push("", "CUSTOS VINCULADOS / REMUNERAÇÃO",
    "  Acessibilidade, comunicação e divulgação acessíveis: " + (o.usarAbs ? "" : (pctDe(r.valores.cv_acessibilidade) || 0) + "% = ") + BRL(v.acess),
    "  Custos de administração: " + (o.usarAbs ? "" : (pctDe(r.valores.cv_administracao) || 0) + "% = ") + BRL(v.adm),
    "  Remuneração para captação: " + (o.usarAbs ? "" : (pctDe(r.valores.cv_captacao) || 0) + "% = ") + BRL(v.capt) + (v.estourou ? "  (travado no limite de R$ 150.000,00)" : ""),
    "  Subtotal dos vinculados: " + BRL(v.total),
    "", "VALOR DO PROJETO: " + BRL(v.vp), "CUSTO TOTAL:     " + BRL(v.vp + v.total));
  return ls.join("\n");
}

/** Planilha como CSV (uma linha por item + custos vinculados). */
export function csvOrcamento(r: Rascunho): string {
  const o = orcamentoDe(r);
  const escapar = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const linhas: unknown[][] = [[
    "#", "Bloco", "Produto", "Local", "Etapa", "Item", "Codigo", "Unidade", "UnidadeCod",
    "Quantidade", "Ocorrencia", "ValorUnitario", "ValorTotal", "Fonte", "FonteCod", "Detalhamento",
  ]];
  o.linhas.forEach((l, i) => linhas.push([
    i + 1, l.bloco, l.produto, l.local,
    ((SD.etapas || []).find((e) => e[0] === l.etapa) || ["", "?"])[1],
    l.item, l.cod, nomePorCodigo(SD.unidade, l.unidade), l.unidade,
    num(l.qtd), num(l.oco), dinheiro(l.vu).toFixed(2), calcularLinha(l).toFixed(2),
    nomePorCodigo(SD.fonte, l.fonte), l.fonte, l.obs,
  ]));
  const v = custosVinculados(r);
  ([["Acessibilidade", v.acess], ["Administracao", v.adm], ["Captacao", v.capt]] as [string, number][])
    .forEach(([n, val]) => linhas.push(["", "Custos Vinculados", "", "", "", n, "", "", "", "", "", val.toFixed(2), val.toFixed(2), "", "", ""]));
  return linhas.map((x) => x.map(escapar).join(",")).join("\n");
}
