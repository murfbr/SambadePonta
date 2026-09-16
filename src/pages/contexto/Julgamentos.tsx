/* Julgamentos: cada projeto já avaliado — o que o parecer disse na leitura do
   julgador, pontos fortes e fracos, e as lições. Cada lição pode "virar regra",
   com este julgamento como fonte. */
import { usarCentral } from "../../store/central";
import { abrirFichaContexto, definirJulgamentoAberto, usarNavegacao } from "../../store/navegacao";
import { julgamentosOrdenados, nomeDaEntidade } from "../../lib/contexto/consultas";
import type { PedidoModalRegra } from "./ModalRegra";
import { clonar } from "../../utils";
import { ROTULO_RESULTADO, type Julgamento } from "../../types";

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
