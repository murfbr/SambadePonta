/* Quadro de tarefas: colunas por pessoa (padrão) ou por status. Arraste o
   cartão para mudar de coluna (status ou responsável, conforme a visão) ou
   reordenar; ◀▶ segue girando o status direto no cartão. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { girarStatusTarefa, porId, soltarTarefaEmPessoa, soltarTarefaEmStatus } from "../../store/mutacoes";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { BarraFiltros, CampoBusca, SeletorFiltro } from "../../components/Filtros";
import { usarArrasto, type Arrasto } from "../../lib/arrastar";
import { badgeTarefa, nomeEquipe, rotuloOrigem } from "../../lib/nomes";
import { ROTULO_TAREFA, STATUS_TAREFA, type StatusTarefa, type Tarefa } from "../../types";
import { formatarData } from "../../utils";

function CartaoTarefa({ t, mostrarStatus, arrasto, coluna }: {
  t: Tarefa; mostrarStatus: boolean; arrasto: Arrasto<string>; coluna: string;
}) {
  const b = badgeTarefa(t);
  return (
    <div
      className={"kcard"
        + (arrasto.arrastando === t.id ? " arrastando" : "")
        + (arrasto.antesDe === t.id && arrasto.arrastando !== t.id ? " antes-daqui" : "")}
      onClick={() => abrirEdicao("tarefa", t.id)}
      {...arrasto.propsCartao(t.id, coluna)}>
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

const ColunaVazia = ({ arrastando }: { arrastando: boolean }) =>
  <div className="col-vazia">{arrastando ? "solte aqui" : "—"}</div>;

export function QuadroTarefas() {
  const { painel } = usarCentral();
  const [visao, setVisao] = useState<"pessoa" | "status">("pessoa");
  const [busca, setBusca] = useState("");
  const [filtroResp, setFiltroResp] = useState("");
  const [esconderFeitas, setEsconderFeitas] = useState(false);

  // Na visão por status a coluna é o status; na por pessoa, o id ("" = sem responsável).
  const arrasto = usarArrasto<string>((id, coluna, antesDe) => {
    if (visao === "status") soltarTarefaEmStatus(id, coluna as StatusTarefa, antesDe);
    else soltarTarefaEmPessoa(id, coluna, antesDe);
  });

  const visiveis = painel.tarefas.filter((t) =>
    (!filtroResp || t.respId === filtroResp) &&
    (!esconderFeitas || t.status !== "feito") &&
    (!busca || (t.titulo + " " + t.obs + " " + rotuloOrigem(t.origem)).toLowerCase().includes(busca.toLowerCase())));

  let quadro;
  if (visao === "status") {
    quadro = (
      <div className="kanban">
        {STATUS_TAREFA.map((k) => {
          const ts = visiveis.filter((t) => t.status === k);
          return (
            <div className={"col" + (arrasto.alvo === k ? " col-alvo" : "")} style={{ flexBasis: 300 }} key={k}
              {...arrasto.propsColuna(k)}>
              <div className="col-h">{ROTULO_TAREFA[k]}<span className="cnt">{ts.length}</span></div>
              {ts.map((t) => <CartaoTarefa t={t} mostrarStatus={false} arrasto={arrasto} coluna={k} key={t.id} />)}
              {!ts.length && <ColunaVazia arrastando={!!arrasto.arrastando} />}
            </div>
          );
        })}
      </div>
    );
  } else {
    const comTarefa = painel.equipe.filter((e) => visiveis.some((t) => t.respId === e.id));
    const semResponsavel = visiveis.filter((t) => !t.respId || !porId("equipe", t.respId));
    quadro = (
      <div className="kanban">
        {comTarefa.map((pessoa) => {
          const ts = visiveis.filter((t) => t.respId === pessoa.id);
          const abertas = ts.filter((t) => t.status !== "feito").length;
          return (
            <div className={"col" + (arrasto.alvo === pessoa.id ? " col-alvo" : "")} style={{ flexBasis: 280 }} key={pessoa.id}
              {...arrasto.propsColuna(pessoa.id)}>
              <div className="col-h">
                <span className="dot" style={{ marginRight: 6 }}>{pessoa.nome[0]}</span>
                {pessoa.nome}<span className="cnt">{abertas}/{ts.length}</span>
              </div>
              {ts.map((t) => <CartaoTarefa t={t} mostrarStatus={true} arrasto={arrasto} coluna={pessoa.id} key={t.id} />)}
              {!ts.length && <ColunaVazia arrastando={!!arrasto.arrastando} />}
            </div>
          );
        })}
        {(semResponsavel.length > 0 || arrasto.arrastando) && (
          <div className={"col" + (arrasto.alvo === "" ? " col-alvo" : "")} style={{ flexBasis: 280 }}
            {...arrasto.propsColuna("")}>
            <div className="col-h">Sem responsável<span className="cnt">{semResponsavel.length}</span></div>
            {semResponsavel.map((t) => <CartaoTarefa t={t} mostrarStatus={true} arrasto={arrasto} coluna="" key={t.id} />)}
            {!semResponsavel.length && <ColunaVazia arrastando={!!arrasto.arrastando} />}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <CabecalhoSecao titulo="Tarefas" sub="designadas à equipe; nascem em projetos, candidaturas e reuniões — arraste os cartões entre as colunas">
        <button className="btn ghost sm" onClick={() => setVisao(visao === "pessoa" ? "status" : "pessoa")}>
          Ver por: <b>{visao}</b> ⇄
        </button>
        <button className="btn" onClick={() => abrirNovo("tarefa")}>+ Tarefa</button>
      </CabecalhoSecao>

      <BarraFiltros mostrando={visiveis.length} total={painel.tarefas.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar título, vínculo ou obs…" />
        <SeletorFiltro valor={filtroResp} aoMudar={setFiltroResp} rotuloTodos="qualquer responsável"
          opcoes={painel.equipe.map((p) => ({ valor: p.id, rotulo: p.nome }))} />
        <label className="chk">
          <input type="checkbox" checked={esconderFeitas} onChange={(e) => setEsconderFeitas(e.target.checked)} />
          esconder concluídas
        </label>
      </BarraFiltros>

      {quadro}
    </>
  );
}
