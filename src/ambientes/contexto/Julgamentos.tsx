/* Julgamentos: cada projeto já avaliado — o que o parecer disse na leitura do
   julgador, pontos fortes e fracos, e as lições. Cada lição pode "virar regra",
   com este julgamento como fonte. */
import { useState } from "react";
import { excluirJulgamento, salvarJulgamento, usarCentral } from "../../banco/dados";
import { abrirFichaContexto, definirJulgamentoAberto, usarNavegacao } from "../../estado/navegacao";
import { entidades, julgamentosOrdenados, nomeDaEntidade } from "./contexto-util";
import type { PedidoModalRegra } from "./Regras";
import { toast } from "../../blocos/Toast";
import { clonar, uid } from "../../util";
import { ROTULO_RESULTADO, type Julgamento } from "../../tipos";

interface Props {
  aoAbrirRegra: (p: PedidoModalRegra) => void;
  aoAbrirJulgamento: (j: Julgamento | "novo") => void;
}

export function TelaJulgamentos({ aoAbrirRegra, aoAbrirJulgamento }: Props) {
  const { julgamentos, regras } = usarCentral();
  const nav = usarNavegacao();
  const lista = julgamentosOrdenados();
  const selecionado = (nav.julgamentoAberto && julgamentos[nav.julgamentoAberto]) || lista[0];

  const cabecalho = (
    <div className="shead">
      <div>
        <h2>Julgamentos</h2>
        <p className="sub">Cada projeto já avaliado: o que o parecer disse, na leitura do julgador, e as lições que viraram regra. Registre também inscrições sem resultado, para comparar depois.</p>
      </div>
      <div className="acts">
        <button className="btn primary" onClick={() => aoAbrirJulgamento("novo")}>+ novo julgamento</button>
      </div>
    </div>
  );

  if (!selecionado) {
    return <>{cabecalho}<p className="vazio">Nenhum julgamento registrado ainda.</p></>;
  }
  const j = selecionado;

  const ListaItens = ({ itens }: { itens: string[] }) =>
    itens.length
      ? <ul className="itens">{itens.map((a, i) => <li key={i}><span className="k">·</span><span>{a}</span></li>)}</ul>
      : <p className="vazio">nada registrado</p>;

  const linkFicha = (id: string, texto: string) => (
    <a href="#" onClick={(e) => { e.preventDefault(); abrirFichaContexto(id); }}>{texto}</a>
  );

  return (
    <>
      {cabecalho}
      <div className="duas">
        <aside className="lista">
          <div className="eyebrow">registros</div>
          {lista.map((x) => (
            <button key={x.id} className={x.id === j.id ? "on" : ""}
              onClick={() => { definirJulgamentoAberto(x.id); window.scrollTo({ top: 0 }); }}>
              <span className={"res " + x.resultado} style={{ fontSize: 10 }}>{ROTULO_RESULTADO[x.resultado] || x.resultado}</span>
              {nomeDaEntidade(x.edital).split(" (")[0]}{x.projeto ? " · " + nomeDaEntidade(x.projeto) : ""}
            </button>
          ))}
        </aside>

        <div>
          <div className="julg-h">
            <h2>{linkFicha(j.edital, nomeDaEntidade(j.edital))}</h2>
            <span className={"res " + j.resultado}>{ROTULO_RESULTADO[j.resultado] || j.resultado}</span>
            <span className="acts">
              <button className="btn sm quiet" onClick={() => aoAbrirJulgamento(clonar(j))}>editar</button>
            </span>
          </div>
          <p className="julg-meta">
            {j.projeto && <>projeto {linkFicha(j.projeto, nomeDaEntidade(j.projeto))} · </>}
            {j.ano}{j.nota && <> · nota {j.nota}</>} · <span className="mono">{j.id}</span>
          </p>

          <div className="bloco">
            <div className="bloco-h"><h4>O que aconteceu</h4></div>
            <p className="texto">{j.resumo || <span className="vazio">sem resumo</span>}</p>
          </div>

          <div className="ff">
            <div className="bloco">
              <div className="bloco-h"><h4>Pontos fortes</h4><span className="q">na leitura do julgador</span></div>
              <ListaItens itens={j.fortes || []} />
            </div>
            <div className="bloco">
              <div className="bloco-h"><h4>Pontos fracos</h4><span className="q">o que foi criticado ou ficou frágil</span></div>
              <ListaItens itens={j.fracos || []} />
            </div>
          </div>

          <div className="bloco" style={{ marginTop: 12 }}>
            <div className="bloco-h">
              <h4>Lições</h4>
              <span className="q">cada lição pode virar uma regra, com este julgamento como fonte</span>
            </div>
            {(j.licoes || []).map((licao, i) => (
              <div className="licao" key={i}>
                <span>{licao.texto}</span>
                <span className="virou">
                  {licao.regra && regras[licao.regra] ? (
                    <>virou regra <span className="mono">{licao.regra}</span>{" "}
                      <button className="btn sm quiet" onClick={() => aoAbrirRegra({ regra: clonar(regras[licao.regra]) })}>ver</button>
                    </>
                  ) : (
                    <button className="btn sm quiet" onClick={() => aoAbrirRegra({
                      contexto: {
                        tipo: "edital", id: j.edital, texto: licao.texto,
                        fonte: { tipo: "julgamento", ref: j.id },
                        julgamentoId: j.id, licao: i,
                      },
                    })}>virar regra</button>
                  )}
                </span>
              </div>
            ))}
            {!(j.licoes || []).length && <p className="vazio">nenhuma lição</p>}
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════ modal ══════════ */

export function ModalJulgamento({ inicial, aoFechar }: { inicial: Julgamento | null; aoFechar: () => void }) {
  const [j, setJ] = useState<Julgamento>(inicial || {
    id: "", edital: "", projeto: "", ano: String(new Date().getFullYear()),
    resultado: "aguardando", nota: "", resumo: "", fortes: [], fracos: [], licoes: [],
  });
  // Listas como texto (um item por linha) enquanto edita.
  const [fortes, setFortes] = useState((inicial?.fortes || []).join("\n"));
  const [fracos, setFracos] = useState((inicial?.fracos || []).join("\n"));
  const [licoes, setLicoes] = useState((inicial?.licoes || []).map((l) => l.texto).join("\n"));
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const linhas = (v: string) => v.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const mudar = (parte: Partial<Julgamento>) => setJ((atual) => ({ ...atual, ...parte }));

  function salvar() {
    if (!j.edital) { toast("Escolha o edital"); return; }
    const pronta: Julgamento = {
      ...j,
      id: j.id || uid("j"),
      ano: j.ano.trim(), nota: j.nota.trim(), resumo: j.resumo.trim(),
      fortes: linhas(fortes), fracos: linhas(fracos),
      // preserva o vínculo lição→regra quando o texto da lição não mudou
      licoes: linhas(licoes).map((texto) => {
        const antiga = (inicial?.licoes || []).find((l) => l.texto === texto);
        return { texto, regra: antiga?.regra || "" };
      }),
    };
    salvarJulgamento(pronta);
    definirJulgamentoAberto(pronta.id);
    aoFechar();
    toast("Julgamento salvo");
  }

  function excluir() {
    if (!confirmandoExclusao) { setConfirmandoExclusao(true); return; }
    excluirJulgamento(j.id);
    definirJulgamentoAberto(null);
    aoFechar();
  }

  const seletor = (valor: string, aoMudar: (v: string) => void, lista: { id: string; nome: string }[], vazio?: string) => (
    <select value={valor} onChange={(e) => aoMudar(e.target.value)}>
      {vazio != null && <option value="">{vazio}</option>}
      {lista.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
    </select>
  );

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div className="modal">
        <h3>{j.id ? "Editar julgamento" : "Novo julgamento"}</h3>
        <div className="field"><label>Edital</label>{seletor(j.edital, (v) => mudar({ edital: v }), entidades("edital"), "escolha")}</div>
        <div className="field"><label>Projeto</label>{seletor(j.projeto, (v) => mudar({ projeto: v }), entidades("projeto"), "sem projeto")}</div>
        <div className="linha3">
          <div className="field"><label>Ano</label><input value={j.ano} onChange={(e) => mudar({ ano: e.target.value })} /></div>
          <div className="field">
            <label>Resultado</label>
            <select value={j.resultado} onChange={(e) => mudar({ resultado: e.target.value as Julgamento["resultado"] })}>
              {Object.entries(ROTULO_RESULTADO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="field"><label>Nota</label><input value={j.nota} onChange={(e) => mudar({ nota: e.target.value })} /></div>
        </div>
        <div className="field"><label>O que aconteceu</label><textarea rows={3} value={j.resumo} onChange={(e) => mudar({ resumo: e.target.value })} /></div>
        <div className="field"><label>Pontos fortes (um por linha)</label><textarea rows={3} value={fortes} onChange={(e) => setFortes(e.target.value)} /></div>
        <div className="field"><label>Pontos fracos (um por linha)</label><textarea rows={3} value={fracos} onChange={(e) => setFracos(e.target.value)} /></div>
        <div className="field"><label>Lições (uma por linha)</label><textarea rows={3} value={licoes} onChange={(e) => setLicoes(e.target.value)} /></div>
        <div className="mfoot">
          {j.id && <button className="del" onClick={excluir}>{confirmandoExclusao ? "Confirmar exclusão" : "Excluir"}</button>}
          <span className="sp">
            <button className="btn quiet" onClick={aoFechar}>Cancelar</button>
            <button className="btn primary" onClick={salvar}>Salvar</button>
          </span>
        </div>
      </div>
    </div>
  );
}
