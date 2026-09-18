/* Toast: avisos rápidos no rodapé ("Salvo", "Copiado"...), com ação opcional
   ("Desfazer" da lixeira). Qualquer código chama `toast("msg")` ou
   `toast("msg", { acao })`; o componente vive no App. Com ação, dura 6 s. */
import { useEffect, useState } from "react";

export interface AcaoToast { rotulo: string; fazer: () => void }

let mostrar: ((texto: string, acao?: AcaoToast) => void) | null = null;

/** Mostra um aviso passageiro (2 s; 6 s quando tem ação). */
export function toast(texto: string, opcoes?: { acao?: AcaoToast }) {
  mostrar?.(texto, opcoes?.acao);
}

/** Copia texto e avisa; com mensagem de fallback se o navegador bloquear. */
export async function copiarComAviso(texto: string, mensagem = "Copiado") {
  try {
    await navigator.clipboard.writeText(texto);
    toast(mensagem);
  } catch {
    toast("Não consegui copiar. Selecione e use Ctrl+C");
  }
}

export function Toast() {
  const [texto, setTexto] = useState("");
  const [acao, setAcao] = useState<AcaoToast | null>(null);
  const [ligado, setLigado] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    mostrar = (t, a) => {
      setTexto(t);
      setAcao(a || null);
      setLigado(true);
      clearTimeout(timer);
      timer = setTimeout(() => setLigado(false), a ? 6000 : 2000);
    };
    return () => { mostrar = null; clearTimeout(timer); };
  }, []);

  return (
    <div className={"toast" + (ligado ? " on" : "")} role="status" aria-live="polite">
      {texto}
      {acao && ligado && (
        <button className="toast-acao" onClick={() => { setLigado(false); acao.fazer(); }}>
          {acao.rotulo}
        </button>
      )}
    </div>
  );
}
