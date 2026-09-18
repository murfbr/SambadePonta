/* Catálogos estáticos (Salic, plataformas, perfis) e os acessores dos
   formulários replicados. As DEFINIÇÕES de formulário vivem no banco (coleção
   `formularios`): formulário novo entra pelo "Importar formulário" da aba
   Plataformas, sem precisar de deploy. Aqui ficam os catálogos que mudam com o
   código e o registro combinado (estático ∪ banco). As sementes de src/data
   são carregadas por import() dinâmico só na primeira abertura com banco vazio. */
import salicJson from "./salic-dados.json";
import plataformasJson from "./plataformas.json";
import { obterEstado } from "../store/central";
import { comparar } from "../utils";
import type { Formulario, Plataforma, RegistroFormulario, SalicDados } from "../types";

/** Catálogos da planilha orçamentária do Salic (itens, unidades, fontes...). */
export const SALIC_DADOS = salicJson as unknown as SalicDados;

/** Como cada plataforma funciona (arquitetura, armadilhas...). */
export const PLATAFORMAS = plataformasJson.plataformas as unknown as Plataforma[];

/** Perfis jurídicos possíveis do proponente. */
export const PERFIS_JURIDICOS = plataformasJson.perfisJuridicos as string[];

/** Registro estático: o histórico do mapeamento, incluindo os não migrados. */
const REGISTRO_ESTATICO = plataformasJson.registro as unknown as RegistroFormulario[];

export const nomePlataforma = (id: string) =>
  PLATAFORMAS.find((p) => p.id === id)?.nome || id;

/** Definição de um formulário, vinda do banco (undefined enquanto não carrega). */
export const formularioDe = (id: string): Formulario | undefined =>
  obterEstado().formularios[id];

/** Linha do registro derivada de uma definição do banco (banco = migrado). */
function registroDoBanco(f: Formulario, estatico?: RegistroFormulario): RegistroFormulario {
  return {
    ...estatico,
    id: f.id, nome: f.nome, plataforma: f.plataforma,
    etapas: f.etapas.length,
    campos: f.etapas.reduce((n, e) => n + e.blocos.reduce((m, b) => m + b.campos.filter((c) => c.n).length, 0), 0),
    extraido: f.extraido || estatico?.extraido || "—",
    mapeamento: estatico?.mapeamento || "atual",
    migrado: true,
  };
}

/**
 * O registro completo de formulários: as linhas estáticas (com os ainda não
 * migrados e seus links antigos) + o que está no banco — que vence quando o id
 * coincide. Formulário importado que não existia entra no fim, por nome.
 */
export function registroCompleto(): RegistroFormulario[] {
  const doBanco = obterEstado().formularios;
  const vistos = new Set<string>();
  const saida = REGISTRO_ESTATICO.map((r) => {
    vistos.add(r.id);
    const f = doBanco[r.id];
    return f ? registroDoBanco(f, r) : r;
  });
  const novos = Object.values(doBanco)
    .filter((f) => !vistos.has(f.id))
    .sort((a, b) => comparar(a.nome, b.nome))
    .map((f) => registroDoBanco(f));
  return [...saida, ...novos];
}

export const registroDe = (id: string): RegistroFormulario =>
  registroCompleto().find((r) => r.id === id) || ({ id, nome: id } as RegistroFormulario);
