/* Tipos de todas as entidades da Central do Coletivo.
   Os nomes dos campos são exatamente os usados no artefato original — e são os nomes
   das propriedades dos documentos no Firestore. A única mudança estrutural: onde o
   artefato usava tuplas (array de arrays), aqui são arrays de objetos, porque o
   Firestore não aceita array aninhado em array. */

/* ══════════ Painel ══════════ */

/** Item de checklist simples usado em vários lugares (docs de candidatura etc.). */
export interface ItemChecklist {
  nome: string;
  ok: boolean;
  /** Observação livre (usada nos documentos editados pelo Simulador). */
  obs?: string;
}

/** Ficha detalhada do artista — alimentada pela ficha do acervo (sub-abas do detalhe). */
export interface DetalheArtista {
  /** Pares rótulo → valor exibidos em "Geral" (ex.: "Local": "Pedra do Leme"). */
  geral?: Record<string, string>;
  /** Histórico e realizações por ano. */
  portfolio?: { ano: string; texto: string }[];
  /** Acervo de documentos do artista, com status "ok" ou "pend". */
  docs?: { nome: string; status: string }[];
  /** Quantidade de fotos no acervo (placeholder visual). */
  fotos?: number;
  /** Links externos (Instagram, pasta no Drive...). */
  links?: { rotulo: string; url: string }[];
  /** Manual de marca resumido. */
  marca?: { cores: string[]; logo: string; fonte: string; obs: string };
}

/** Artista ou coletivo do portfólio (bloco, roda de samba, grupo...). */
export interface Artista {
  id: string;
  nome: string;
  /** Tipo livre: "Bloco de carnaval", "Grupo musical"... */
  tipo: string;
  /** Enquadramento jurídico: PF, MEI, PJ, "Coletivo sem CNPJ"... */
  enq: string;
  /** Situação do CNPJ (texto livre). */
  cnpj: string;
  /** Sede (município). */
  mun: string;
  bio: string;
  tags: string[];
  det?: DetalheArtista;
  /** Posição na listagem (mantida pelo armazenamento). */
  _ord?: number;
  /** Carimbo ISO da última gravação (mantido pelo armazenamento). */
  atualizado?: string;
}

/** Projeto de um artista: reúne candidaturas, produção e equipe. */
export interface Projeto {
  id: string;
  nome: string;
  artistaId: string;
  tipo: string;
  /** Meta de captação (texto livre, ex. "R$ 80 mil"). */
  meta: string;
  /** Janela / ano de realização. */
  ano: string;
  /** Checklist de produção, independente de edital. Status: "fazer" | "and" | "feito". */
  producao: { texto: string; status: string }[];
  /** Pessoas da equipe alocadas no projeto. */
  equipeIds: string[];
  _ord?: number;
  atualizado?: string;
}

export type EsferaEdital = "fed" | "est" | "mun" | "priv";
export type StatusEdital = "open" | "prev" | "closed";

/** Edital ou fonte de captação (lei de incentivo, patrocínio, credenciamento...). */
export interface Edital {
  id: string;
  nome: string;
  /** Órgão ou promotor (SMC-Rio, SECEC, MinC, empresa...). */
  orgao?: string;
  esfera: EsferaEdital;
  /** Mecanismo: "Renúncia fiscal", "Fomento direto", "Patrocínio"... */
  mec: string;
  /** Área contemplada (texto livre). */
  area: string;
  /** Elegibilidade em chips (ex. ["PJ", "2 anos de atuação"]). */
  eleg: string[];
  /** Teto de valor (texto livre). */
  teto: string;
  /** Prazo em texto (ex. "13/10/2026" ou "previsto p/ nov"). */
  prazo: string;
  /** Prazo em data ISO (yyyy-mm-dd) — alimenta Agenda e Calendário. */
  prazoIso?: string;
  /** Formulário correspondente no Simulador (id do registro, ex. "dc-138"). */
  formId?: string;
  status: StatusEdital;
  /** O que financia. */
  objeto?: string;
  /** Quem pode se inscrever. */
  publico?: string;
  /** Como se inscrever. */
  comoInscrever?: string;
  contrapartidas?: string;
  /** Documentos exigidos (um por linha na edição). */
  docsExig?: string[];
  linkEdital?: string;
  linkDrive?: string;
  obs?: string;
  /** Data em que as infos foram verificadas. */
  verif?: string;
  _ord?: number;
  atualizado?: string;
}

/** Candidatura = projeto × edital. É o cartão do pipeline. */
export interface Candidatura {
  id: string;
  projetoId: string;
  editalId: string;
  /** Responsável (id de pessoa da equipe). */
  respId: string;
  /** Valor pleiteado (texto livre). */
  valor: string;
  /** Etapa no pipeline: índice 0–7 em ETAPAS. */
  etapa: number;
  /** Resultado quando chega em "Aprovado / Reprovado": "ok" | "no". */
  result?: "ok" | "no";
  /** Checklist de documentos da inscrição. */
  docs?: ItemChecklist[];
  /** Pasta da inscrição no Google Drive. */
  linkDrive?: string;
  _ord?: number;
  atualizado?: string;
}

export type StatusTarefa = "fazer" | "and" | "feito";

/** Tarefa designada à equipe. Nasce solta ou vinculada (origem). */
export interface Tarefa {
  id: string;
  titulo: string;
  respId: string;
  /** Vínculo: "proj:p1" | "cand:c2" | "reuniao:r1" | "" (sem vínculo). */
  origem: string;
  /** Prazo ISO (yyyy-mm-dd). */
  prazo: string;
  obs: string;
  status: StatusTarefa;
  _ord?: number;
  atualizado?: string;
}

/** Reunião do coletivo: pauta antes, ata depois, encaminhamentos viram tarefas. */
export interface Reuniao {
  id: string;
  titulo: string;
  /** Data ISO. */
  data: string;
  /** Hora (ex. "19:00"). */
  hora: string;
  recorrencia: string;
  /** Próxima ocorrência (data ISO), para recorrentes. */
  proxima?: string;
  local: string;
  participanteIds: string[];
  /** Convidados externos (e-mails). */
  emailsExtra: string[];
  pauta: string[];
  ata: string;
  status: "agendada" | "realizada";
  _ord?: number;
  atualizado?: string;
}

/** Pessoa da equipe do coletivo (quem recebe tarefas e convites de reunião). */
export interface PessoaEquipe {
  id: string;
  /** Nome artístico / como é chamado(a). */
  nome: string;
  nomeCompleto?: string;
  email?: string;
  rg?: string;
  cpf?: string;
  /** Data de nascimento ISO. */
  nascimento?: string;
  funcoes: string[];
  _ord?: number;
  atualizado?: string;
}

/** Colaborador de elenco (músicos e técnicos que entram nos editais). */
export interface Colaborador {
  id: string;
  nome: string;
  nomeCompleto?: string;
  funcao: string;
  email?: string;
  rg?: string;
  cpf?: string;
  nascimento?: string;
  bio: string;
  /** Situação dos documentos: "ok" | "pend". */
  docsStatus: string;
  _ord?: number;
  atualizado?: string;
}

/** Contato externo (patrocinador, órgão, responsável por edital). */
export interface Contato {
  id: string;
  nome: string;
  tipo: string;
  /** Referência (edital, empresa...). */
  ref: string;
  contato: string;
  _ord?: number;
  atualizado?: string;
}

/* ══════════ Simulador ══════════ */

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

/* ── Definição dos formulários (config estática, não vai para o banco) ── */

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

/* ══════════ Contexto ══════════ */

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

/* ══════════ Conjuntos e constantes ══════════ */

/** As nove coleções do Painel, na ordem de exibição. */
export interface DadosPainel {
  artistas: Artista[];
  projetos: Projeto[];
  editais: Edital[];
  candidaturas: Candidatura[];
  tarefas: Tarefa[];
  equipe: PessoaEquipe[];
  elenco: Colaborador[];
  contatos: Contato[];
  reunioes: Reuniao[];
}

export type ColecaoPainel = keyof DadosPainel;

export const COLECOES_PAINEL: ColecaoPainel[] = [
  "artistas", "projetos", "editais", "candidaturas", "tarefas",
  "equipe", "elenco", "contatos", "reunioes",
];

/** Etapas do pipeline de captação (índice = campo `etapa` da candidatura). */
export const ETAPAS_PIPELINE = [
  "Prospecção", "Elegível", "Montando documentação", "Inscrito",
  "Aguardando resultado", "Aprovado / Reprovado", "Em execução", "Prestação de contas",
] as const;

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
