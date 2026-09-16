/* Modal padrão do site: overlay que fecha no clique fora + caixa com título.
   Todos os modais (edição de registro, regra, julgamento, confirmação de
   import) usam este componente. */
import type { ReactNode } from "react";

interface Props {
  titulo: ReactNode;
  aoFechar: () => void;
  /** Largura maior (classe .wide do CSS). */
  largo?: boolean;
  children: ReactNode;
}

export function Modal({ titulo, aoFechar, largo, children }: Props) {
  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div className={"modal" + (largo ? " wide" : "")}>
        <h3>{titulo}</h3>
        {children}
      </div>
    </div>
  );
}

/** Rodapé padrão do modal: excluir à esquerda, cancelar/salvar à direita. */
export function RodapeModal({ children }: { children: ReactNode }) {
  return <div className="mfoot">{children}</div>;
}
