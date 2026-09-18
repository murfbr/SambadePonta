/* Versões do rascunho: as fotografias automáticas, com "ver" (o texto da
   versão) e "restaurar". Restaurar fotografa o estado atual antes de voltar —
   restaurar nunca destrói nada. */
import { useEffect, useState } from "react";
import { Modal, RodapeModal } from "../../../components/Modal";
import { toast } from "../../../components/Toast";
import { salvarRascunho } from "../../../store/mutacoes";
import { comoTexto } from "../../../lib/simulador/motor";
import { fotografar, listarVersoes, type VersaoRascunho } from "../../../lib/simulador/versoes";
import { clonar, relativo } from "../../../utils";
import type { Rascunho } from "../../../types";

export function ModalVersoes({ rascunho: r, aoFechar }: { rascunho: Rascunho; aoFechar: () => void }) {
  const [versoes, setVersoes] = useState<VersaoRascunho[] | null>(null);
  const [vendo, setVendo] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  useEffect(() => {
    listarVersoes(r.id).then(setVersoes).catch(() => setVersoes([]));
  }, [r.id]);

  async function restaurar(v: VersaoRascunho) {
    await fotografar(r); // o estado atual vira uma versão antes de voltar no tempo
    const alvo = clonar(v.rascunho);
    salvarRascunho({ ...alvo, id: r.id, criado: r.criado, arquivado: r.arquivado }, true);
    toast("Versão restaurada — o estado que estava na tela virou uma versão nova");
    aoFechar();
  }

  const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <Modal titulo="Versões do rascunho" aoFechar={aoFechar} largo>
      <p className="hint" style={{ marginTop: 0 }}>
        Fotografias automáticas: ao abrir o rascunho, no máximo uma a cada 4 horas
        (até 20 por rascunho — as mais antigas caem). <b>Restaurar</b> fotografa o
        estado atual antes de voltar, então nada se perde.
      </p>

      {versoes === null && <p className="hint">carregando versões…</p>}
      {versoes?.length === 0 && (
        <p className="hint">Nenhuma versão ainda — a primeira nasce na próxima abertura do rascunho com conteúdo.</p>
      )}

      {(versoes || []).map((v) => (
        <div key={v.id}>
          <div className="versao-linha">
            <b>{quando(v.criadoEm)}</b>
            <span className="muted">{relativo(v.criadoEm)}{v.autor ? " · " + v.autor : ""}</span>
            <span className="acoes">
              <button className="btn ghost sm" onClick={() => setVendo(vendo === v.id ? null : v.id)}>
                {vendo === v.id ? "fechar" : "ver"}
              </button>
              <button
                className="btn sm"
                onClick={() => (confirmando === v.id ? void restaurar(v) : setConfirmando(v.id))}
              >
                {confirmando === v.id ? "Confirmar restauração" : "Restaurar"}
              </button>
            </span>
          </div>
          {vendo === v.id && <pre className="versao-texto">{comoTexto(v.rascunho) || "(vazio)"}</pre>}
        </div>
      ))}

      <RodapeModal>
        <span className="sp"><button className="btn ghost" onClick={aoFechar}>Fechar</button></span>
      </RodapeModal>
    </Modal>
  );
}
