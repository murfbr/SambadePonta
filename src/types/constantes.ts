/* Constantes de domínio: etapas do pipeline, rótulos e classes de badge. */
import type { ColecaoPainel, EsferaEdital, StatusEdital, StatusTarefa } from "./painel";
import type { ResultadoJulgamento, TipoFonte, TipoRegra } from "./contexto";
import type { StatusCampo } from "./simulador";

/** As nove coleções do Painel, na ordem de exibição. */
export const COLECOES_PAINEL: ColecaoPainel[] = [
  "artistas", "projetos", "editais", "candidaturas", "tarefas",
  "equipe", "elenco", "contatos", "reunioes",
];

/** Nomes das coleções do Painel, para o exportar/importar e afins. */
export const ROTULO_COLECAO: Record<ColecaoPainel, string> = {
  artistas: "Artistas", projetos: "Projetos", editais: "Editais & fontes",
  candidaturas: "Candidaturas (pipeline)", tarefas: "Tarefas", equipe: "Equipe do coletivo",
  elenco: "Elenco / colaboradores", contatos: "Contatos externos", reunioes: "Reuniões",
};

/** Etapas do pipeline de captação (índice = campo `etapa` da candidatura). */
export const ETAPAS_PIPELINE = [
  "Prospecção", "Elegível", "Montando documentação", "Inscrito",
  "Aguardando resultado", "Aprovado / Reprovado", "Em execução", "Prestação de contas",
] as const;

/** Índice da etapa "Aprovado / Reprovado" — onde o resultado é marcado. */
export const ETAPA_RESULTADO = 5;

export const ESFERAS: Record<EsferaEdital, { rotulo: string; classe: string }> = {
  fed: { rotulo: "Federal", classe: "e-fed" },
  est: { rotulo: "Estadual", classe: "e-est" },
  mun: { rotulo: "Municipal", classe: "e-mun" },
  priv: { rotulo: "Privado", classe: "e-priv" },
};

export const STATUS_EDITAL: Record<StatusEdital, { rotulo: string; classe: string }> = {
  open: { rotulo: "Aberto", classe: "st-open" },
  prev: { rotulo: "Previsto", classe: "st-prev" },
  closed: { rotulo: "Encerrado", classe: "st-closed" },
};

export const STATUS_TAREFA: StatusTarefa[] = ["fazer", "and", "feito"];
export const ROTULO_TAREFA: Record<StatusTarefa, string> = {
  fazer: "A fazer", and: "Em andamento", feito: "Concluído",
};

export const ROTULO_TIPO_REGRA: Record<TipoRegra, string> = {
  proibicao: "proibição", obrigatorio: "obrigatório", prioridade: "prioridade do julgador",
  estilo: "estilo de texto", dica: "dica",
};

export const ROTULO_FONTE: Record<TipoFonte, string> = {
  edital: "edital", norma: "norma", julgamento: "julgamento", experiencia: "experiência",
};

export const ROTULO_RESULTADO: Record<ResultadoJulgamento, string> = {
  aprovado: "aprovado", reprovado: "reprovado", aguardando: "aguardando", parcial: "parcial",
};

/** Rótulos dos status de campo do Simulador (vazio é derivado, não gravado). */
export const ROTULO_STATUS_CAMPO: Record<StatusCampo | "vazio", string> = {
  vazio: "vazio", rasc: "rascunho", rev: "revisado", col: "colado",
};
