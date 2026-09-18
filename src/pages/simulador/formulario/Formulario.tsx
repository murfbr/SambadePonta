/* Editor de rascunho: barra do topo (nome, candidatura ligada, gaveta de
   regras, stats e ações), a lateral de etapas e o corpo da etapa aberta —
   blocos e campos com condições de exibição, como na plataforma real. */
import { useState } from "react";
import { usarCentral } from "../../../store/central";
import { ligarCandidatura, idsDaCandidatura, nomeCandidatura, porId, salvarRascunho } from "../../../store/mutacoes";
import { irParaAba } from "../../../store/navegacao";
import { nomePlataforma } from "../../../data";
import {
  comoTexto, condicaoOk, resumoRascunho, visivel, type CampoAchatado,
} from "../../../lib/simulador/motor";
import { copiarComAviso } from "../../../components/Toast";
import { RegrasParaRascunho } from "../../contexto/RegrasParaRascunho";
import { LateralEtapas } from "./LateralEtapas";
import { Campo } from "./Campo";
import { SecaoInterno } from "./SecaoInterno";
import { clonar } from "../../../utils";
import type { Rascunho } from "../../../types";

interface Props {
  rascunho: Rascunho;
  vista: "interno" | "etapa";
  etapaAberta: number;
  aoMudarVista: (vista: "interno" | "etapa", ei?: number) => void;
}

export function FormularioRascunho({ rascunho: r, vista, etapaAberta, aoMudarVista }: Props) {
  const { painel, formularios } = usarCentral();
  const [drawerAberto, setDrawerAberto] = useState(false);
  const f = formularios[r.form];

  // A definição vem do banco: ou ainda está chegando, ou não existe mesmo.
  if (!f) {
    return (
      <div className="vazio-msg">
        {Object.keys(formularios).length === 0
          ? "abrindo os formulários do banco…"
          : <>Este rascunho usa o formulário <span className="mono">{r.form}</span>, que não está no banco.
            Importe a definição na aba Plataformas.</>}
        <div style={{ marginTop: 12 }}>
          <button className="btn sm" onClick={() => irParaAba("mesa")}>← Voltar à Mesa</button>
        </div>
      </div>
    );
  }

  const s = resumoRascunho(r);

  /** Aplica uma mudança no rascunho e salva (grava com debounce). */
  const alterar = (fn: (r: Rascunho) => void, rapido = false) => {
    const copia = clonar(r);
    fn(copia);
    salvarRascunho(copia, rapido);
  };

  const ei = Math.min(etapaAberta, f.etapas.length - 1);
  const etapa = f.etapas[ei];

  return (
    <>
      <div className="form-top">
        <input type="text" className="nome" value={r.nome} placeholder="nome do rascunho"
          aria-label="nome do rascunho" onChange={(e) => alterar((c) => { c.nome = e.target.value; })} />
        <span className="refl">{f.nome} · {nomePlataforma(f.plataforma)}</span>
        <select className="refsel" aria-label="candidatura no Painel" value={r.ref}
          onChange={(e) => alterar((c) => { c.ref = e.target.value; ligarCandidatura(c, e.target.value); }, true)}>
          <option value="">sem candidatura</option>
          {painel.candidaturas.map((c) => <option key={c.id} value={c.id}>{nomeCandidatura(c)}</option>)}
          {r.ref && !porId("candidaturas", r.ref) && <option value={r.ref}>ref. {r.ref}</option>}
        </select>
        <button className="btn sm quiet" title="regras e fichas do Contexto ligadas a este rascunho"
          onClick={() => setDrawerAberto(!drawerAberto)}>Regras e fichas</button>
        <span className="stat">{s.col} colados · {s.rev} revisados · {s.rasc} rascunho · {s.vazio} vazios</span>
        <div className="acts">
          <button className="btn sm" onClick={() => irParaAba("mesa")}>← Mesa</button>
          <button className="btn sm" onClick={() => void copiarComAviso(comoTexto(r), "Rascunho copiado em texto")}>Copiar tudo em texto</button>
          <button className="btn sm" onClick={() => irParaAba("transferencia")}>Ir para transferência →</button>
        </div>
      </div>

      {drawerAberto && (
        <div className="drawer">
          <RegrasParaRascunho ids={idsDaCandidatura(r.ref)} aoFechar={() => setDrawerAberto(false)} />
        </div>
      )}

      <div className="form-body">
        <aside className={"side" + (f.nav === "stepper" ? " stepper" : "")}>
          <LateralEtapas r={r} vista={vista} etapaAberta={ei} aoMudarVista={aoMudarVista} />
        </aside>
        <div>
          {vista === "interno"
            ? <SecaoInterno r={r} alterar={alterar} />
            : (
              <>
                <div className="etapa-h"><h3>{etapa.nome}</h3><span className="k">etapa {ei + 1} de {f.etapas.length}</span></div>
                {etapa.blocos.map((b, bi) => {
                  if (!condicaoOk(b.quando, r.valores)) return null;
                  return (
                    <div className="bloco-plat" key={bi}>
                      <h4>{b.t}{b.tag && <span className="tag">{b.tag}</span>}</h4>
                      {b.campos.map((c, ci) => {
                        if (c.t === "info") {
                          return <div className="info" key={ci} dangerouslySetInnerHTML={{ __html: c.html || c.l || "" }} />;
                        }
                        const achatado: CampoAchatado = { ...c, n: c.n!, etapa, ei, bloco: b };
                        if (!visivel(achatado, r.valores)) return null;
                        return <Campo key={c.n} r={r} c={achatado} alterar={alterar} />;
                      })}
                    </div>
                  );
                })}
                <div className="nav-passos">
                  {ei > 0
                    ? <button className="btn" onClick={() => aoMudarVista("etapa", ei - 1)}>← {f.etapas[ei - 1].nome}</button>
                    : <span />}
                  {ei < f.etapas.length - 1
                    ? <button className="btn primary" onClick={() => aoMudarVista("etapa", ei + 1)}>{f.etapas[ei + 1].nome} →</button>
                    : <button className="btn primary" onClick={() => irParaAba("transferencia")}>Ir para transferência →</button>}
                </div>
              </>
            )}
        </div>
      </div>
    </>
  );
}
