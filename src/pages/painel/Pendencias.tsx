/* Pendências: o que falta em pessoas, artistas, projetos, candidaturas e
   editais abertos — com atalho "+ tarefa" que já nasce com o título da lacuna. */
import type { ReactNode } from "react";
import { usarCentral } from "../../store/central";
import { abrirDetalhe } from "../../store/navegacao";
import { abrirEdicao, abrirNovo, type ChaveEntidade } from "../../store/edicao";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { projetoArtistaDe } from "../../lib/nomes";

interface ItemPendente {
  id: string;
  nome: string;
  /** As lacunas encontradas. */
  lacunas: string[];
  /** O que fazer ao clicar (abrir ficha ou edição). */
  abrir: () => void;
}

function SecaoPendencias({ titulo, sub, itens }: { titulo: string; sub: string; itens: ItemPendente[] }) {
  if (!itens.length) {
    return <div className="panel"><h4>{titulo}</h4><p className="muted" style={{ margin: 0 }}>✓ nada pendente aqui.</p></div>;
  }
  const total = itens.reduce((n, x) => n + x.lacunas.length, 0);
  return (
    <div className="panel">
      <h4>{titulo}<span className="act"><span className="badge st-prev">{total}</span></span></h4>
      <p className="hint" style={{ margin: "-2px 0 8px" }}>{sub}</p>
      {itens.map((item) => (
        <div key={item.id}>
          <div style={{ margin: "12px 0 2px" }}>
            <b style={{ fontSize: 13, cursor: "pointer", color: "var(--accent)" }} onClick={item.abrir}>{item.nome}</b>{" "}
            <span className="muted" style={{ fontSize: 11 }}>({item.lacunas.length})</span>
          </div>
          {item.lacunas.map((lacuna, i) => (
            <div className="docitem" key={i}>
              <span className="badge st-prev" style={{ fontSize: 9, flex: "0 0 auto" }}>falta</span>
              <span style={{ flex: 1, cursor: "pointer" }} onClick={item.abrir}>{lacuna}</span>
              <button className="btn ghost sm" style={{ padding: "2px 8px", fontSize: 10 }}
                onClick={(e) => { e.stopPropagation(); abrirNovo("tarefa", { titulo: item.nome + " — " + lacuna }); }}>
                + tarefa
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Pendencias() {
  const { painel } = usarCentral();

  const artistas: ItemPendente[] = painel.artistas.map((a) => {
    const lacunas: string[] = [];
    if (a.det?.docs) a.det.docs.filter((d) => d.status !== "ok").forEach((d) => lacunas.push("Documento: " + d.nome));
    else if (!a.det) lacunas.push("Ficha ainda vazia");
    if (/confirmar|definir/i.test(a.enq || "")) lacunas.push("Definir enquadramento jurídico");
    return { id: a.id, nome: a.nome, lacunas, abrir: () => abrirDetalhe("artista", a.id) };
  }).filter((x) => x.lacunas.length);

  const projetos: ItemPendente[] = painel.projetos.map((p) => ({
    id: p.id, nome: p.nome,
    lacunas: (p.producao || []).filter((x) => x.status !== "feito").map((x) => x.texto),
    abrir: () => abrirDetalhe("projeto", p.id),
  })).filter((x) => x.lacunas.length);

  const candidaturas: ItemPendente[] = painel.candidaturas.map((c) => ({
    id: c.id, nome: projetoArtistaDe(c),
    lacunas: (c.docs || []).filter((d) => !d.ok).map((d) => "Documento: " + d.nome),
    abrir: () => abrirDetalhe("cand", c.id),
  })).filter((x) => x.lacunas.length);

  const editais: ItemPendente[] = painel.editais.filter((e) => e.status === "open").map((e) => {
    const lacunas: string[] = [];
    if (!e.objeto) lacunas.push("Descrever o que financia");
    if (!e.comoInscrever) lacunas.push("Como se inscrever");
    if (!e.linkDrive) lacunas.push("Colar link da pasta no Drive");
    return { id: e.id, nome: e.nome, lacunas, abrir: () => abrirDetalhe("edital", e.id) };
  }).filter((x) => x.lacunas.length);

  const lacunasPessoa = (p: { nomeCompleto?: string; rg?: string; cpf?: string; nascimento?: string; email?: string }, comEmail: boolean) => {
    const lacunas: string[] = [];
    if (!p.nomeCompleto) lacunas.push("Nome completo");
    if (!p.rg) lacunas.push("RG");
    if (!p.cpf) lacunas.push("CPF");
    if (!p.nascimento) lacunas.push("Data de nascimento");
    if (comEmail && !p.email) lacunas.push("E-mail (convites de reunião)");
    return lacunas;
  };
  const editar = (chave: ChaveEntidade, id: string) => () => abrirEdicao(chave, id);
  const pessoas: ItemPendente[] = [
    ...painel.equipe.map((p) => ({ id: p.id, nome: p.nome + " (equipe)", lacunas: lacunasPessoa(p, true), abrir: editar("equipe", p.id) })),
    ...painel.elenco.map((p) => ({ id: p.id, nome: p.nome + " · " + (p.funcao || "elenco"), lacunas: lacunasPessoa(p, false), abrir: editar("elenco", p.id) })),
  ].filter((x) => x.lacunas.length);

  const total = [artistas, projetos, candidaturas, editais, pessoas]
    .reduce((n, arr) => n + arr.reduce((m, x) => m + x.lacunas.length, 0), 0);

  const sub: ReactNode = `atualiza sozinho conforme vocês preenchem: ${total} item(ns) no total. Clique pra abrir; "+ tarefa" cria a tarefa já com o título.`;

  return (
    <>
      <CabecalhoSecao titulo="Pendências — o que falta" sub={sub} />
      <SecaoPendencias titulo="Pessoas" sub="cadastro de cada pessoa: nome completo, RG, CPF, nascimento, e-mail e docs" itens={pessoas} />
      <SecaoPendencias titulo="Artistas" sub="documentos, ficha e enquadramento" itens={artistas} />
      <SecaoPendencias titulo="Projetos" sub="itens de produção não concluídos" itens={projetos} />
      <SecaoPendencias titulo="Candidaturas" sub="documentos que faltam por candidatura" itens={candidaturas} />
      <SecaoPendencias titulo="Editais abertos" sub="infos e link do Drive faltando" itens={editais} />
    </>
  );
}
