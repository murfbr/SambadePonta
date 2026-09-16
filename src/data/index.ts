/* Dados estáticos extraídos do artefato: definições dos formulários replicados,
   catálogos do Salic, plataformas e registro de formulários. São configuração do
   app (versionada por deploy), NÃO dados de usuário — por isso não vão ao Firestore. */
import formulariosJson from "./formularios.json";
import salicJson from "./salic-dados.json";
import plataformasJson from "./plataformas.json";
import type { Formulario, Plataforma, RegistroFormulario, SalicDados } from "../types";

/** Formulários replicados, por id ("dc-138", "salic-proposta"...). */
export const FORMULARIOS = formulariosJson as unknown as Record<string, Formulario>;

/** Catálogos da planilha orçamentária do Salic (itens, unidades, fontes...). */
export const SALIC_DADOS = salicJson as unknown as SalicDados;

/** Como cada plataforma funciona (arquitetura, armadilhas...). */
export const PLATAFORMAS = plataformasJson.plataformas as unknown as Plataforma[];

/** O que está mapeado e migrado para o Simulador. */
export const REGISTRO = plataformasJson.registro as unknown as RegistroFormulario[];

/** Perfis jurídicos possíveis do proponente. */
export const PERFIS_JURIDICOS = plataformasJson.perfisJuridicos as string[];

export const nomePlataforma = (id: string) =>
  PLATAFORMAS.find((p) => p.id === id)?.nome || id;

export const registroDe = (id: string): RegistroFormulario =>
  REGISTRO.find((r) => r.id === id) || ({ id, nome: id } as RegistroFormulario);
