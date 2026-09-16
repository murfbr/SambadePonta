/* Estado do editor de registros do Painel (o modal "Novo / Editar").
   Qualquer bloco chama `abrirNovo("tarefa", {origem: "cand:c2"})` ou
   `abrirEdicao("artista", "a1")`; o modal em si vive no App. */
import { useSyncExternalStore } from "react";
import type { ChaveEntidade } from "../forms/especificacoes";

export type { ChaveEntidade };

interface EstadoEdicao {
  aberto: null | {
    chave: ChaveEntidade;
    /** id do registro em edição; null = criando novo. */
    id: string | null;
    /** Valores iniciais ao criar (ex. origem pré-preenchida). */
    prefill?: Record<string, unknown>;
  };
}

let edicao: EstadoEdicao = { aberto: null };
const assinantes = new Set<() => void>();
const publicar = () => { edicao = { ...edicao }; assinantes.forEach((f) => f()); };

export function usarEdicao(): EstadoEdicao {
  return useSyncExternalStore(
    (cb) => { assinantes.add(cb); return () => assinantes.delete(cb); },
    () => edicao,
  );
}

export function abrirNovo(chave: ChaveEntidade, prefill?: Record<string, unknown>) {
  edicao.aberto = { chave, id: null, prefill };
  publicar();
}

export function abrirEdicao(chave: ChaveEntidade, id: string) {
  edicao.aberto = { chave, id };
  publicar();
}

export function fecharEdicao() {
  edicao.aberto = null;
  publicar();
}
