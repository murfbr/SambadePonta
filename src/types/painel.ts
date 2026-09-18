/* Tipos das entidades do Painel (as nove coleções de gestão).
   Os nomes dos campos são exatamente os do artefato original — e são os nomes
   das propriedades dos documentos no Firestore. Onde o artefato usava tuplas
   (array de arrays), aqui são arrays de objetos: o Firestore não aceita array
   aninhado em array. */

/** Item de checklist simples usado em vários lugares (docs de candidatura etc.). */
export interface ItemChecklist {
  nome: string;
  ok: boolean;
  /** Observação livre (usada nos documentos editados pelo Simulador). */
  obs?: string;
}

/** Ficha detalhada do artista — alimentada pelo acervo (sub-abas do detalhe). */
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
  /** Etapa no pipeline: índice 0–7 em ETAPAS_PIPELINE. */
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

/** Documento na lixeira: o registro original (de qualquer coleção) mais as
    etiquetas de onde veio, quando e quem excluiu. 30 dias para restaurar. */
export interface ItemLixeira {
  id: string;
  /** Coleção de origem ("editais", "rascunhos", "regras"...). */
  _de: string;
  _apagadoEm: string;
  _apagadoPor: string;
  /** Agrupa o que caiu junto numa exclusão em cascata (o Desfazer restaura o lote). */
  _lote: string;
  [campo: string]: unknown;
}

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
