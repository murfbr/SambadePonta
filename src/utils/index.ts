/* Utilitários pequenos usados no site inteiro: ids, datas, dinheiro, clipboard, download. */

/** Gera um id curto com prefixo, no mesmo formato do artefato (ex. "c-x7k2p9"). */
export const uid = (prefixo: string) => prefixo + "-" + Math.random().toString(36).slice(2, 8);

/** Clona profundo via JSON — também remove `undefined`, o que o Firestore agradece. */
export const clonar = <T,>(x: T): T => (x == null ? x : JSON.parse(JSON.stringify(x)));

/** Hora local curta (ex. "14:32"), usada no indicador de salvamento. */
export const hora = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** "2026-10-13" → "13/10/2026". Qualquer outra coisa volta como veio. */
export function formatarData(iso?: string): string {
  if (!iso) return "—";
  const p = String(iso).split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}

/** Tempo relativo curto: "agora", "há 5 min", "há 2 h", "há 3 d". */
export function relativo(iso?: string): string {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso).getTime()) / 6e4;
  if (d < 1) return "agora";
  if (d < 60) return `há ${Math.round(d)} min`;
  if (d < 1440) return `há ${Math.round(d / 60)} h`;
  return `há ${Math.round(d / 1440)} d`;
}

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Número a partir de texto com vírgula ou ponto ("1,5" → 1.5). */
export const num = (v: unknown): number => {
  const n = parseFloat(String(v == null ? "" : v).replace(",", "."));
  return isNaN(n) ? 0 : n;
};

/** Dinheiro em texto brasileiro ("1.234,56" ou "1234.56") → número. */
export function dinheiro(v: unknown): number {
  let t = String(v == null ? "" : v).trim();
  if (!t) return 0;
  t = t.replace(/[^0-9.,-]/g, "");
  if (t.includes(",") && t.includes(".")) t = t.replace(/\./g, "").replace(",", ".");
  else if (t.includes(",")) t = t.replace(",", ".");
  const n = parseFloat(t);
  return isNaN(n) ? 0 : n;
}

/** Número → "R$ 1.234,56". */
export const BRL = (n: number) =>
  "R$ " + (n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Comparador de textos pt-BR: ignora acentos e caixa, números em ordem natural. */
export const comparar = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true }).compare;

/** Texto → slug para nome de arquivo ("Meu Rascunho" → "meu-rascunho"). */
export const slug = (s: string) =>
  String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "arquivo";

/** Garante protocolo em links digitados sem "https://". */
export const url = (u: string) => (/^https?:/i.test(u) ? u : "https://" + u);

/** Copia texto para a área de transferência; devolve true se deu certo. */
export async function copiar(texto: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(texto); return true; } catch { return false; }
}

/** Baixa um texto como arquivo (export de .json e .csv). */
export function baixarArquivo(nome: string, conteudo: string, tipo = "application/json") {
  const blob = new Blob([conteudo], { type: tipo + ";charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
