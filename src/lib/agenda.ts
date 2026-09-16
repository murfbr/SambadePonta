/* Agenda derivada: os prazos vêm dos editais com data, e cada reunião sabe
   gerar seu link de convite do Google Agenda. */
import { porId } from "../store/mutacoes";
import type { Candidatura, Edital, Reuniao } from "../types";

/** Evento de prazo derivado dos editais com data. */
export interface EventoAgenda {
  iso: string;
  titulo: string;
  candidaturas: Candidatura[];
  status: Edital["status"];
}

/** Prazos com data, ordenados — a Agenda inteira deriva daqui. */
export function eventosAgenda(editais: Edital[], candidaturas: Candidatura[]): EventoAgenda[] {
  return editais
    .filter((e) => e.prazoIso)
    .map((e) => ({
      iso: e.prazoIso!,
      titulo: e.nome,
      candidaturas: candidaturas.filter((c) => c.editalId === e.id),
      status: e.status,
    }))
    .sort((a, b) => (a.iso < b.iso ? -1 : 1));
}

/** Título curto de um evento (corta o que vem depois de "—" ou "("). */
export const tituloCurto = (t: string) => t.split(/[—(]/)[0].trim();

/** Nomes dos participantes de uma reunião. */
export const nomesParticipantes = (r: Reuniao): string[] =>
  (r.participanteIds || []).map((id) => porId("equipe", id)?.nome).filter(Boolean) as string[];

/** E-mails de convite: participantes com e-mail + convidados externos. */
export const emailsConvite = (r: Reuniao): string[] => [
  ...((r.participanteIds || []).map((id) => porId("equipe", id)?.email).filter(Boolean) as string[]),
  ...(r.emailsExtra || []),
];

/** Link "adicionar ao Google Agenda" de uma reunião, com convidados e recorrência. */
export function linkGoogleAgenda(r: Reuniao, emails: string[]): string {
  const enc = encodeURIComponent;
  let dates = "";
  if (r.data) {
    const d = String(r.data).replace(/-/g, "");
    const hm = (r.hora || "").match(/(\d{1,2}):(\d{2})/);
    if (hm) {
      const h = hm[1].padStart(2, "0");
      const fim = String((Number(hm[1]) + 1) % 24).padStart(2, "0");
      dates = `${d}T${h}${hm[2]}00/${d}T${fim}${hm[2]}00`;
    } else dates = d + "/" + d;
  }
  const recorrencia: Record<string, string> = {
    "Diária": "RRULE:FREQ=DAILY", "Semanal": "RRULE:FREQ=WEEKLY",
    "Quinzenal": "RRULE:FREQ=WEEKLY;INTERVAL=2", "Mensal": "RRULE:FREQ=MONTHLY",
  };
  let u = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + enc(r.titulo || "Reunião");
  if (dates) u += "&dates=" + dates;
  if (r.local) u += "&location=" + enc(r.local);
  if (r.pauta?.length) u += "&details=" + enc("Pauta:\n- " + r.pauta.join("\n- "));
  if (emails.length) u += "&add=" + enc(emails.join(","));
  const rec = recorrencia[r.recorrencia];
  if (rec) u += "&recur=" + enc(rec);
  return u;
}
