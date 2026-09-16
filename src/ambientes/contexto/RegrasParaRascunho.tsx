/* Gaveta "Regras e fichas" dentro do Formulário do Simulador: as regras gerais
   e o essencial das fichas (posicionamento, argumentos/julgador, cuidados,
   regras) dos ids ligados ao rascunho — edital, projeto e artista. */
import { usarCentral } from "../../banco/dados";
import { entidadePorId, fichaDe, regrasDe } from "./contexto-util";
import { ROTULO_TIPO_REGRA, type Regra } from "../../tipos";

export function RegrasParaRascunho({ ids, aoFechar }: { ids: string[]; aoFechar: () => void }) {
  usarCentral();
  const gerais = regrasDe("geral");

  const LinhaR = ({ r }: { r: Regra }) => (
    <div className="drawer-r">
      <span className={"tp " + r.tipoRegra}>{ROTULO_TIPO_REGRA[r.tipoRegra]}</span>
      <span>{r.texto}{r.status === "duvida" && <> <span className="duvida">a confirmar</span></>}</span>
    </div>
  );

  return (
    <>
      <div className="drawer-h">
        <b>Regras e fichas para este rascunho</b>
        <button className="btn sm quiet" onClick={aoFechar}>fechar</button>
      </div>

      {gerais.length > 0 && (
        <div className="drawer-g">
          <div className="eyebrow">Gerais</div>
          {gerais.map((r) => <LinhaR r={r} key={r.id} />)}
        </div>
      )}

      {ids.map((id) => {
        const entidade = entidadePorId(id);
        if (!entidade) return null;
        const f = fichaDe(id);
        const regras = regrasDe(entidade.tipo, id);
        const argumentos = entidade.tipo === "edital" ? f.julgador || [] : f.argumentos || [];
        return (
          <div className="drawer-g" key={id}>
            <div className="eyebrow">{entidade.tipo} · {entidade.nome}</div>
            {f.posicionamento && <p className="drawer-p">{f.posicionamento}</p>}
            {argumentos.map((a, i) => (
              <div className="drawer-r" key={i}>
                <span className="tp dica">{entidade.tipo === "edital" ? "julgador" : "argumento"}</span>
                <span>{a}</span>
              </div>
            ))}
            {f.cuidados && (
              <div className="drawer-r"><span className="tp proibicao">cuidado</span><span>{f.cuidados}</span></div>
            )}
            {regras.map((r) => <LinhaR r={r} key={r.id} />)}
            {!f.posicionamento && !regras.length && <p className="vazio">sem ficha nem regras ainda</p>}
          </div>
        );
      })}

      {!ids.length && (
        <p className="vazio" style={{ padding: "8px 0" }}>
          Ligue o rascunho a uma candidatura (no topo) para ver as fichas do edital, do projeto e do artista.
        </p>
      )}
    </>
  );
}
