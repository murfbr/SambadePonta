/* Fichas: o conhecimento de escrita de cada artista, projeto e edital — sempre
   apontando o MESMO id do Painel. Blocos editáveis em linha: posicionamento,
   argumentos (ou "o que o julgador pesa", nos editais), vocabulário, já-foi-dito
   e cuidados. Embaixo, as regras do escopo e os julgamentos ligados. */
import { useEffect, useState, type ReactNode } from "react";
import { usarCentral } from "../../store/central";
import { salvarFicha } from "../../store/mutacoes";
import {
  abrirFichaContexto, abrirJulgamento, definirFichaAberta, usarNavegacao,
} from "../../store/navegacao";
import {
  TIPOS_FICHA, entidadePorId, entidades, fichaDe, julgamentosOrdenados,
  nomeDaEntidade, regrasDe, temFicha,
} from "../../lib/contexto/consultas";
import { montarBloco } from "../../lib/contexto/bloco";
import { LinhaRegra } from "./LinhaRegra";
import type { PedidoModalRegra } from "./ModalRegra";
import { copiarComAviso, toast } from "../../components/Toast";
import { clonar } from "../../utils";
import { ROTULO_RESULTADO, type Ficha, type TipoFicha } from "../../types";

type ChaveBloco = "posicionamento" | "argumentos" | "julgador" | "vocabulario" | "usados" | "cuidados";

export function TelaFichas({ aoAbrirRegra }: { aoAbrirRegra: (p: PedidoModalRegra) => void }) {
  const { fichas, regras, julgamentos } = usarCentral();
  void fichas; void regras; void julgamentos; // re-render quando qualquer um mudar
  const nav = usarNavegacao();
  const [editando, setEditando] = useState<ChaveBloco | null>(null);
  const [textoEdicao, setTextoEdicao] = useState("");

  const tipos: TipoFicha[] = ["artista", "projeto", "edital"];
  const todas = tipos.flatMap(entidades);

  // Garante uma ficha selecionada válida.
  const selecionada = nav.fichaAberta && entidadePorId(nav.fichaAberta) ? nav.fichaAberta : todas[0]?.id || null;
  useEffect(() => {
    if (selecionada !== nav.fichaAberta) definirFichaAberta(selecionada);
  }, [selecionada, nav.fichaAberta]);

  if (!selecionada) {
    return <p className="vazio">Cadastre artistas, projetos e editais no Painel para ter fichas aqui.</p>;
  }

  const f = fichaDe(selecionada);
  const regrasDoEscopo = regrasDe(f.tipo, f.id);
  const julgamentosLigados = julgamentosOrdenados().filter((j) =>
    j.edital === f.id || j.projeto === f.id ||
    (f.tipo === "artista" && entidades("projeto").some((p) => p.id === j.projeto && p.artista === f.id)));

  /** Valor do bloco como texto editável (um item por linha; pares com " | "). */
  const valorEditavel = (chave: ChaveBloco): string => {
    if (chave === "posicionamento") return f.posicionamento || "";
    if (chave === "cuidados") return f.cuidados || "";
    if (chave === "argumentos") return (f.argumentos || []).join("\n");
    if (chave === "julgador") return (f.julgador || []).join("\n");
    if (chave === "vocabulario") return (f.vocabulario || []).map((v) => v.usar + " | " + v.evitar).join("\n");
    return (f.usados || []).map((u) => u.texto + " | " + u.onde + " | " + u.quando).join("\n");
  };

  const dicas: Record<ChaveBloco, string> = {
    posicionamento: "duas linhas", cuidados: "texto livre", argumentos: "um por linha",
    julgador: "um por linha", vocabulario: "por linha: usar | evitar", usados: "por linha: texto | onde | quando",
  };

  function salvarBloco(chave: ChaveBloco) {
    const linhas = textoEdicao.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const doc: Ficha = {
      id: f.id, tipo: f.tipo,
      posicionamento: f.posicionamento, argumentos: f.argumentos || [], julgador: f.julgador || [],
      vocabulario: f.vocabulario || [], usados: f.usados || [], cuidados: f.cuidados || "",
    };
    if (chave === "posicionamento" || chave === "cuidados") doc[chave] = textoEdicao.trim();
    else if (chave === "argumentos" || chave === "julgador") doc[chave] = linhas;
    else if (chave === "vocabulario") doc.vocabulario = linhas.map((l) => {
      const p = l.split("|").map((x) => x.trim());
      return { usar: p[0] || "", evitar: p[1] || "" };
    });
    else doc.usados = linhas.map((l) => {
      const p = l.split("|").map((x) => x.trim());
      return { texto: p[0] || "", onde: p[1] || "", quando: p[2] || "" };
    });
    salvarFicha(doc);
    setEditando(null);
    toast("Ficha salva");
  }

  // Função (não componente) para o textarea manter identidade — e o foco — entre renders.
  const bloco = (chave: ChaveBloco, titulo: string, pergunta: string, conteudo: ReactNode) => {
    const emEdicao = editando === chave;
    return (
      <div className="bloco">
        <div className="bloco-h">
          <h4>{titulo}</h4>
          <span className="q">{pergunta}</span>
          {!emEdicao && (
            <button className="btn sm quiet ed" onClick={() => { setEditando(chave); setTextoEdicao(valorEditavel(chave)); }}>
              editar
            </button>
          )}
        </div>
        {emEdicao ? (
          <>
            <textarea className="edt" rows={chave === "posicionamento" || chave === "cuidados" ? 4 : 6}
              value={textoEdicao} onChange={(e) => setTextoEdicao(e.target.value)} autoFocus />
            <div className="edt-f">
              <span>{dicas[chave]}</span>
              <button className="btn sm primary" onClick={() => salvarBloco(chave)}>Salvar</button>
              <button className="btn sm quiet" onClick={() => setEditando(null)}>Cancelar</button>
            </div>
          </>
        ) : conteudo}
      </div>
    );
  };

  const Itens = ({ itens }: { itens: string[] }) =>
    itens.length
      ? <ul className="itens">{itens.map((a, i) => <li key={i}><span className="k">{i + 1}</span><span>{a}</span></li>)}</ul>
      : <p className="vazio">nada registrado ainda</p>;

  return (
    <div className="duas">
      <aside className="lista">
        {tipos.map((t) => (
          <span key={t} style={{ display: "contents" }}>
            <div className={"eyebrow" + (t !== "artista" ? " sep" : "")}>{TIPOS_FICHA[t]}</div>
            {entidades(t).map((x) => (
              <button key={x.id} className={(x.id === selecionada ? "on " : "") + (temFicha(x.id) ? "" : "sem")}
                onClick={() => { definirFichaAberta(x.id); setEditando(null); window.scrollTo({ top: 0 }); }}>
                {x.nome}<span className="n">{regrasDe(t, x.id).length || ""}</span>
              </button>
            ))}
          </span>
        ))}
      </aside>

      <div>
        <div className="ficha-h">
          <h2>{f.nome}</h2>
          <span className="painel">
            {f.tipo} · no Painel: <span className="mono">{f.id}</span>
            {f.artista && <> · de <a href="#" onClick={(e) => { e.preventDefault(); abrirFichaContexto(f.artista!); }}>{nomeDaEntidade(f.artista)}</a></>}
          </span>
          <div className="acts">
            <button className="btn sm" onClick={() => void copiarComAviso(montarBloco([f.id], true), "Ficha copiada em texto para colar numa conversa")}>
              Copiar para o Claude
            </button>
          </div>
        </div>
        <p className="ficha-sub">Só conhecimento de escrita. Os fatos (bio, docs, prazos) estão na ficha {f.id} do Painel.</p>

        {bloco("posicionamento", "Posicionamento", "como abrir um parágrafo sobre isso",
          f.posicionamento ? <p className="texto">{f.posicionamento}</p> : <p className="vazio">nada registrado ainda</p>)}

        {f.tipo === "edital"
          ? bloco("julgador", "O que o julgador pesa", "lido dos critérios e dos pareceres, não do objeto",
            <Itens itens={f.julgador || []} />)
          : bloco("argumentos", "Argumentos fortes", "os pontos que sempre convencem",
            <Itens itens={f.argumentos || []} />)}

        {bloco("vocabulario", "Vocabulário", "usar assim, e não assim",
          (f.vocabulario || []).length ? (
            <div className="vocab">
              {f.vocabulario.map((v, i) => (
                <span style={{ display: "contents" }} key={i}>
                  <span className="u">{v.usar}</span><span className="e">{v.evitar}</span>
                </span>
              ))}
            </div>
          ) : <p className="vazio">nada registrado ainda</p>)}

        {bloco("usados", "Já foi dito, e onde", "para não repetir o mesmo texto em dois lugares",
          (f.usados || []).length ? (
            <table className="usados"><tbody>
              {f.usados.map((u, i) => (
                <tr key={i}>
                  <td className="o">{u.onde}<br /><span style={{ color: "var(--ink3)", fontSize: 12 }}>{u.quando}</span></td>
                  <td>{u.texto}</td>
                </tr>
              ))}
            </tbody></table>
          ) : <p className="vazio">nada registrado ainda</p>)}

        {bloco("cuidados", "Cuidados", "o que checar antes de escrever",
          f.cuidados ? <p className="texto">{f.cuidados}</p> : <p className="vazio">nenhum</p>)}

        <div className="bloco">
          <div className="bloco-h">
            <h4>Regras deste escopo</h4>
            <span className="q">{regrasDoEscopo.length} regra{regrasDoEscopo.length === 1 ? "" : "s"}; as gerais valem sempre</span>
            <button className="btn sm quiet ed" onClick={() => aoAbrirRegra({ contexto: { tipo: f.tipo, id: f.id } })}>+ regra</button>
          </div>
          {regrasDoEscopo.length
            ? regrasDoEscopo.map((r) => <LinhaRegra r={r} key={r.id} aoEditar={() => aoAbrirRegra({ regra: clonar(r) })} />)
            : <p className="vazio">nenhuma regra específica</p>}
        </div>

        <div className="bloco">
          <div className="bloco-h">
            <h4>Julgamentos ligados</h4>
            <span className="q">o que já foi avaliado envolvendo esta ficha</span>
          </div>
          {julgamentosLigados.length ? julgamentosLigados.map((j) => (
            <div className="julg-mini" key={j.id}>
              <span className={"res " + j.resultado}>{ROTULO_RESULTADO[j.resultado] || j.resultado}</span>
              <a href="#" onClick={(e) => { e.preventDefault(); abrirJulgamento(j.id); }}>
                {nomeDaEntidade(j.edital)}{j.projeto ? " · " + nomeDaEntidade(j.projeto) : ""}
              </a>
              <span style={{ color: "var(--ink3)", fontSize: 12.5 }}>{j.ano}</span>
            </div>
          )) : <p className="vazio">nenhum</p>}
        </div>
      </div>
    </div>
  );
}
