/* Estado central do site: as nove coleções do Painel, os rascunhos do Simulador
   e as três coleções do Contexto, sempre em dia com o banco (ou o localStorage).
   Os componentes leem tudo pelo hook `usarCentral()`; as mudanças passam pelas
   funções de ./mutacoes — nunca escrevendo no Firestore diretamente.

   Semeadura: na primeira abertura com o banco vazio, entra o conteúdo de
   src/data/semente-*.json (o estado real do artefato em setembro/2026). */
import { useSyncExternalStore } from "react";
import { Banco } from "../services/banco";
import { clonar } from "../utils";
import {
  COLECOES_PAINEL, type DadosPainel, type Ficha, type Julgamento, type Rascunho, type Regra,
} from "../types";
import sementePainel from "../data/semente-painel.json";
import sementeContexto from "../data/semente-contexto.json";

/** Tudo o que o site mostra, num objeto só. */
export interface EstadoCentral {
  /** true quando as 13 coleções já responderam (do servidor ou do modo local). */
  pronto: boolean;
  painel: DadosPainel;
  rascunhos: Record<string, Rascunho>;
  fichas: Record<string, Ficha>;
  regras: Record<string, Regra>;
  julgamentos: Record<string, Julgamento>;
}

let estado: EstadoCentral = {
  pronto: false,
  painel: { artistas: [], projetos: [], editais: [], candidaturas: [], tarefas: [], equipe: [], elenco: [], contatos: [], reunioes: [] },
  rascunhos: {}, fichas: {}, regras: {}, julgamentos: {},
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

const confirmadas = new Set<string>();
let semeouPainel = false;
let semeouContexto = false;
let iniciado = false;

/** Liga as 13 coleções. Chamar uma vez, depois do login (ou direto no modo local). */
export function iniciarDados() {
  if (iniciado) return;
  iniciado = true;

  for (const colecao of COLECOES_PAINEL) {
    Banco.assinar(colecao, (mapa, confirmado) => {
      estado.painel = { ...estado.painel, [colecao]: ordenado(mapa) } as DadosPainel;
      aoConfirmar(colecao, confirmado);
      publicar();
    });
  }
  Banco.assinar("rascunhos", (mapa, confirmado) => {
    estado.rascunhos = mapa as unknown as Record<string, Rascunho>;
    aoConfirmar("rascunhos", confirmado);
    publicar();
  });
  for (const colecao of ["fichas", "regras", "julgamentos"] as const) {
    Banco.assinar(colecao, (mapa, confirmado) => {
      (estado as unknown as Record<string, unknown>)[colecao] = mapa;
      aoConfirmar(colecao, confirmado);
      publicar();
    });
  }
}

function aoConfirmar(colecao: string, confirmado: boolean) {
  if (!confirmado) return;
  confirmadas.add(colecao);
  estado.pronto = confirmadas.size >= COLECOES_PAINEL.length + 4;

  // Painel vazio nas 9 coleções confirmadas → primeira abertura: semeia.
  if (!semeouPainel && COLECOES_PAINEL.every((c) => confirmadas.has(c))
    && COLECOES_PAINEL.every((c) => estado.painel[c].length === 0)) {
    semeouPainel = true;
    const semente = clonar(sementePainel) as unknown as DadosPainel;
    for (const c of COLECOES_PAINEL) {
      (semente[c] || []).forEach((registro, i) => {
        registro._ord = i;
        registro.atualizado = new Date().toISOString();
        Banco.gravar(c, registro.id, registro as unknown as Record<string, unknown> & { id: string }, true);
      });
    }
  }

  // Contexto vazio nas 3 coleções → semeia fichas, regras e julgamentos.
  if (!semeouContexto && ["fichas", "regras", "julgamentos"].every((c) => confirmadas.has(c))
    && !Object.keys(estado.fichas).length && !Object.keys(estado.regras).length) {
    semeouContexto = true;
    const s = clonar(sementeContexto) as unknown as {
      fichas: Record<string, Ficha>; regras: Record<string, Regra>; julg: Record<string, Julgamento>;
    };
    Object.values(s.fichas || {}).forEach((d) => Banco.gravar("fichas", d.id, d as unknown as Record<string, unknown> & { id: string }, true));
    Object.values(s.regras || {}).forEach((d) => Banco.gravar("regras", d.id, d as unknown as Record<string, unknown> & { id: string }, true));
    Object.values(s.julg || {}).forEach((d) => Banco.gravar("julgamentos", d.id, d as unknown as Record<string, unknown> & { id: string }, true));
  }
}
