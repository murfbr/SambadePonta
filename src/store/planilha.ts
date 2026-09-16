/* Planilhas (CSV) por coleção do Painel: colunas com nomes em português,
   exportação que o Excel/Google abre direto e importação com mapeamento de
   colunas. Relações (projeto, edital, responsável...) saem e voltam pelo NOME
   do registro, não pelo id — para dar para montar a planilha à mão. */
import { obterEstado } from "./central";
import { limparInternos } from "./importarExportar";
import { porId, salvarRegistro } from "./mutacoes";
import { ENTIDADES } from "../forms/especificacoes";
import { gerarCsv } from "../lib/csv";
import { baixarArquivo, clonar, uid } from "../utils";
import {
  COLECOES_PAINEL, ETAPAS_PIPELINE, ROTULO_COLECAO, ROTULO_TAREFA,
  type ColecaoPainel, type DadosPainel,
} from "../types";

type Registro = Record<string, unknown> & { id: string };
type RegistroPainel = DadosPainel[ColecaoPainel][number];

/** Uma coluna da planilha: campo do registro + como converter texto ⇄ valor. */
export interface ColunaCsv {
  campo: string;
  rotulo: string;
  /** Lista de textos: junta com " | " ao exportar; separa por | (ou ,) ao importar. */
  lista?: boolean;
  /** Valor gravado → rótulo humano. A importação aceita os dois. */
  valores?: Record<string, string>;
  /** O valor gravado é número (ex. índice da etapa do pipeline). */
  numero?: boolean;
  /** Campo de id: exporta o nome do registro apontado e importa achando-o pelo nome. */
  ref?: ColecaoPainel;
  /** Data: a importação converte dd/mm/aaaa → aaaa-mm-dd. */
  data?: boolean;
}

const rotuloEtapas = Object.fromEntries(ETAPAS_PIPELINE.map((e, i) => [String(i), e]));

/** As colunas de cada coleção (a ordem é a da planilha exportada). */
export const COLUNAS_CSV: Record<ColecaoPainel, ColunaCsv[]> = {
  artistas: [
    { campo: "nome", rotulo: "Nome" },
    { campo: "tipo", rotulo: "Tipo" },
    { campo: "enq", rotulo: "Enquadramento" },
    { campo: "cnpj", rotulo: "CNPJ" },
    { campo: "mun", rotulo: "Sede" },
    { campo: "bio", rotulo: "Bio" },
    { campo: "tags", rotulo: "Tags", lista: true },
  ],
  projetos: [
    { campo: "nome", rotulo: "Nome" },
    { campo: "artistaId", rotulo: "Artista", ref: "artistas" },
    { campo: "tipo", rotulo: "Tipo" },
    { campo: "meta", rotulo: "Meta de captação" },
    { campo: "ano", rotulo: "Janela" },
  ],
  editais: [
    { campo: "nome", rotulo: "Nome" },
    { campo: "orgao", rotulo: "Órgão" },
    { campo: "esfera", rotulo: "Esfera", valores: { fed: "Federal", est: "Estadual", mun: "Municipal", priv: "Privado" } },
    { campo: "mec", rotulo: "Mecanismo" },
    { campo: "area", rotulo: "Área" },
    { campo: "eleg", rotulo: "Elegibilidade", lista: true },
    { campo: "teto", rotulo: "Teto" },
    { campo: "prazo", rotulo: "Prazo" },
    { campo: "prazoIso", rotulo: "Prazo (data)", data: true },
    { campo: "status", rotulo: "Status", valores: { open: "Aberto", prev: "Previsto", closed: "Encerrado" } },
    { campo: "objeto", rotulo: "Objeto" },
    { campo: "publico", rotulo: "Público" },
    { campo: "comoInscrever", rotulo: "Como se inscrever" },
    { campo: "contrapartidas", rotulo: "Contrapartidas" },
    { campo: "docsExig", rotulo: "Documentos exigidos", lista: true },
    { campo: "linkEdital", rotulo: "Link do edital" },
    { campo: "linkDrive", rotulo: "Pasta no Drive" },
    { campo: "obs", rotulo: "Observações" },
  ],
  candidaturas: [
    { campo: "projetoId", rotulo: "Projeto", ref: "projetos" },
    { campo: "editalId", rotulo: "Edital", ref: "editais" },
    { campo: "respId", rotulo: "Responsável", ref: "equipe" },
    { campo: "valor", rotulo: "Valor pleiteado" },
    { campo: "etapa", rotulo: "Etapa", numero: true, valores: rotuloEtapas },
    { campo: "result", rotulo: "Resultado", valores: { ok: "aprovado", no: "reprovado" } },
    { campo: "linkDrive", rotulo: "Pasta no Drive" },
  ],
  tarefas: [
    { campo: "titulo", rotulo: "Título" },
    { campo: "respId", rotulo: "Responsável", ref: "equipe" },
    { campo: "prazo", rotulo: "Prazo", data: true },
    { campo: "status", rotulo: "Status", valores: ROTULO_TAREFA },
    { campo: "obs", rotulo: "Observações" },
  ],
  equipe: [
    { campo: "nome", rotulo: "Nome" },
    { campo: "nomeCompleto", rotulo: "Nome completo" },
    { campo: "email", rotulo: "E-mail" },
    { campo: "rg", rotulo: "RG" },
    { campo: "cpf", rotulo: "CPF" },
    { campo: "nascimento", rotulo: "Nascimento", data: true },
    { campo: "funcoes", rotulo: "Funções", lista: true },
  ],
  elenco: [
    { campo: "nome", rotulo: "Nome" },
    { campo: "nomeCompleto", rotulo: "Nome completo" },
    { campo: "funcao", rotulo: "Função" },
    { campo: "email", rotulo: "E-mail" },
    { campo: "rg", rotulo: "RG" },
    { campo: "cpf", rotulo: "CPF" },
    { campo: "nascimento", rotulo: "Nascimento", data: true },
    { campo: "bio", rotulo: "Minibiografia" },
    { campo: "docsStatus", rotulo: "Documentos", valores: { ok: "ok", pend: "pendente" } },
  ],
  contatos: [
    { campo: "nome", rotulo: "Nome" },
    { campo: "tipo", rotulo: "Tipo" },
    { campo: "ref", rotulo: "Referência" },
    { campo: "contato", rotulo: "Contato" },
  ],
  reunioes: [
    { campo: "titulo", rotulo: "Título" },
    { campo: "data", rotulo: "Data", data: true },
    { campo: "hora", rotulo: "Hora" },
    { campo: "recorrencia", rotulo: "Recorrência" },
    { campo: "local", rotulo: "Local" },
    { campo: "pauta", rotulo: "Pauta", lista: true },
    { campo: "ata", rotulo: "Ata" },
    { campo: "status", rotulo: "Status", valores: { agendada: "agendada", realizada: "realizada" } },
  ],
};

const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const hoje = () => new Date().toISOString().slice(0, 10);

/** "13/10/2026" → "2026-10-13"; datas ISO e o resto passam como vieram. */
function paraDataIso(t: string): string {
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0") : t;
}

/* ══════════ exportação ══════════ */

function celulaExportada(r: Registro, c: ColunaCsv): string {
  const v = r[c.campo];
  if (c.ref) {
    const alvo = v ? (porId(c.ref, String(v)) as { nome?: string } | undefined) : undefined;
    return alvo?.nome || "";
  }
  if (c.lista) return Array.isArray(v) ? (v as string[]).join(" | ") : "";
  if (c.valores && v != null && v !== "") return c.valores[String(v)] ?? String(v);
  return v == null ? "" : String(v);
}

/** Baixa uma coleção como planilha .csv (abre direto no Excel/Google Planilhas). */
export function exportarColecaoCsv(colecao: ColecaoPainel) {
  const colunas = COLUNAS_CSV[colecao];
  const registros = obterEstado().painel[colecao] as unknown as Registro[];
  const linhas = [
    ["id", ...colunas.map((c) => c.rotulo)],
    ...registros.map((r) => [r.id, ...colunas.map((c) => celulaExportada(r, c))]),
  ];
  baixarArquivo(colecao + "-" + hoje() + ".csv", gerarCsv(linhas), "text/csv");
}

/** Baixa uma coleção como .json completo (volta pelo Importar, mesclando ou substituindo). */
export function exportarColecaoJson(colecao: ColecaoPainel) {
  const registros = clonar(obterEstado().painel[colecao]) as unknown as Registro[];
  registros.forEach(limparInternos);
  const pacote = {
    central: "coletivo", versao: 2, exportado: new Date().toISOString(),
    painel: { [colecao]: registros },
  };
  baixarArquivo(colecao + "-" + hoje() + ".json", JSON.stringify(pacote, null, 1));
}

/* ══════════ importação ══════════ */

/** Para onde vai cada coluna do arquivo: uma coluna conhecida, o id, ou nada. */
export type AlvoColuna = ColunaCsv | "id" | null;

/** Palpite da coleção a partir do cabeçalho (quantas colunas casam pelo nome). */
export function detectarColecao(cabecalho: string[]): ColecaoPainel {
  const nomes = cabecalho.map(normalizar);
  let melhor: ColecaoPainel = COLECOES_PAINEL[0], max = -1;
  for (const c of COLECOES_PAINEL) {
    const n = COLUNAS_CSV[c].filter((col) =>
      nomes.includes(normalizar(col.rotulo)) || nomes.includes(normalizar(col.campo))).length;
    if (n > max) { max = n; melhor = c; }
  }
  return melhor;
}

/** Mapeamento automático: casa cada coluna do arquivo pelo rótulo ou nome do campo. */
export function mapeamentoInicial(colecao: ColecaoPainel, cabecalho: string[]): AlvoColuna[] {
  return cabecalho.map((h) => {
    const t = normalizar(h);
    if (t === "id") return "id";
    return COLUNAS_CSV[colecao].find((c) => normalizar(c.rotulo) === t || normalizar(c.campo) === t) || null;
  });
}

export interface ResultadoCsv { criados: number; atualizados: number; avisos: string[] }

function valorImportado(texto: string, c: ColunaCsv, avisos: string[], numLinha: number): unknown {
  const t = texto.trim();
  if (c.lista) return t.split(t.includes("|") ? "|" : ",").map((x) => x.trim()).filter(Boolean);
  if (c.ref) {
    const alvo = (obterEstado().painel[c.ref] as unknown as { id: string; nome?: string }[])
      .find((r) => normalizar(String(r.nome || "")) === normalizar(t));
    if (!alvo) avisos.push(`linha ${numLinha}: "${t}" não encontrado em ${ROTULO_COLECAO[c.ref]}`);
    return alvo ? alvo.id : "";
  }
  if (c.valores) {
    const chave = Object.keys(c.valores).find((k) => k === t || normalizar(c.valores![k]) === normalizar(t));
    const bruto = chave ?? t;
    return c.numero ? (isNaN(Number(bruto)) ? 0 : Number(bruto)) : bruto;
  }
  if (c.data) return paraDataIso(t);
  return t;
}

/**
 * Importa as linhas de uma planilha na coleção, seguindo o mapeamento.
 * Mesclar: atualiza pelo id da planilha ou por nome/título igual; o resto entra
 * como novo. Adicionar: tudo entra como registro novo. Células vazias não
 * apagam o valor que já existe no registro.
 */
export function importarCsv(
  colecao: ColecaoPainel, mapeamento: AlvoColuna[], linhas: string[][],
  modo: "mesclar" | "adicionar",
): ResultadoCsv {
  const avisos: string[] = [];
  const spec = Object.values(ENTIDADES).find((s) => s.colecao === colecao);
  const chaveNome = colecao === "tarefas" || colecao === "reunioes" ? "titulo" : "nome";
  let criados = 0, atualizados = 0;

  linhas.forEach((celulas, i) => {
    const numLinha = i + 2; // 1 é o cabeçalho
    let id = "";
    const valores: Record<string, unknown> = {};
    mapeamento.forEach((alvo, j) => {
      const texto = celulas[j] ?? "";
      if (!alvo || !texto.trim()) return;
      if (alvo === "id") { id = texto.trim(); return; }
      valores[alvo.campo] = valorImportado(texto, alvo, avisos, numLinha);
    });
    if (!id && !Object.keys(valores).length) return;

    const existentes = obterEstado().painel[colecao] as unknown as Registro[];
    let base: Registro | undefined;
    if (modo === "mesclar") {
      base = (id && existentes.find((r) => r.id === id))
        || (colecao === "candidaturas"
          ? (valores.projetoId && valores.editalId
            ? existentes.find((r) => r.projetoId === valores.projetoId && r.editalId === valores.editalId)
            : undefined)
          : (valores[chaveNome]
            ? existentes.find((r) => normalizar(String(r[chaveNome] || "")) === normalizar(String(valores[chaveNome])))
            : undefined))
        || undefined;
    }

    const registro: Registro = base
      ? { ...clonar(base), ...valores }
      : {
        ...(spec?.padrao ? clonar(spec.padrao) : {}),
        ...valores,
        id: (modo === "mesclar" && id) || uid(spec?.prefixoId || colecao[0]),
      };
    spec?.depois?.(registro);
    salvarRegistro(colecao, registro as unknown as RegistroPainel, true);
    if (base) atualizados++; else criados++;
  });

  return { criados, atualizados, avisos };
}
