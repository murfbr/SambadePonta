/* Motor do Simulador: funções puras sobre rascunhos e formulários — achatar
   campos, condições de exibição, status efetivo, progresso e texto para
   transferência. Os cálculos do orçamento Salic vivem em ./orcamento. */
import { formularioDe } from "../../data";
import type {
  BlocoFormulario, CampoFormulario, EtapaFormulario, CondicaoQuando,
  Formulario, Orcamento, Rascunho, StatusCampo,
} from "../../types";
import { num } from "../../utils";
import { textoOrcamento } from "./orcamento";

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

/* Cache do achatamento, invalidado por referência: quando a definição muda no
   banco (reimportada), o objeto do estado é outro e o cache recalcula. */
const cacheCampos: Record<string, { fonte: Formulario; lista: CampoAchatado[] }> = {};

/** Todos os campos de um formulário, achatados com etapa e bloco. */
export function campos(form: string): CampoAchatado[] {
  const f = formularioDe(form);
  if (!f) return [];
  const cache = cacheCampos[form];
  if (cache && cache.fonte === f) return cache.lista;
  const saida: CampoAchatado[] = [];
  f.etapas.forEach((e, ei) =>
    e.blocos.forEach((b) =>
      b.campos.forEach((c) => {
        if (c.n) saida.push({ ...c, n: c.n, etapa: e, ei, bloco: b });
      })));
  cacheCampos[form] = { fonte: f, lista: saida };
  return saida;
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
  const f = formularioDe(r.form);
  if (!f) return r.nome;
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
