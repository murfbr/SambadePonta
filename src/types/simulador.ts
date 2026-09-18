/* Tipos do Simulador: rascunhos, a definição dos formulários replicados
   (config estática, não vai para o banco) e os catálogos do Salic. */
import type { ItemChecklist } from "./painel";

/** Status de preenchimento de um campo do rascunho. */
export type StatusCampo = "rasc" | "rev" | "col";

/** Linha da planilha orçamentária do Salic. */
export interface LinhaOrcamento {
  id: string;
  /** Coluna própria do coletivo (não existe no Salic). */
  bloco: string;
  produto: string;
  local: string;
  /** Código da etapa Salic (ex. "prod"). */
  etapa: string;
  item: string;
  cod: string;
  /** Código da unidade Salic. */
  unidade: string;
  qtd: string;
  /** Ocorrência. */
  oco: string;
  /** Valor unitário (texto no formato brasileiro). */
  vu: string;
  /** Código da fonte Salic. */
  fonte: string;
  /** Detalhamento / justificativa do item. */
  obs: string;
}

/** Valor do campo especial "orc" (planilha orçamentária). */
export interface Orcamento {
  linhas: LinhaOrcamento[];
  /** Custos vinculados em valores absolutos (alternativa aos percentuais). */
  abs: { acess: string; adm: string; capt: string };
  usarAbs: boolean;
  /** Checklist "antes de enviar" (índice → marcado). */
  check: Record<string, boolean>;
}

/** Seção interna do rascunho — nada disso vai para a plataforma. */
export interface InternoRascunho {
  /** Anotações gerais (até 3000 caracteres). */
  anot: string;
  /** Proponente: quem assina a inscrição. */
  prop: { nome: string; perfil: string; obs: string };
  agentes: { nome: string; tipo: string; vinc: string; papel: string }[];
  /** Cronograma interno de marcos. */
  crono: { data: string; m: string; ok: boolean }[];
  /** Documentos necessários só deste rascunho. */
  docs: ItemChecklist[];
}

/** Rascunho de proposta num formulário do Simulador. */
export interface Rascunho {
  id: string;
  /** Id do formulário (ex. "dc-138", "salic-proposta"). */
  form: string;
  nome: string;
  /** Candidatura do Painel a que se refere (ou ""). */
  ref: string;
  arquivado: boolean;
  criado: string;
  atualizado: string;
  /** Valores por nome de campo. Tipos variados: string, string[], objetos... */
  valores: Record<string, unknown>;
  /** Marcação "arquivo pronto" dos campos tipo anexo. */
  anexos: Record<string, boolean>;
  /** Status manual por campo (rasc/rev/col); ausente = rascunho. */
  status: Record<string, StatusCampo>;
  /** Notas internas por campo. */
  notas: Record<string, string>;
  interno: InternoRascunho;
}

/* ── Definição dos formulários replicados ── */

/** Tipos de campo do motor de formulários. */
export type TipoCampo =
  | "txt" | "ta" | "sel" | "rad" | "chk" | "date"
  | "rep" | "docs" | "anexo" | "orc" | "orcresumo" | "info";

/** Condição de exibição: mostra quando o campo `n` tem um dos valores `v`. */
export interface CondicaoQuando {
  n: string;
  v: string[];
}

/** Campo de um formulário replicado. */
export interface CampoFormulario {
  /** name real do campo na plataforma (ex. "campo[571394]"). Ausente em "info". */
  n?: string;
  /** Rótulo. */
  l?: string;
  t: TipoCampo;
  opts?: string[];
  /** Grupos de opções (checklists longas com cabeçalho). */
  grupos?: { g: string | null; op: string[] }[];
  max?: number;
  req?: number | boolean;
  /** Somente leitura (preenchido pela plataforma). */
  ro?: number | boolean;
  /** Texto de ajuda da plataforma. */
  dica?: string;
  /** Código exibido quando difere do name. */
  cod?: string;
  cls?: string;
  /** Subcampos, para tipo "rep" (listas repetíveis). */
  campos?: CampoFormulario[];
  quando?: CondicaoQuando;
  /** Mostra caixa de filtro nas checklists longas. */
  filter?: number | boolean;
  /** Opções em linha (rádios curtos). */
  inline?: number | boolean;
  /** HTML fixo, para tipo "info". */
  html?: string;
}

export interface BlocoFormulario {
  /** Título do bloco. */
  t: string;
  /** Código/observação ao lado do título. */
  tag?: string;
  quando?: CondicaoQuando;
  campos: CampoFormulario[];
}

export interface EtapaFormulario {
  id: string;
  nome: string;
  /** Código da etapa na plataforma. */
  cod?: string;
  /** Agrupador visual no menu lateral (Salic). */
  grupo?: string;
  blocos: BlocoFormulario[];
}

export interface Formulario {
  id: string;
  nome: string;
  plataforma: string;
  /** Navegação: "lista" | "stepper" | "lateral". */
  nav?: string;
  extraido?: string;
  obs?: string;
  etapas: EtapaFormulario[];
  /** Carimbo ISO da gravação no banco (mantido pelo armazenamento). */
  atualizado?: string;
}

/** Registro de formulários (o que está mapeado e migrado). */
export interface RegistroFormulario {
  id: string;
  nome: string;
  plataforma: string;
  etapas: number;
  campos?: number;
  extraido: string;
  mapeamento: string;
  especiais?: string;
  migrado?: boolean;
  /** Link do artefato antigo, quando ainda não migrado. */
  antigo?: string;
}

export interface Plataforma {
  id: string;
  nome: string;
  orgao: string;
  arq: string;
  porta: string;
  codigos: string;
  limites: string;
  anexos: string;
  armadilhas: string;
}

/** Dados de apoio do Salic (catálogos da planilha orçamentária). */
export interface SalicDados {
  tipicidade: [string, string, [string, string][]][];
  etapas: [string, string][];
  unidade: [string, string][];
  fonte: [string, string][];
  produtos: string[];
  blocos: string[];
  curadoria: [string, string][];
  catalogos: Record<string, Record<string, [string, string][]>>;
  catalogoPadrao: string;
}
