/* Motor do Simulador: funções puras sobre rascunhos e formulários.
   Nada de React aqui — é a mecânica que o artefato tinha em sim.js:
   achatar campos, condições de exibição, status efetivo, progresso,
   texto para transferência e os cálculos da planilha orçamentária do Salic. */
import { FORMULARIOS, SALIC_DADOS } from "../../dados/estaticos";
import type {
  BlocoFormulario, CampoFormulario, CondicaoQuando, EtapaFormulario,
  LinhaOrcamento, Orcamento, Rascunho, StatusCampo,
} from "../../tipos";
import { BRL, dinheiro, num, uid } from "../../util";

/** Campo achatado: o campo mais a etapa e o bloco onde vive. */
export interface CampoAchatado extends CampoFormulario {
  n: string;
  etapa: EtapaFormulario;
  /** Índice da etapa. */
  ei: number;
  bloco: BlocoFormulario;
}

/** Cria um rascunho novo, vazio, de um formulário. */
export function novoRascunho(form: string, nome?: string, ref?: string): Rascunho {
  const agora = new Date().toISOString();
  return {
    id: "r-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    form, nome: nome || "Sem nome", ref: ref || "", arquivado: false,
    criado: agora, atualizado: agora,
    valores: {}, anexos: {}, status: {}, notas: {},
    interno: { anot: "", prop: { nome: "", perfil: "", obs: "" }, agentes: [], crono: [], docs: [] },
  };
}

/** Garante todas as sub-estruturas num rascunho vindo do banco ou de import. */
export function normalizarRascunho(r: Rascunho): Rascunho {
  r.valores = r.valores || {};
  r.anexos = r.anexos || {};
  r.status = r.status || {};
  r.notas = r.notas || {};
  r.interno = r.interno || ({} as Rascunho["interno"]);
  const i = r.interno;
  i.anot = i.anot || "";
  i.prop = i.prop || { nome: "", perfil: "", obs: "" };
  i.agentes = i.agentes || [];
  i.crono = i.crono || [];
  i.docs = i.docs || [];
  return r;
}

const cacheCampos: Record<string, CampoAchatado[]> = {};

/** Todos os campos de um formulário, achatados com etapa e bloco. */
export function campos(form: string): CampoAchatado[] {
  if (cacheCampos[form]) return cacheCampos[form];
  const f = FORMULARIOS[form];
  if (!f) return [];
  const saida: CampoAchatado[] = [];
  f.etapas.forEach((e, ei) =>
    e.blocos.forEach((b) =>
      b.campos.forEach((c) => {
        if (c.n) saida.push({ ...c, n: c.n, etapa: e, ei, bloco: b });
      })));
  return (cacheCampos[form] = saida);
}

/** Uma condição `quando` está satisfeita para os valores atuais? */
export const condicaoOk = (q: CondicaoQuando | undefined, valores: Record<string, unknown>) =>
  !q || q.v.includes((valores[q.n] as string) || "");

/** O campo está visível (condições do bloco e do próprio campo)? */
export const visivel = (c: CampoAchatado, valores: Record<string, unknown>) =>
  condicaoOk(c.bloco?.quando, valores) && condicaoOk(c.quando, valores);

/** O valor conta como preenchido? (strings, listas, objetos de docs, orçamento...) */
export function temValor(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v))
    return v.some((x) => typeof x === "object" && x !== null
      ? Object.values(x).some((y) => String(y ?? "").trim() !== "")
      : String(x).trim() !== "");
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (Array.isArray((o as { linhas?: unknown }).linhas))
      return (o as unknown as Orcamento).linhas.some((l) => String(l.item || "").trim() !== "" || num(l.vu) > 0);
    return Object.values(o).some((x) => x === true || (typeof x === "string" && x.trim() !== ""));
  }
  return String(v).trim() !== "";
}

/** Status efetivo de um campo: "vazio" quando sem conteúdo; senão o status marcado. */
export const statusEfetivo = (r: Rascunho, c: CampoAchatado): StatusCampo | "vazio" =>
  temValor(r.valores[c.n]) ? r.status[c.n] || "rasc" : "vazio";

/** Valor de um campo como texto simples (para copiar / transferir). */
export function textoDe(c: CampoAchatado, v: unknown, r?: Rascunho): string {
  if (v == null) return "";
  if (c.t === "chk") return (Array.isArray(v) ? v : []).join("; ");
  if (c.t === "rep")
    return (Array.isArray(v) ? (v as Record<string, string>[]) : [])
      .map((o, i) => `${i + 1}. ` + (c.campos || [])
        .map((k) => (k.n && o[k.n] ? `${k.l}: ${o[k.n]}` : ""))
        .filter(Boolean).join(" · "))
      .join("\n");
  if (c.t === "docs")
    return Object.entries((v as Record<string, boolean>) || {})
      .filter(([, ok]) => ok).map(([nome]) => "☑ " + nome).join("\n");
  if (c.t === "orc") return r ? textoOrcamento(r) : "";
  if (c.t === "orcresumo") return "";
  return String(v);
}

/** Contagem de campos por status (para as barras de progresso da Mesa). */
export function resumoRascunho(r: Rascunho) {
  const cs = campos(r.form).filter((c) => visivel(c, r.valores));
  const t = { vazio: 0, rasc: 0, rev: 0, col: 0, total: cs.length };
  cs.forEach((c) => { t[statusEfetivo(r, c)]++; });
  return t;
}

/** Percentual preenchido de uma etapa (prioriza os obrigatórios). */
export function pctEtapa(r: Rascunho, ei: number): number {
  let cs = campos(r.form).filter((c) => c.ei === ei && c.req && visivel(c, r.valores));
  if (!cs.length) cs = campos(r.form).filter((c) => c.ei === ei && visivel(c, r.valores) && c.t !== "orcresumo");
  if (!cs.length) return 0;
  return Math.round((100 * cs.filter((c) => temValor(r.valores[c.n])).length) / cs.length);
}

/** Percentual geral do rascunho. */
export function pctRascunho(r: Rascunho): number {
  const s = resumoRascunho(normalizarRascunho(r));
  return s.total ? Math.round((100 * (s.rasc + s.rev + s.col)) / s.total) : 0;
}

/** Rascunho inteiro como texto (botão "Copiar tudo em texto"). */
export function comoTexto(r: Rascunho): string {
  const f = FORMULARIOS[r.form];
  const saida = [r.nome + " · " + f.nome + "\n"];
  f.etapas.forEach((e) => {
    saida.push("= " + e.nome.toUpperCase());
    e.blocos.forEach((b) => {
      const cs = b.campos
        .filter((c): c is CampoFormulario & { n: string } => Boolean(c.n))
        .map((c) => ({ ...c, etapa: e, ei: 0, bloco: b } as CampoAchatado))
        .filter((c) => c.t !== "orcresumo" && visivel(c, r.valores) && temValor(r.valores[c.n]));
      if (!cs.length) return;
      saida.push("\n-- " + b.t + (b.tag ? ` (${b.tag})` : ""));
      cs.forEach((c) => saida.push(`${c.l} [${c.cod || c.n}]\n${textoDe(c, r.valores[c.n], r)}\n`));
    });
    saida.push("");
  });
  return saida.join("\n");
}

/* ══════════ Orçamento Salic ══════════ */

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
