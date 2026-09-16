/* Quadro de tarefas: colunas por pessoa (padrão) ou por status, com os
   botões ◀▶ girando o status direto no cartão. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { girarStatusTarefa, porId } from "../../store/mutacoes";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { badgeTarefa, nomeEquipe, rotuloOrigem } from "../../lib/nomes";
import { ROTULO_TAREFA, STATUS_TAREFA, type Tarefa } from "../../types";
import { formatarData } from "../../utils";

function CartaoTarefa({ t, mostrarStatus }: { t: Tarefa; mostrarStatus: boolean }) {
  const b = badgeTarefa(t);
  return (
    <div className="kcard" onClick={() => abrirEdicao("tarefa", t.id)}>
      <p className="edt" style={{ fontWeight: 600 }}>{t.titulo}</p>
      <p className="prj">{rotuloOrigem(t.origem)}</p>
      {t.obs && <p className="prj" style={{ color: "var(--faint)", fontStyle: "italic" }}>{t.obs}</p>}
      <div className="meta">
        {mostrarStatus
          ? <span className={"badge " + b.classe} style={{ fontSize: 10 }}>{b.rotulo}</span>
          : <span className="dot">{nomeEquipe(t.respId)[0] || "?"}</span>}
        {t.prazo && <span className="prazo">⏱ {formatarData(t.prazo)}</span>}
        <span className="navb">
          <button title="voltar status" onClick={(e) => { e.stopPropagation(); girarStatusTarefa(t, -1); }}>◀</button>
          <button title="avançar status" onClick={(e) => { e.stopPropagation(); girarStatusTarefa(t, 1); }}>▶</button>
        </span>
      </div>
    </div>
  );
}

const ColunaVazia = () => <div style={{ fontSize: 11.5, color: "var(--faint)", padding: 6 }}>—</div>;

export function QuadroTarefas() {
  const { painel } = usarCentral();
  const [visao, setVisao] = useState<"pessoa" | "status">("pessoa");

  let quadro;
  if (visao === "status") {
    quadro = (
      <div className="kanban">
        {STATUS_TAREFA.map((k) => {
          const ts = painel.tarefas.filter((t) => t.status === k);
          return (
            <div className="col" style={{ flexBasis: 300 }} key={k}>
              <div className="col-h">{ROTULO_TAREFA[k]}<span className="cnt">{ts.length}</span></div>
              {ts.map((t) => <CartaoTarefa t={t} mostrarStatus={false} key={t.id} />)}
              {!ts.length && <ColunaVazia />}
            </div>
          );
        })}
      </div>
    );
  } else {
    const comTarefa = painel.equipe.filter((e) => painel.tarefas.some((t) => t.respId === e.id));
    const semResponsavel = painel.tarefas.filter((t) => !t.respId || !porId("equipe", t.respId));
    quadro = (
      <div className="kanban">
        {comTarefa.map((pessoa) => {
          const ts = painel.tarefas.filter((t) => t.respId === pessoa.id);
          const abertas = ts.filter((t) => t.status !== "feito").length;
          return (
            <div className="col" style={{ flexBasis: 280 }} key={pessoa.id}>
              <div className="col-h">
                <span className="dot" style={{ marginRight: 6 }}>{pessoa.nome[0]}</span>
                {pessoa.nome}<span className="cnt">{abertas}/{ts.length}</span>
              </div>
              {ts.map((t) => <CartaoTarefa t={t} mostrarStatus={true} key={t.id} />)}
              {!ts.length && <ColunaVazia />}
            </div>
          );
        })}
        {semResponsavel.length > 0 && (
          <div className="col" style={{ flexBasis: 280 }}>
            <div className="col-h">Sem responsável<span className="cnt">{semResponsavel.length}</span></div>
            {semResponsavel.map((t) => <CartaoTarefa t={t} mostrarStatus={true} key={t.id} />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <CabecalhoSecao titulo="Tarefas" sub="designadas à equipe; nascem em projetos, candidaturas e reuniões">
        <button className="btn ghost sm" onClick={() => setVisao(visao === "pessoa" ? "status" : "pessoa")}>
          Ver por: <b>{visao}</b> ⇄
        </button>
        <button className="btn" onClick={() => abrirNovo("tarefa")}>+ Tarefa</button>
      </CabecalhoSecao>
      {quadro}
    </>
  );
}
