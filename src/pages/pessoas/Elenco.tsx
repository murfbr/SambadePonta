/* Elenco / colaboradores: tabela de músicos e técnicos que entram nos editais —
   busca, filtros por função e documentos, colunas ordenáveis. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import {
  BarraFiltros, CampoBusca, SeletorFiltro, ThOrdenavel, ordenarLinhas, type OrdemTabela,
} from "../../components/Filtros";
import { comparar } from "../../utils";

export function Elenco() {
  const { painel } = usarCentral();
  const [busca, setBusca] = useState("");
  const [filtroFuncao, setFiltroFuncao] = useState("");
  const [filtroDocs, setFiltroDocs] = useState("");
  const [ordem, setOrdem] = useState<OrdemTabela>({ campo: "", desc: false });

  const funcoes = [...new Set(painel.elenco.map((p) => p.funcao).filter(Boolean))].sort(comparar);
  const elenco = ordenarLinhas(
    painel.elenco.filter((p) =>
      (!filtroFuncao || p.funcao === filtroFuncao) &&
      (!filtroDocs || p.docsStatus === filtroDocs) &&
      (!busca || [p.nome, p.nomeCompleto || "", p.funcao, p.bio, p.email || ""].join(" ").toLowerCase().includes(busca.toLowerCase()))),
    ordem);

  return (
    <>
      <CabecalhoSecao titulo="Elenco / Colaboradores" sub="músicos e técnicos que entram nos editais — bio e documentos">
        <button className="btn" onClick={() => abrirNovo("elenco")}>+ Colaborador</button>
      </CabecalhoSecao>

      <BarraFiltros mostrando={elenco.length} total={painel.elenco.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar nome, função, bio…" />
        <SeletorFiltro valor={filtroFuncao} aoMudar={setFiltroFuncao} rotuloTodos="todas as funções" opcoes={funcoes} />
        <SeletorFiltro valor={filtroDocs} aoMudar={setFiltroDocs} rotuloTodos="docs: tanto faz"
          opcoes={[{ valor: "ok", rotulo: "docs ok" }, { valor: "pend", rotulo: "docs pendentes" }]} />
      </BarraFiltros>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <ThOrdenavel campo="nome" ordem={ordem} aoOrdenar={setOrdem}>Nome</ThOrdenavel>
              <ThOrdenavel campo="funcao" ordem={ordem} aoOrdenar={setOrdem}>Função</ThOrdenavel>
              <th>Minibiografia</th>
              <ThOrdenavel campo="docsStatus" ordem={ordem} aoOrdenar={setOrdem}>Documentos</ThOrdenavel>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {elenco.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.nome}</b>
                  {p.nomeCompleto && <div className="muted" style={{ fontSize: 11.5 }}>{p.nomeCompleto}</div>}
                  {p.email && <div className="muted" style={{ fontSize: 11 }}>✉ {p.email}</div>}
                </td>
                <td>{p.funcao}</td>
                <td className="muted">{p.bio}</td>
                <td>
                  <span className={"badge " + (p.docsStatus === "ok" ? "pill-ok" : "pill-pend")}>
                    {p.docsStatus === "ok" ? "docs ok" : "docs pend."}
                  </span>
                </td>
                <td><span className="lnk" onClick={() => abrirEdicao("elenco", p.id)}>editar</span></td>
              </tr>
            ))}
            {!elenco.length && <tr><td colSpan={5} className="muted">Ninguém com esses filtros.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
