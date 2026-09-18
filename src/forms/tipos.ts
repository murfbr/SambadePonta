/* Tipos das especificações de formulário do Painel: cada entidade descreve os
   próprios campos numa tabela e o FormularioRegistro desenha o modal sozinho. */
import type { ColecaoPainel } from "../types";

/** Tipos de campo disponíveis no editor de registros. */
export type TipoCampoRegistro =
  | "texto"      // input simples (padrão)
  | "textarea"
  | "date"
  | "select"     // opções fixas (o valor É o rótulo)
  | "opts"       // pares [valor, rótulo]
  | "ref"        // aponta um registro de outra coleção
  | "origem"     // vínculo polimórfico da tarefa (projeto/reunião/candidatura)
  | "csv"        // lista separada por vírgula
  | "lines"      // lista um-por-linha
  | "multi";     // vários registros de outra coleção (checkboxes)

export interface CampoSpec {
  chave: string;
  rotulo: string;
  tipo?: TipoCampoRegistro;
  /** select: opções; opts: pares [valor, rótulo] — ou função que os produz na
      hora (para listas que vêm do banco); ref/multi: nome da coleção. */
  fonte?: string[] | [string, string][] | ColecaoPainel | (() => [string, string][]);
}

export interface EntidadeSpec {
  titulo: string;
  colecao: ColecaoPainel;
  /** Prefixo do id gerado (ex. "a" → "a-x7k2p9"). */
  prefixoId: string;
  padrao?: Record<string, unknown>;
  campos: CampoSpec[];
  /** Ajustes depois de salvar os campos (ex. candidatura ganha checklist de docs). */
  depois?: (registro: Record<string, unknown>) => void;
}
