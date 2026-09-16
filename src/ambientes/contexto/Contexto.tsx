/* Contexto e Regras: o conhecimento de escrita do coletivo.
   Cinco telas: Geral (panorama + regras gerais), Fichas (conhecimento por
   artista/projeto/edital), Regras (tabela filtrável), Julgamentos (pareceres e
   lições) e Trocar com o Claude (bloco de texto de ida e volta).
   Os modais de regra e julgamento são compartilhados e vivem aqui. */
import { useState } from "react";
import { usarCentral } from "../../banco/dados";
import { usarNavegacao } from "../../estado/navegacao";
import { regrasDe, textoFonte } from "./contexto-util";
import { TelaFichas } from "./Fichas";
import { TelaRegras, ModalRegra, type PedidoModalRegra } from "./Regras";
import { TelaJulgamentos, ModalJulgamento } from "./Julgamentos";
import { TelaTrocar } from "./Trocar";
import { ROTULO_TIPO_REGRA, type Julgamento } from "../../tipos";

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
  else tela = <TelaGeral aoAbrirRegra={setModalRegra} />;

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

/* ══════════ tela Geral ══════════ */

function TelaGeral({ aoAbrirRegra }: { aoAbrirRegra: (p: PedidoModalRegra) => void }) {
  const { fichas, regras, julgamentos } = usarCentral();
  const gerais = regrasDe("geral");
  const listaRegras = Object.values(regras);
  const listaJulg = Object.values(julgamentos);
  const contagemFichas = (tipo: string) => Object.values(fichas).filter((f) => f.tipo === tipo).length;

  return (
    <>
      <div className="shead">
        <div>
          <h2>Contexto e regras</h2>
          <p className="sub">O que sabemos sobre cada artista, projeto e edital, e o que o texto pode ou não ter. Nada de cadastro: isso é do Painel, apontado pelo mesmo id.</p>
        </div>
      </div>

      <div className="hero">
        <div className="pan">
          <h3>O que mora aqui</h3>
          <p>Conhecimento de escrita e de julgamento: como falar de cada artista, projeto e edital; quais argumentos funcionam; o que o julgador pesa de verdade; o que o texto não pode ter; e o que os pareceres anteriores ensinaram.</p>
          <p>Regra sem fonte não entra. Cada lição de um julgamento pode virar regra, e a regra aponta o julgamento como fonte.</p>
        </div>
        <div className="pan">
          <h3>O que já está registrado</h3>
          <div className="contagem">
            <span><b>{contagemFichas("artista")}</b>fichas de artista</span>
            <span><b>{contagemFichas("projeto")}</b>de projeto</span>
            <span><b>{contagemFichas("edital")}</b>de edital</span>
            <span><b>{listaRegras.length}</b>regras</span>
            <span><b>{listaJulg.length}</b>julgamentos</span>
          </div>
          <p style={{ marginTop: 14, fontSize: 13.5, color: "var(--ink2)" }}>
            Regras <span className="duvida">a confirmar</span>: {listaRegras.filter((r) => r.status === "duvida").length}.
            São as de fonte incerta; a próxima leitura dos materiais deve fechar ou derrubar cada uma.
          </p>
        </div>
      </div>

      <div className="pan">
        <h3>Regras gerais, valem para todo texto</h3>
        <ul className="regras-geral">
          {gerais.map((r) => (
            <li key={r.id}>
              <span className={"tp " + r.tipoRegra}>{ROTULO_TIPO_REGRA[r.tipoRegra]}</span>
              <span>{r.texto}</span>
              <span className="fonte">{textoFonte(r.fonte)}</span>
            </li>
          ))}
          {!gerais.length && <li className="vazio">nenhuma ainda</li>}
        </ul>
        <button className="btn sm" style={{ marginTop: 10 }}
          onClick={() => aoAbrirRegra({ contexto: { tipo: "geral" } })}>+ regra geral</button>
      </div>
    </>
  );
}
