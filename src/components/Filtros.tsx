/* Controles de organização das listas do Painel: a barra de busca/filtros com
   a contagem "x de y", e o cabeçalho de tabela clicável que ordena a coluna.
   Cada página compõe os seus controles dentro de <BarraFiltros>. */
import type { ReactNode } from "react";
import { comparar } from "../utils";

export function BarraFiltros({ mostrando, total, children }: {
  mostrando: number; total: number; children?: ReactNode;
}) {
  return (
    <div className="filtros">
      {children}
      <span className="n">{mostrando === total ? total + " registro(s)" : mostrando + " de " + total}</span>
    </div>
  );
}

export function CampoBusca({ valor, aoMudar, placeholder = "buscar…" }: {
  valor: string; aoMudar: (v: string) => void; placeholder?: string;
}) {
  return <input type="search" value={valor} placeholder={placeholder} onChange={(e) => aoMudar(e.target.value)} />;
}

interface Opcao { valor: string; rotulo: string }

/** Select de filtro ou de ordenação. Com `rotuloTodos`, ganha a opção vazia "todos". */
export function SeletorFiltro({ valor, aoMudar, rotuloTodos, opcoes }: {
  valor: string; aoMudar: (v: string) => void; rotuloTodos?: string; opcoes: (Opcao | string)[];
}) {
  return (
    <select value={valor} onChange={(e) => aoMudar(e.target.value)}>
      {rotuloTodos != null && <option value="">{rotuloTodos}</option>}
      {opcoes.map((o) => typeof o === "string"
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
    </select>
  );
}

/** Estado de ordenação de uma tabela: coluna ativa ("" = ordem do quadro) e direção. */
export interface OrdemTabela { campo: string; desc: boolean }

/** Ordena registros pela coluna ativa (comparação pt-BR); sem coluna, volta como veio. */
export function ordenarLinhas<T>(linhas: T[], ordem: OrdemTabela): T[] {
  if (!ordem.campo) return linhas;
  const texto = (r: T) => String((r as Record<string, unknown>)[ordem.campo] ?? "");
  return [...linhas].sort((a, b) => comparar(texto(a), texto(b)) * (ordem.desc ? -1 : 1));
}

/**
 * Cabeçalho clicável: 1º clique ordena ↑, 2º inverte ↓, 3º volta à ordem do
 * quadro. A página aplica a ordenação com `ordenarLinhas`.
 */
export function ThOrdenavel({ campo, ordem, aoOrdenar, children }: {
  campo: string; ordem: OrdemTabela; aoOrdenar: (o: OrdemTabela) => void; children: ReactNode;
}) {
  const ativo = ordem.campo === campo;
  const proxima = (): OrdemTabela =>
    !ativo ? { campo, desc: false }
      : !ordem.desc ? { campo, desc: true }
        : { campo: "", desc: false };
  return (
    <th className={"th-ord" + (ativo ? " on" : "")} title="clique para ordenar por esta coluna"
      onClick={() => aoOrdenar(proxima())}>
      {children} <span className="seta">{ativo ? (ordem.desc ? "↓" : "↑") : "↕"}</span>
    </th>
  );
}
