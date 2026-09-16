/* Tipos do Contexto: fichas de conhecimento de escrita, regras com fonte
   obrigatória e julgamentos (pareceres e lições). */

export type TipoFicha = "artista" | "projeto" | "edital";

/** Ficha de conhecimento de escrita — aponta para o MESMO id do Painel. */
export interface Ficha {
  /** Igual ao id da entidade no Painel (a1, p3, ed7...). */
  id: string;
  tipo: TipoFicha;
  /** Como abrir um parágrafo sobre isso. */
  posicionamento: string;
  /** Argumentos que convencem (artista/projeto). */
  argumentos: string[];
  /** O que o julgador pesa (edital). */
  julgador: string[];
  /** Vocabulário: usar assim, e não assim. */
  vocabulario: { usar: string; evitar: string }[];
  /** O que já foi dito, onde e quando (para não repetir). */
  usados: { texto: string; onde: string; quando: string }[];
  /** O que checar antes de escrever. */
  cuidados: string;
  atualizado?: string;
}

export type TipoRegra = "proibicao" | "obrigatorio" | "prioridade" | "estilo" | "dica";
export type TipoFonte = "edital" | "norma" | "julgamento" | "experiencia";

/** Regra de escrita, sempre com fonte. Sem fonte, a regra vira lenda. */
export interface Regra {
  id: string;
  texto: string;
  /** Escopo: geral, ou por artista/projeto/edital (id) ou mecanismo (nome). */
  escopo: { tipo: "geral" | "mecanismo" | TipoFicha; id: string };
  tipoRegra: TipoRegra;
  fonte: { tipo: TipoFonte; ref: string };
  /** "vigente" ou "duvida" (a confirmar). */
  status: string;
  atualizado?: string;
}

export type ResultadoJulgamento = "aprovado" | "reprovado" | "aguardando" | "parcial";

/** Julgamento: o que um parecer disse e as lições que viraram regra. */
export interface Julgamento {
  id: string;
  /** Id do edital no Painel. */
  edital: string;
  /** Id do projeto no Painel (opcional). */
  projeto: string;
  ano: string;
  resultado: ResultadoJulgamento;
  nota: string;
  resumo: string;
  /** Pontos fortes na leitura do julgador. */
  fortes: string[];
  fracos: string[];
  /** Lições; cada uma pode apontar a regra que virou. */
  licoes: { texto: string; regra: string }[];
  atualizado?: string;
}
