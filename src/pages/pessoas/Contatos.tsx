/* Contatos externos: patrocinadores, órgãos e responsáveis por editais —
   com busca, filtro por tipo e colunas ordenáveis. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { abrirEdicao, abrirNovo } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import {
  BarraFiltros, CampoBusca, SeletorFiltro, ThOrdenavel, ordenarLinhas, type OrdemTabela,
} from "../../components/Filtros";
import { comparar } from "../../utils";

export function Contatos() {
  const { painel } = usarCentral();
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [ordem, setOrdem] = useState<OrdemTabela>({ campo: "", desc: false });

  const tipos = [...new Set(painel.contatos.map((c) => c.tipo).filter(Boolean))].sort(comparar);
  const contatos = ordenarLinhas(
    painel.contatos.filter((c) =>
      (!filtroTipo || c.tipo === filtroTipo) &&
      (!busca || [c.nome, c.tipo, c.ref, c.contato].join(" ").toLowerCase().includes(busca.toLowerCase()))),
    ordem);

  return (
    <>
      <CabecalhoSecao titulo="Contatos externos" sub="patrocinadores, órgãos e responsáveis por editais — clique no título da coluna pra ordenar">
        <button className="btn" onClick={() => abrirNovo("contato")}>+ Contato</button>
      </CabecalhoSecao>

      <BarraFiltros mostrando={contatos.length} total={painel.contatos.length}>
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="buscar nome, referência…" />
        <SeletorFiltro valor={filtroTipo} aoMudar={setFiltroTipo} rotuloTodos="todos os tipos" opcoes={tipos} />
      </BarraFiltros>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <ThOrdenavel campo="nome" ordem={ordem} aoOrdenar={setOrdem}>Nome</ThOrdenavel>
              <ThOrdenavel campo="tipo" ordem={ordem} aoOrdenar={setOrdem}>Tipo</ThOrdenavel>
              <ThOrdenavel campo="ref" ordem={ordem} aoOrdenar={setOrdem}>Referência</ThOrdenavel>
              <ThOrdenavel campo="contato" ordem={ordem} aoOrdenar={setOrdem}>Contato</ThOrdenavel>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contatos.map((c) => (
              <tr key={c.id}>
                <td><b>{c.nome}</b></td>
                <td>{c.tipo}</td>
                <td>{c.ref}</td>
                <td className="muted">{c.contato}</td>
                <td><span className="lnk" onClick={() => abrirEdicao("contato", c.id)}>editar</span></td>
              </tr>
            ))}
            {!contatos.length && <tr><td colSpan={5} className="muted">Nenhum contato com esses filtros.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
