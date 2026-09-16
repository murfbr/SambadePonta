/* Contexto e Regras: o conhecimento de escrita do coletivo.
   Cinco telas: Geral, Fichas, Regras, Julgamentos e Trocar com o Claude.
   Os modais de regra e julgamento são compartilhados entre as telas e vivem aqui. */
import { useState } from "react";
import { usarNavegacao } from "../../store/navegacao";
import { Geral } from "./Geral";
import { TelaFichas } from "./Fichas";
import { TelaRegras } from "./Regras";
import { ModalRegra, type PedidoModalRegra } from "./ModalRegra";
import { TelaJulgamentos } from "./Julgamentos";
import { ModalJulgamento } from "./ModalJulgamento";
import { TelaTrocar } from "./Trocar";
import type { Julgamento } from "../../types";

export function Contexto() {
  const nav = usarNavegacao();
  // null = fechado; o pedido carrega a regra inicial e o contexto (lição → regra).
  const [modalRegra, setModalRegra] = useState<PedidoModalRegra | null>(null);
  const [modalJulgamento, setModalJulgamento] = useState<Julgamento | "novo" | null>(null);

  let tela;
  if (nav.aba === "fichas") tela = <TelaFichas aoAbrirRegra={setModalRegra} />;
  else if (nav.aba === "regras") tela = <TelaRegras aoAbrirRegra={setModalRegra} />;
  else if (nav.aba === "julgamentos") {
    tela = <TelaJulgamentos aoAbrirRegra={setModalRegra} aoAbrirJulgamento={setModalJulgamento} />;
  } else if (nav.aba === "trocar") tela = <TelaTrocar />;
  else tela = <Geral aoAbrirRegra={setModalRegra} />;

  return (
    <div id="ctx">
      {tela}
      {modalRegra && <ModalRegra pedido={modalRegra} aoFechar={() => setModalRegra(null)} />}
      {modalJulgamento && (
        <ModalJulgamento
          inicial={modalJulgamento === "novo" ? null : modalJulgamento}
          aoFechar={() => setModalJulgamento(null)}
        />
      )}
    </div>
  );
}
