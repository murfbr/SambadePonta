/* Urgência de prazos: junta editais com data, tarefas com prazo e reuniões
   agendadas numa lista única classificada (vencido, hoje, ≤3 dias, ≤7 dias).
   Funções puras sobre DadosPainel — a mesma classificação vai servir ao
   resumo por e-mail quando o backend existir. */
import type { DadosPainel } from "../types";

export type Urgencia = "vencido" | "hoje" | "d3" | "d7" | "futuro";

export interface ItemPrazo {
  iso: string;
  tipo: "edital" | "tarefa" | "reuniao";
  id: string;
  titulo: string;
  /** Complemento: candidaturas ligadas, responsável, hora... */
  detalhe: string;
  urgencia: Urgencia;
}

/** Data local de hoje em ISO (yyyy-mm-dd) — sem a armadilha de fuso do toISOString. */
export function hojeIso(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/** Dias corridos entre hoje e a data (negativo = já passou). Meio-dia evita horário de verão. */
const diasAte = (iso: string, hoje: string) =>
  Math.round((new Date(iso + "T12:00:00").getTime() - new Date(hoje + "T12:00:00").getTime()) / 86400000);

export function urgenciaDe(iso: string, hoje = hojeIso()): Urgencia {
  const d = diasAte(iso, hoje);
  if (d < 0) return "vencido";
  if (d === 0) return "hoje";
  if (d <= 3) return "d3";
  if (d <= 7) return "d7";
  return "futuro";
}

export const ROTULO_URGENCIA: Record<Urgencia, string> = {
  vencido: "venceu", hoje: "é hoje", d3: "≤ 3 dias", d7: "≤ 7 dias", futuro: "",
};

export const CLASSE_URGENCIA: Record<Urgencia, string> = {
  vencido: "ur-vencido", hoje: "ur-hoje", d3: "ur-d3", d7: "ur-d7", futuro: "ur-futuro",
};

/**
 * Todos os prazos vivos do Painel, do mais próximo (ou mais vencido) ao mais
 * distante: editais não-encerrados com data, tarefas não-feitas com prazo e
 * reuniões agendadas de hoje em diante (reunião passada não é pendência).
 */
export function itensDePrazo(painel: DadosPainel, hoje = hojeIso()): ItemPrazo[] {
  const itens: ItemPrazo[] = [];

  for (const e of painel.editais) {
    if (!e.prazoIso || e.status === "closed") continue;
    const n = painel.candidaturas.filter((c) => c.editalId === e.id).length;
    itens.push({
      iso: e.prazoIso, tipo: "edital", id: e.id, titulo: e.nome,
      detalhe: n ? n + " candidatura(s)" : "sem candidatura vinculada",
      urgencia: urgenciaDe(e.prazoIso, hoje),
    });
  }
  for (const t of painel.tarefas) {
    if (!t.prazo || t.status === "feito") continue;
    const resp = painel.equipe.find((p) => p.id === t.respId)?.nome || "";
    itens.push({ iso: t.prazo, tipo: "tarefa", id: t.id, titulo: t.titulo, detalhe: resp, urgencia: urgenciaDe(t.prazo, hoje) });
  }
  for (const r of painel.reunioes) {
    const data = r.status === "agendada" ? (r.proxima || r.data) : "";
    if (!data || urgenciaDe(data, hoje) === "vencido") continue;
    itens.push({ iso: data, tipo: "reuniao", id: r.id, titulo: r.titulo || "Reunião", detalhe: r.hora || "", urgencia: urgenciaDe(data, hoje) });
  }

  return itens.sort((a, b) => (a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0));
}

/** Quantos prazos pedem atenção (vencidos ou nos próximos 7 dias). */
export const contarUrgentes = (painel: DadosPainel): number =>
  itensDePrazo(painel).filter((p) => p.urgencia !== "futuro").length;
