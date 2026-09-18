/* Estado central do site: as nove coleções do Painel, os rascunhos e os
   FORMULÁRIOS do Simulador e as três coleções do Contexto, sempre em dia com o
   banco (ou o localStorage). Os componentes leem tudo pelo hook `usarCentral()`;
   as mudanças passam pelas funções de ./mutacoes — nunca no Firestore direto.

   Semeadura: na primeira abertura com o banco vazio, entra o conteúdo de
   src/data/*.json (o estado real do artefato em setembro/2026) — carregado por
   import() dinâmico, para as sementes não pesarem no bundle de quem já tem banco. */
import { useSyncExternalStore } from "react";
import { Banco } from "../services/banco";
import { clonar } from "../utils";
import {
  COLECOES_PAINEL, type DadosPainel, type Ficha, type Formulario,
  type ItemLixeira, type Julgamento, type Rascunho, type Regra,
} from "../types";

/** Tudo o que o site mostra, num objeto só. */
export interface EstadoCentral {
  /** true quando dá para mostrar o site: as 13 coleções confirmadas pelo
      servidor (ou modo local), OU todas respondidas com dados de visita
      anterior (espelho/cache) enquanto a sincronização termina ao fundo. */
  pronto: boolean;
  painel: DadosPainel;
  rascunhos: Record<string, Rascunho>;
  /** Definições dos formulários do Simulador — vêm do banco (fora do `pronto`:
      o Painel abre sem elas; o Simulador espera se for preciso). */
  formularios: Record<string, Formulario>;
  /** Registros excluídos aguardando restauração (também fora do `pronto`). */
  lixeira: Record<string, ItemLixeira>;
  fichas: Record<string, Ficha>;
  regras: Record<string, Regra>;
  julgamentos: Record<string, Julgamento>;
}

let estado: EstadoCentral = {
  pronto: false,
  painel: { artistas: [], projetos: [], editais: [], candidaturas: [], tarefas: [], equipe: [], elenco: [], contatos: [], reunioes: [] },
  rascunhos: {}, formularios: {}, lixeira: {}, fichas: {}, regras: {}, julgamentos: {},
};

const assinantes = new Set<() => void>();
function publicar() {
  estado = { ...estado };
  assinantes.forEach((f) => f());
}

export const obterEstado = () => estado;

/** Hook: qualquer componente que use isso re-renderiza quando os dados mudam. */
export function usarCentral(): EstadoCentral {
  return useSyncExternalStore(
    (cb) => { assinantes.add(cb); return () => assinantes.delete(cb); },
    obterEstado,
  );
}

/* ══════════ inicialização e semeadura ══════════ */

const ordenado = <T,>(mapa: Record<string, unknown>): T[] =>
  (Object.values(mapa) as (T & { _ord?: number })[])
    .sort((a, b) => (a._ord || 0) - (b._ord || 0));

const confirmadas = new Set<string>(); // responderam com dado do servidor (ou modo local)
const respondidas = new Set<string>(); // responderam com qualquer coisa (espelho e cache contam)
let semeouPainel = false;
let semeouContexto = false;
let semeouFormularios = false;
let assinaturas: (() => void)[] = [];

const TOTAL_COLECOES = COLECOES_PAINEL.length + 4;

/** Há algo guardado de uma visita anterior (espelho local ou cache)? */
const temDadosGuardados = () =>
  COLECOES_PAINEL.some((c) => estado.painel[c].length > 0)
  || Object.keys(estado.rascunhos).length > 0
  || Object.keys(estado.fichas).length > 0
  || Object.keys(estado.regras).length > 0
  || Object.keys(estado.julgamentos).length > 0;

/** Liga as 13 coleções. Chamar depois do login (ou direto no modo local); é idempotente. */
export function iniciarDados() {
  if (assinaturas.length) return;

  for (const colecao of COLECOES_PAINEL) {
    assinaturas.push(Banco.assinar(colecao, (mapa, confirmado) => {
      estado.painel = { ...estado.painel, [colecao]: ordenado(mapa) } as DadosPainel;
      aoResponder(colecao, confirmado);
      publicar();
    }));
  }
  assinaturas.push(Banco.assinar("rascunhos", (mapa, confirmado) => {
    estado.rascunhos = mapa as unknown as Record<string, Rascunho>;
    aoResponder("rascunhos", confirmado);
    publicar();
  }));
  // Formulários do Simulador: fora da contagem do `pronto` (o Painel abre sem
  // eles) e fora do espelho localStorage no modo nuvem (ver banco.ts). Banco
  // confirmado vazio na primeira vez → semeia com as definições atuais.
  assinaturas.push(Banco.assinar("formularios", (mapa, confirmado) => {
    estado.formularios = mapa as unknown as Record<string, Formulario>;
    if (confirmado && !semeouFormularios && !Object.keys(mapa).length) {
      semeouFormularios = true;
      void import("../data/formularios.json").then(({ default: definicoes }) => {
        Object.entries(clonar(definicoes) as Record<string, Formulario>).forEach(([id, f]) =>
          Banco.gravar("formularios", id, { ...(f as unknown as Record<string, unknown>), id }, true));
      });
    }
    publicar();
  }));
  // Lixeira: excluídos com 30 dias para restaurar (fora do `pronto` e, no modo
  // nuvem, fora do espelho localStorage — como os formulários; ver banco.ts).
  assinaturas.push(Banco.assinar("lixeira", (mapa) => {
    estado.lixeira = mapa as unknown as Record<string, ItemLixeira>;
    publicar();
  }));
  for (const colecao of ["fichas", "regras", "julgamentos"] as const) {
    assinaturas.push(Banco.assinar(colecao, (mapa, confirmado) => {
      (estado as unknown as Record<string, unknown>)[colecao] = mapa;
      aoResponder(colecao, confirmado);
      publicar();
    }));
  }
}

/**
 * Desliga as 13 escutas. Chamado no logout ANTES do signOut: sem isso, o corte
 * de permissão mata cada listener com erro definitivo, e ao logar de novo nada
 * volta a escutar — era isso que deixava o site sem carregar os dados.
 */
export function pararDados() {
  assinaturas.forEach((desligar) => desligar());
  assinaturas = [];
  confirmadas.clear();
  respondidas.clear();
}

function aoResponder(colecao: string, confirmado: boolean) {
  respondidas.add(colecao);
  if (confirmado) confirmadas.add(colecao);

  // Pronto de verdade: as 13 confirmadas pelo servidor (ou modo local).
  // Pronto provisório: as 13 responderam e há dados de visita anterior — mostra
  // o site já e deixa a sincronização terminar em segundo plano (o indicador do
  // cabeçalho segue contando a história). Antes, qualquer engasgo do Firestore
  // prendia a tela em "carregando…" mesmo com tudo no espelho local.
  estado.pronto = estado.pronto
    || confirmadas.size >= TOTAL_COLECOES
    || (respondidas.size >= TOTAL_COLECOES && temDadosGuardados());

  if (!confirmado) return;

  // Painel vazio nas 9 coleções confirmadas → primeira abertura: semeia.
  // (import dinâmico: a semente só é baixada nesse momento, não no bundle.)
  if (!semeouPainel && COLECOES_PAINEL.every((c) => confirmadas.has(c))
    && COLECOES_PAINEL.every((c) => estado.painel[c].length === 0)) {
    semeouPainel = true;
    void import("../data/semente-painel.json").then(({ default: sementePainel }) => {
      const semente = clonar(sementePainel) as unknown as DadosPainel;
      for (const c of COLECOES_PAINEL) {
        (semente[c] || []).forEach((registro, i) => {
          registro._ord = i;
          registro.atualizado = new Date().toISOString();
          Banco.gravar(c, registro.id, registro as unknown as Record<string, unknown> & { id: string }, true);
        });
      }
    });
  }

  // Contexto vazio nas 3 coleções → semeia fichas, regras e julgamentos.
  if (!semeouContexto && ["fichas", "regras", "julgamentos"].every((c) => confirmadas.has(c))
    && !Object.keys(estado.fichas).length && !Object.keys(estado.regras).length) {
    semeouContexto = true;
    void import("../data/semente-contexto.json").then(({ default: sementeContexto }) => {
      const s = clonar(sementeContexto) as unknown as {
        fichas: Record<string, Ficha>; regras: Record<string, Regra>; julg: Record<string, Julgamento>;
      };
      Object.values(s.fichas || {}).forEach((d) => Banco.gravar("fichas", d.id, d as unknown as Record<string, unknown> & { id: string }, true));
      Object.values(s.regras || {}).forEach((d) => Banco.gravar("regras", d.id, d as unknown as Record<string, unknown> & { id: string }, true));
      Object.values(s.julg || {}).forEach((d) => Banco.gravar("julgamentos", d.id, d as unknown as Record<string, unknown> & { id: string }, true));
    });
  }
}
