/* Arrastar e soltar dos quadros (pipeline e tarefas): um hook com o estado do
   arrasto e props prontas para espalhar em cada cartão e coluna. Soltar numa
   coluna manda o cartão para o fim dela; soltar sobre outro cartão insere
   antes dele. Os botões ◀▶ das telas continuam como alternativa (telas de
   toque e teclado, onde o arrasto nativo não existe). */
import { useRef, useState } from "react";
import type { DragEvent } from "react";

interface PropsCartao {
  draggable: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}

interface PropsColuna {
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}

export interface Arrasto<Coluna> {
  /** id do cartão sendo arrastado (null = nenhum arrasto em curso). */
  arrastando: string | null;
  /** Coluna sob o cursor durante o arrasto. */
  alvo: Coluna | null;
  /** Cartão sob o cursor — o solto entraria antes dele. */
  antesDe: string | null;
  propsCartao: (id: string, coluna: Coluna) => PropsCartao;
  propsColuna: (coluna: Coluna) => PropsColuna;
}

/** `soltar` recebe (id arrastado, coluna onde caiu, id do cartão à frente ou undefined = fim). */
export function usarArrasto<Coluna>(
  soltar: (id: string, coluna: Coluna, antesDeId?: string) => void,
): Arrasto<Coluna> {
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<Coluna | null>(null);
  const [antesDe, setAntesDe] = useState<string | null>(null);
  // O id também vive num ref: alguns navegadores não deixam ler o dataTransfer no drop.
  const idRef = useRef<string | null>(null);

  function limpar() {
    idRef.current = null;
    setArrastando(null);
    setAlvo(null);
    setAntesDe(null);
  }

  function soltarEm(e: DragEvent, coluna: Coluna, antesDeId?: string) {
    e.preventDefault();
    e.stopPropagation();
    const id = idRef.current || e.dataTransfer.getData("text/plain");
    if (id && id !== antesDeId) soltar(id, coluna, antesDeId);
    limpar();
  }

  return {
    arrastando, alvo, antesDe,
    propsCartao: (id, coluna) => ({
      draggable: true,
      onDragStart: (e) => {
        e.dataTransfer.setData("text/plain", id);
        e.dataTransfer.effectAllowed = "move";
        idRef.current = id;
        setArrastando(id);
      },
      onDragEnd: limpar,
      onDragOver: (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        if (alvo !== coluna) setAlvo(coluna);
        if (antesDe !== id) setAntesDe(id);
      },
      onDrop: (e) => soltarEm(e, coluna, id),
    }),
    propsColuna: (coluna) => ({
      onDragOver: (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (alvo !== coluna) setAlvo(coluna);
        if (antesDe) setAntesDe(null);
      },
      onDrop: (e) => soltarEm(e, coluna),
    }),
  };
}
