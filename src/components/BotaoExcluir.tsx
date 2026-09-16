/* Botão de excluir com confirmação em dois cliques: o primeiro clique vira
   "Confirmar exclusão", o segundo executa. Sai do estado de confirmação se o
   componente remontar (ex.: fechar e reabrir o modal). */
import { useState } from "react";

export function BotaoExcluir({ aoConfirmar }: { aoConfirmar: () => void }) {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <button
      className="del"
      data-confirmar={confirmando || undefined}
      onClick={() => (confirmando ? aoConfirmar() : setConfirmando(true))}
    >
      {confirmando ? "Confirmar exclusão" : "Excluir"}
    </button>
  );
}
