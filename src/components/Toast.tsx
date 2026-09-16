/* Toast: avisos rápidos no rodapé ("Salvo", "Copiado"...).
   Qualquer código chama `toast("mensagem")`; o componente vive no App. */
import { useEffect, useState } from "react";

let mostrar: ((texto: string) => void) | null = null;

/** Mostra um aviso passageiro (2 s). Pode ser chamado de qualquer lugar. */
export function toast(texto: string) {
  mostrar?.(texto);
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
  const [ligado, setLigado] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    mostrar = (t) => {
      setTexto(t);
      setLigado(true);
      clearTimeout(timer);
      timer = setTimeout(() => setLigado(false), 2000);
    };
    return () => { mostrar = null; clearTimeout(timer); };
  }, []);

  return <div className={"toast" + (ligado ? " on" : "")} role="status" aria-live="polite">{texto}</div>;
}
