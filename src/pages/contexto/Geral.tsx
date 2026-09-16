/* Tela Geral do Contexto: o que mora aqui, contagens do que já está
   registrado e as regras gerais (valem para todo texto). */
import { usarCentral } from "../../store/central";
import { regrasDe, textoFonte } from "../../lib/contexto/consultas";
import { ROTULO_TIPO_REGRA } from "../../types";
import type { PedidoModalRegra } from "./ModalRegra";

export function Geral({ aoAbrirRegra }: { aoAbrirRegra: (p: PedidoModalRegra) => void }) {
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
