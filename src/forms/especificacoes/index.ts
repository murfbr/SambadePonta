/* Junta as especificações de todas as entidades editáveis do Painel. */
import type { EntidadeSpec } from "../tipos";
import { artista } from "./artista";
import { projeto } from "./projeto";
import { edital } from "./edital";
import { candidatura } from "./candidatura";
import { tarefa } from "./tarefa";
import { reuniao } from "./reuniao";
import { equipe } from "./equipe";
import { elenco } from "./elenco";
import { contato } from "./contato";

export type ChaveEntidade =
  | "artista" | "projeto" | "edital" | "candidatura" | "tarefa"
  | "reuniao" | "equipe" | "elenco" | "contato";

export const ENTIDADES: Record<ChaveEntidade, EntidadeSpec> = {
  artista, projeto, edital, candidatura, tarefa, reuniao, equipe, elenco, contato,
};
