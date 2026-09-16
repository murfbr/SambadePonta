/* Cabeçalho de seção das telas do Painel: título, subtítulo e ações à direita. */
import type { ReactNode } from "react";

interface Props {
  titulo: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
}

export function CabecalhoSecao({ titulo, sub, children }: Props) {
  return (
    <div className="shead">
      <h2>{titulo}</h2>
      {sub && <span className="sub">{sub}</span>}
      <span className="act">{children}</span>
    </div>
  );
}
