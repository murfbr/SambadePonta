/* Pedaços compartilhados pelos ambientes do Painel: cabeçalho de seção,
   resolvedores de nomes entre coleções e os eventos de agenda. */
import type { ReactNode } from "react";
import { porId } from "../banco/dados";
import type { Candidatura, Edital, Projeto, Reuniao, Tarefa } from "../tipos";

/** Cabeçalho de seção: título, subtítulo e ações à direita. */
export function Shead({ titulo, sub, children }: { titulo: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="shead">
      <h2>{titulo}</h2>
      {sub && <span className="sub">{sub}</span>}
      <span className="act">{children}</span>
    </div>
  );
}

/** Nome do artista de um projeto. */
export const nomeArtistaDe = (p?: Projeto): string =>
  (p && porId("artistas", p.artistaId)?.nome) || "—";

/** Nome de uma pessoa da equipe. */
export const nomeEquipe = (id?: string): string =>
  (id && porId("equipe", id)?.nome) || "—";

/** "Projeto · Artista" de uma candidatura. */
export function projetoArtistaDe(c: Candidatura): string {
  const p = porId("projetos", c.projetoId);
  return p ? p.nome + " · " + nomeArtistaDe(p) : "—";
}

/** Nome do edital de uma candidatura. */
export const editalDe = (c: Candidatura): Edital | undefined => porId("editais", c.editalId);
export const nomeEdital = (c: Candidatura): string => editalDe(c)?.nome || "—";

/** Rótulo do vínculo de uma tarefa ("Projeto · X", "Reunião · Y", "Candidatura · Z"). */
export function rotuloOrigem(origem?: string): string {
  if (!origem) return "—";
  const [tipo, id] = origem.split(":");
  if (tipo === "proj") return "Projeto · " + (porId("projetos", id)?.nome || "?");
  if (tipo === "reuniao") {
    const r = porId("reunioes", id);
    return "Reunião · " + (r ? r.titulo || r.data : "?");
  }
  const c = porId("candidaturas", id);
  return c ? "Candidatura · " + nomeEdital(c) : "?";
}

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

/** Badge de status de tarefa (classe + rótulo). */
export function badgeTarefa(t: Tarefa): { classe: string; rotulo: string } {
  if (t.status === "feito") return { classe: "pill-ok", rotulo: "Concluído" };
  if (t.status === "and") return { classe: "st-prev", rotulo: "Em andamento" };
  return { classe: "b-type", rotulo: "A fazer" };
}
