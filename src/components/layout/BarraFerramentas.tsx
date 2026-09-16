/* Barra de ferramentas: nota sobre o modo de salvamento + os modais de
   exportar (pacote completo ou planilhas por coleção) e importar (pacote .json
   ou planilha .csv, com prévia antes de gravar). */
import { useState } from "react";
import { Banco } from "../../services/banco";
import { ModalExportar } from "../ferramentas/ModalExportar";
import { ModalImportar } from "../ferramentas/ModalImportar";

export function BarraFerramentas() {
  const [modal, setModal] = useState<"" | "exportar" | "importar">("");

  return (
    <div className="toolbar">
      <span className="note">
        {Banco.modo === "nuvem"
          ? "Tudo o que você edita aqui fica salvo no banco do coletivo e aparece para quem mais estiver no site. Exportar baixa backup completo ou planilhas; Importar aceita .json e .csv."
          : "Sem Firebase configurado: tudo fica salvo só neste navegador. Configure o .env para sincronizar com o coletivo."}
      </span>
      <span className="sp">
        <button className="btn ghost sm" onClick={() => setModal("exportar")}>⤓ Exportar</button>
        <button className="btn ghost sm" onClick={() => setModal("importar")}>⤒ Importar</button>
      </span>
      {modal === "exportar" && <ModalExportar aoFechar={() => setModal("")} />}
      {modal === "importar" && <ModalImportar aoFechar={() => setModal("")} />}
    </div>
  );
}
