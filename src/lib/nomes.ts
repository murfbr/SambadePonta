/* Resolvedores de nomes entre coleções do Painel ("de quem é este projeto?",
   "qual o edital desta candidatura?") e rótulos derivados. */
import { porId } from "../store/mutacoes";
import type { Candidatura, Edital, Projeto, Tarefa } from "../types";

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

/** Edital de uma candidatura. */
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

/** Badge de status de tarefa (classe + rótulo). */
export function badgeTarefa(t: Tarefa): { classe: string; rotulo: string } {
  if (t.status === "feito") return { classe: "pill-ok", rotulo: "Concluído" };
  if (t.status === "and") return { classe: "st-prev", rotulo: "Em andamento" };
  return { classe: "b-type", rotulo: "A fazer" };
}
