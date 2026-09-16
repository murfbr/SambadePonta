/* Barra de ferramentas: nota sobre o modo de salvamento + exportar/importar o
   pacote .json completo da Central. */
import { useRef, type ChangeEvent } from "react";
import { Banco } from "../../services/banco";
import { exportarTudo, importarPacote } from "../../store/importarExportar";
import { toast } from "../Toast";

export function BarraFerramentas() {
  const arquivoRef = useRef<HTMLInputElement>(null);

  function aoImportar(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    arquivo.text().then((texto) => {
      try {
        toast(importarPacote(JSON.parse(texto)));
      } catch (erro) {
        toast("Arquivo inválido: " + (erro as Error).message);
      }
    });
  }

  return (
    <div className="toolbar">
      <span className="note">
        {Banco.modo === "nuvem"
          ? "Tudo o que você edita aqui fica salvo no banco do coletivo e aparece para quem mais estiver no site. Exportar gera um .json com Painel, rascunhos e contexto."
          : "Sem Firebase configurado: tudo fica salvo só neste navegador. Configure o .env para sincronizar com o coletivo."}
      </span>
      <span className="sp">
        <button className="btn ghost sm" onClick={exportarTudo}>⤓ Exportar tudo</button>
        <button className="btn ghost sm" onClick={() => arquivoRef.current?.click()}>⤒ Importar</button>
        <input ref={arquivoRef} type="file" accept="application/json" style={{ display: "none" }} onChange={aoImportar} />
      </span>
    </div>
  );
}
