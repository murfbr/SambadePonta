/* Simulador de Proposta: réplicas fiéis dos formulários das plataformas, para
   redigir com calma fora delas. Quatro telas: Mesa (rascunhos), Plataformas
   (conhecimento), Formulário (edição campo a campo) e Transferência (colar na
   plataforma oficial). A tela ativa vem da aba global (navegação). */
import { useEffect, useState } from "react";
import { usarCentral } from "../../banco/dados";
import { usarNavegacao } from "../../estado/navegacao";
import { normalizarRascunho } from "./motor";
import { Mesa } from "./Mesa";
import { Plataformas } from "./Plataformas";
import { FormularioRascunho } from "./Formulario";
import { Transferencia } from "./Transferencia";

/** Preferências de interface do Simulador que persistem entre visitas. */
interface UiSimulador {
  vista: "interno" | "etapa";
  /** Índice da etapa aberta. */
  ei: number;
}

const CHAVE_UI = "central-sim-ui-v1";
const carregarUi = (): UiSimulador => {
  try { return { vista: "interno", ei: 0, ...JSON.parse(localStorage.getItem(CHAVE_UI) || "{}") }; }
  catch { return { vista: "interno", ei: 0 }; }
};

export function Simulador() {
  const nav = usarNavegacao();
  const { rascunhos } = usarCentral();
  const [ui, setUi] = useState<UiSimulador>(carregarUi);

  useEffect(() => {
    try { localStorage.setItem(CHAVE_UI, JSON.stringify(ui)); } catch { /* sem localStorage */ }
  }, [ui]);

  const rascunho = nav.rascunhoAberto ? rascunhos[nav.rascunhoAberto] : undefined;

  let tela;
  if (nav.aba === "plataformas") tela = <Plataformas />;
  else if (nav.aba === "formulario" && rascunho) {
    tela = (
      <FormularioRascunho
        rascunho={normalizarRascunho({ ...rascunho })}
        vista={ui.vista}
        etapaAberta={ui.ei}
        aoMudarVista={(vista, ei) => setUi({ vista, ei: ei ?? ui.ei })}
      />
    );
  } else if (nav.aba === "transferencia" && rascunho) {
    tela = <Transferencia rascunho={normalizarRascunho({ ...rascunho })} />;
  } else {
    tela = <Mesa aoAbrir={() => setUi({ vista: "interno", ei: 0 })} />;
  }

  return <div id="sim">{tela}</div>;
}
