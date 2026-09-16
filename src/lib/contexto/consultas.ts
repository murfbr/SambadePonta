/* Consultas do Contexto: quem são as entidades "ficháveis" (vêm do Painel,
   pelo mesmo id), ficha completa com padrões, filtros de regras e julgamentos. */
import { obterEstado } from "../../store/central";
import {
  ROTULO_FONTE, type Ficha, type Julgamento, type Regra, type TipoFicha,
} from "../../types";

export const TIPOS_FICHA: Record<TipoFicha, string> = {
  artista: "Artistas e coletivos", projeto: "Projetos", edital: "Editais e leis",
};

/** Entidade "fichável": artista, projeto ou edital do Painel. */
export interface EntidadeContexto {
  id: string;
  tipo: TipoFicha;
  nome: string;
  /** Para projetos: o id do artista (para ligar julgamentos ao artista). */
  artista?: string;
}

/** Entidades de um tipo, direto do Painel. */
export function entidades(tipo: TipoFicha): EntidadeContexto[] {
  const { painel } = obterEstado();
  if (tipo === "artista") return painel.artistas.map((a) => ({ id: a.id, tipo, nome: a.nome }));
  if (tipo === "projeto") return painel.projetos.map((p) => ({ id: p.id, tipo, nome: p.nome, artista: p.artistaId }));
  return painel.editais.map((e) => ({ id: e.id, tipo, nome: e.nome }));
}

/** Procura uma entidade em qualquer um dos três tipos. */
export function entidadePorId(id: string): EntidadeContexto | null {
  for (const t of ["artista", "projeto", "edital"] as TipoFicha[]) {
    const achada = entidades(t).find((x) => x.id === id);
    if (achada) return achada;
  }
  return null;
}

export const nomeDaEntidade = (id: string): string => entidadePorId(id)?.nome || id;

/** Ficha completa de um id, com padrões preenchidos (mesmo sem doc no banco). */
export function fichaDe(id: string): Ficha & { nome: string; artista?: string } {
  const entidade = entidadePorId(id);
  const doBanco = obterEstado().fichas[id] || ({} as Partial<Ficha>);
  const padrao: Ficha = {
    id, tipo: entidade?.tipo || "artista",
    posicionamento: "", argumentos: [], julgador: [], vocabulario: [], usados: [], cuidados: "",
  };
  return Object.assign(padrao, doBanco, { nome: entidade?.nome || id, artista: entidade?.artista });
}

export const temFicha = (id: string): boolean => Boolean(obterEstado().fichas[id]);

/** Regras de um escopo (geral, ou de uma entidade específica). */
export function regrasDe(tipo: string, id?: string): Regra[] {
  return Object.values(obterEstado().regras)
    .filter((r) => r.escopo.tipo === tipo && (tipo === "geral" || r.escopo.id === id));
}

/** Julgamentos, do mais recente para o mais antigo. */
export const julgamentosOrdenados = (): Julgamento[] =>
  Object.values(obterEstado().julgamentos).sort((a, b) => String(b.ano).localeCompare(String(a.ano)));

/** Texto da fonte de uma regra ("fonte: edital, item 5.2"). */
export function textoFonte(fonte: Regra["fonte"]): string {
  const f = fonte || { tipo: "experiencia", ref: "" };
  if (f.tipo === "julgamento") {
    const j = obterEstado().julgamentos[f.ref];
    return "fonte: julgamento " + (j ? nomeDaEntidade(j.edital) + " " + j.ano : f.ref);
  }
  return "fonte: " + (ROTULO_FONTE[f.tipo] || f.tipo) + (f.ref ? ", " + f.ref : "");
}
