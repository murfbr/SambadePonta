/* Contrato compartilhado dos componentes do editor de rascunho. */
import type { CampoAchatado } from "../../../lib/simulador/motor";
import type { Rascunho } from "../../../types";

/** Aplica uma mudança no rascunho e salva (gravação com debounce). */
export type Alterar = (fn: (r: Rascunho) => void, rapido?: boolean) => void;

/** Props padrão de todo componente de campo da plataforma. */
export interface PropsCampo {
  r: Rascunho;
  c: CampoAchatado;
  alterar: Alterar;
}
