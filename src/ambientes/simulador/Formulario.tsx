/* Editor de rascunho: a réplica do formulário da plataforma, campo a campo.
   Cada campo tem status (rascunho → revisado → colado), botão de copiar, nota
   interna, contador com o limite real da plataforma e condições de exibição.
   A lateral navega entre a seção Interno e as etapas do formulário. */
import { useState, type ReactNode } from "react";
import {
  idsDaCandidatura, ligarCandidatura, nomeCandidatura, porId,
  salvarRascunho, salvarRegistro, usarCentral,
} from "../../banco/dados";
import { irParaAba } from "../../estado/navegacao";
import { FORMULARIOS, PERFIS_JURIDICOS, nomePlataforma } from "../../dados/estaticos";
import {
  comoTexto, condicaoOk, pctEtapa, resumoRascunho, statusEfetivo,
  textoDe, visivel, type CampoAchatado,
} from "./motor";
import { PlanilhaOrcamento, ResumoOrcamento } from "./Orcamento";
import { RegrasParaRascunho } from "../contexto/RegrasParaRascunho";
import { copiarComAviso, toast } from "../../blocos/Toast";
import { clonar } from "../../util";
import { ROTULO_STATUS_CAMPO, type Rascunho, type StatusCampo } from "../../tipos";

interface Props {
  rascunho: Rascunho;
  vista: "interno" | "etapa";
  etapaAberta: number;
  aoMudarVista: (vista: "interno" | "etapa", ei?: number) => void;
}

export function FormularioRascunho({ rascunho: r, vista, etapaAberta, aoMudarVista }: Props) {
  const { painel } = usarCentral();
  const [drawerAberto, setDrawerAberto] = useState(false);
  const f = FORMULARIOS[r.form];
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

/* ══════════ lateral ══════════ */

function LateralEtapas({ r, vista, etapaAberta, aoMudarVista }: {
  r: Rascunho; vista: string; etapaAberta: number;
  aoMudarVista: (vista: "interno" | "etapa", ei?: number) => void;
}) {
  const f = FORMULARIOS[r.form];
  const candidatura = porId("candidaturas", r.ref);
  const docsTodos = [...(candidatura?.docs || []), ...r.interno.docs];
  const docsProntos = docsTodos.filter((d) => d.ok).length;

  return (
    <>
      <div className="eyebrow">interno</div>
      <button className={"int" + (vista === "interno" ? " on" : "")} onClick={() => aoMudarVista("interno")}>
        <span className="k">◐</span>Geral
        <span className="pct">{docsTodos.length ? `${docsProntos}/${docsTodos.length} docs` : ""}</span>
      </button>
      <div className="eyebrow sep">{f.nav === "lateral" ? "menu da proposta" : "etapas"}</div>
      {f.etapas.map((e, k) => (
        <span key={e.id}>
          {e.grupo && (k === 0 || f.etapas[k - 1].grupo !== e.grupo) && <div className="eyebrow grp">{e.grupo}</div>}
          <button
            className={(vista === "etapa" && etapaAberta === k ? "on " : "") + (e.grupo ? "sub" : "")}
            onClick={() => { aoMudarVista("etapa", k); window.scrollTo({ top: 0 }); }}>
            <span className="k">{f.nav === "lateral" ? "" : e.cod || k + 1}</span>
            {e.nome}
            <span className="pct">{pctEtapa(r, k)}%</span>
          </button>
        </span>
      ))}
      <div className="obs">{f.obs || ""}</div>
    </>
  );
}

/* ══════════ um campo da plataforma ══════════ */

function Campo({ r, c, alterar }: { r: Rascunho; c: CampoAchatado; alterar: (fn: (r: Rascunho) => void, rapido?: boolean) => void }) {
  const v = r.valores[c.n];
  const st = statusEfetivo(r, c);
  const [filtro, setFiltro] = useState("");

  function girarStatus() {
    if (st === "vazio") { toast("Campo vazio: o status aparece quando houver conteúdo"); return; }
    const ordem: StatusCampo[] = ["rasc", "rev", "col"];
    alterar((copia) => {
      copia.status[c.n] = ordem[(ordem.indexOf(copia.status[c.n] || "rasc") + 1) % 3];
    });
  }

  function alternarNota() {
    if (r.notas[c.n] != null && !(r.notas[c.n] || "").trim()) {
      alterar((copia) => { delete copia.notas[c.n]; });
    } else if (r.notas[c.n] == null) {
      alterar((copia) => { copia.notas[c.n] = ""; });
    }
  }

  const definirValor = (valor: unknown) => alterar((copia) => { copia.valores[c.n] = valor; });

  let corpo: ReactNode = null;
  const texto = typeof v === "string" ? v : "";

  if (c.t === "txt") {
    corpo = (
      <>
        <input type="text" name={c.n} className={c.cls || ""} maxLength={c.max || 190} value={texto}
          placeholder={c.ro ? "preenchido pela plataforma" : undefined}
          onChange={(e) => definirValor(e.target.value)} />
        {c.max && <div className="campo-f"><Contador atual={texto.length} max={c.max} /></div>}
      </>
    );
  } else if (c.t === "ta") {
    corpo = (
      <>
        <textarea name={c.n} rows={(c.max || 0) > 1500 ? 9 : (c.max || 0) > 600 ? 6 : 4} value={texto}
          onChange={(e) => definirValor(e.target.value)} />
        <div className="campo-f">
          <Contador atual={texto.length} max={c.max} />
          {c.max && <span>limite real da plataforma</span>}
        </div>
      </>
    );
  } else if (c.t === "sel") {
    corpo = (
      <select name={c.n} value={texto} onChange={(e) => definirValor(e.target.value)}>
        <option value="" />
        {(c.opts || []).map((o) => <option key={o}>{o}</option>)}
      </select>
    );
  } else if (c.t === "rad") {
    corpo = (
      <div className={"opts" + (c.inline ? " inline" : "")}>
        {(c.opts || []).map((o) => (
          <label className={"opt" + (o === v ? " sel" : "")} key={o}>
            <input type="radio" name={c.n} value={o} checked={o === v} onChange={() => definirValor(o)} />
            <span>{o}</span>
          </label>
        ))}
      </div>
    );
  } else if (c.t === "date") {
    corpo = <input type="date" name={c.n} className="curto" value={texto} onChange={(e) => definirValor(e.target.value)} />;
  } else if (c.t === "chk") {
    const selecionados = Array.isArray(v) ? (v as string[]) : [];
    const grupos = c.grupos || [{ g: null, op: c.opts || [] }];
    const alternar = (opcao: string, marcado: boolean) => {
      const conjunto = new Set(selecionados);
      if (marcado) conjunto.add(opcao); else conjunto.delete(opcao);
      definirValor([...conjunto]);
    };
    const filtroAtivo = filtro.toLowerCase();
    corpo = (
      <>
        {Boolean(c.filter) && (
          <input type="text" className="filtro medio" placeholder="filtrar opções…" value={filtro}
            onChange={(e) => setFiltro(e.target.value)} />
        )}
        <div className="opts chk">
          {grupos.map((g, gi) => (
            <span style={{ display: "contents" }} key={gi}>
              {g.g && <div className="grp-h">{g.g}</div>}
              {g.op.map((o) => {
                const escondida = Boolean(filtroAtivo) && !o.toLowerCase().includes(filtroAtivo);
                return (
                  <label className={"opt" + (selecionados.includes(o) ? " sel" : "")} key={o} hidden={escondida}>
                    <input type="checkbox" checked={selecionados.includes(o)} onChange={(e) => alternar(o, e.target.checked)} />
                    <span>{o}</span>
                  </label>
                );
              })}
            </span>
          ))}
        </div>
      </>
    );
  } else if (c.t === "rep") {
    const itens = Array.isArray(v) ? (v as Record<string, string>[]) : [];
    corpo = (
      <>
        <div className="rep">
          {itens.map((item, i) => (
            <div className="repitem" key={i}>
              <div className="rephead">
                <span>{i + 1}</span>
                <button type="button" className="x" aria-label="remover"
                  onClick={() => alterar((copia) => { (copia.valores[c.n] as unknown[]).splice(i, 1); }, true)}>×</button>
              </div>
              {(c.campos || []).map((sub) => {
                const valorSub = item[sub.n!] || "";
                const definirSub = (novo: string) => alterar((copia) => {
                  const arr = copia.valores[c.n] as Record<string, string>[];
                  (arr[i] = arr[i] || {})[sub.n!] = novo;
                });
                return (
                  <label className="replab" key={sub.n}>
                    {sub.l}{sub.req ? <> <span className="req">*</span></> : null}
                    {sub.t === "ta"
                      ? <textarea maxLength={sub.max || undefined} rows={3} value={valorSub} onChange={(e) => definirSub(e.target.value)} />
                      : sub.t === "sel"
                        ? (
                          <select value={valorSub} onChange={(e) => definirSub(e.target.value)}>
                            <option value="" />
                            {(sub.opts || []).map((o) => <option key={o}>{o}</option>)}
                          </select>
                        )
                        : <input type={sub.t === "date" ? "date" : "text"} value={valorSub} onChange={(e) => definirSub(e.target.value)} />}
                  </label>
                );
              })}
            </div>
          ))}
        </div>
        <button type="button" className="btn sm" style={{ marginTop: 8 }}
          onClick={() => alterar((copia) => {
            const arr = Array.isArray(copia.valores[c.n]) ? (copia.valores[c.n] as unknown[]) : (copia.valores[c.n] = []);
            (arr as Record<string, string>[]).push({});
          }, true)}>+ adicionar</button>
      </>
    );
  } else if (c.t === "docs") {
    const marcados = v && typeof v === "object" ? (v as Record<string, boolean>) : {};
    corpo = (
      <>
        <div className="docs">
          {(c.opts || []).map((o) => {
            const obrigatorio = o.endsWith("*");
            const nome = o.replace(/\*$/, "");
            return (
              <label className={"doc" + (marcados[nome] ? " ok" : "")} key={o}>
                <input type="checkbox" checked={Boolean(marcados[nome])}
                  onChange={(e) => alterar((copia) => {
                    const d = (copia.valores[c.n] = (copia.valores[c.n] && typeof copia.valores[c.n] === "object" ? copia.valores[c.n] : {}) as Record<string, boolean>);
                    d[nome] = e.target.checked;
                  })} />
                <span>{nome}</span>
                {obrigatorio && <span className="obr">obrigatório</span>}
              </label>
            );
          })}
        </div>
        <div className="campo-f"><span>marque o que já está pronto; o upload é só na plataforma</span></div>
      </>
    );
  } else if (c.t === "anexo") {
    corpo = (
      <div className="anexo">
        <label className="marca">
          <input type="checkbox" checked={Boolean(r.anexos[c.n])}
            onChange={(e) => alterar((copia) => { copia.anexos[c.n] = e.target.checked; })} />
          {" "}arquivo pronto <span style={{ color: "var(--ink3)" }}>· upload só na plataforma</span>
        </label>
        <input type="text" name={c.n} maxLength={190} placeholder="nome do arquivo ou link" value={texto}
          onChange={(e) => definirValor(e.target.value)} />
      </div>
    );
  } else if (c.t === "orc") {
    corpo = <PlanilhaOrcamento r={r} alterar={alterar} />;
  } else if (c.t === "orcresumo") {
    corpo = <ResumoOrcamento r={r} alterar={alterar} />;
  }

  return (
    <div className="campo" data-st={st}>
      <div className="campo-h">
        <label htmlFor={"f-" + c.n}>{c.l}</label>
        {c.req ? <span className="req">obrigatório</span> : null}
        <span className="mono">{c.cod || c.n}</span>
        <span className="tools">
          <button type="button" className="st" data-v={st} title="clique para mudar o status" onClick={girarStatus}>
            {ROTULO_STATUS_CAMPO[st]}
          </button>
          <button type="button" className="btn sm quiet"
            onClick={() => void copiarComAviso(textoDe(c, v, r), "Campo copiado")}>Copiar</button>
          <button type="button" className="btn sm quiet" onClick={alternarNota}>Nota</button>
        </span>
      </div>
      {c.dica && <p className="instr">{c.dica}</p>}
      {corpo}
      {r.notas[c.n] != null && (
        <div className="nota">
          <b>Nota:</b>
          <input type="text" value={r.notas[c.n]} placeholder="anotação interna sobre este campo"
            onChange={(e) => alterar((copia) => { copia.notas[c.n] = e.target.value; })} />
        </div>
      )}
    </div>
  );
}

/** Contador de caracteres com aviso perto do limite e estouro. */
function Contador({ atual, max }: { atual: number; max?: number }) {
  const classe = max && atual >= max ? " over" : max && atual >= max * 0.9 ? " perto" : "";
  return <span className={"cont" + classe}>{atual}{max ? " / " + max : " caracteres · sem limite"}</span>;
}

/* ══════════ seção Interno ══════════ */

function SecaoInterno({ r, alterar }: { r: Rascunho; alterar: (fn: (r: Rascunho) => void, rapido?: boolean) => void }) {
  const i = r.interno;
  const candidatura = porId("candidaturas", r.ref);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dias = (s: string) => {
    if (!s) return "";
    const d = Math.round((new Date(s + "T00:00:00").getTime() - hoje.getTime()) / 864e5);
    return d === 0 ? "hoje" : d < 0 ? `${-d} d atrás` : `em ${d} d`;
  };

  /** Edita o checklist de documentos da candidatura (que vive no Painel). */
  function alterarDocsCandidatura(fn: (docs: { nome: string; ok: boolean; obs?: string }[]) => void) {
    if (!candidatura) return;
    const copia = clonar(candidatura);
    copia.docs = copia.docs || [];
    fn(copia.docs);
    salvarRegistro("candidaturas", copia);
  }

  return (
    <div id="interno">
      <div className="etapa-h"><h3>Geral</h3><span className="k">interno · não vai para a plataforma</span></div>

      <div className="bloco">
        <div className="bloco-h"><h4>Anotações gerais</h4><span className="cont">{i.anot.length} / 3000</span></div>
        <textarea maxLength={3000} style={{ minHeight: 120 }} value={i.anot}
          placeholder="ideias e pontos sobre o projeto, sem classificar"
          onChange={(e) => alterar((c) => { c.interno.anot = e.target.value; })} />
      </div>

      <div className="bloco">
        <div className="bloco-h"><h4>Agentes envolvidos</h4></div>
        <div className="prop">
          <div className="prop-l">
            <span className="eyebrow">proponente</span>
            <input type="text" value={i.prop.nome} placeholder="quem assina a inscrição"
              onChange={(e) => alterar((c) => { c.interno.prop.nome = e.target.value; })} />
          </div>
          <div className="prop-l">
            <span className="eyebrow">perfil jurídico</span>
            <select value={i.prop.perfil} onChange={(e) => alterar((c) => { c.interno.prop.perfil = e.target.value; })}>
              {PERFIS_JURIDICOS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="prop-l wide">
            <span className="eyebrow">observação</span>
            <input type="text" value={i.prop.obs} onChange={(e) => alterar((c) => { c.interno.prop.obs = e.target.value; })} />
          </div>
        </div>
        <div className="lista">
          {i.agentes.map((a, k) => (
            <div className="lin ag" key={k}>
              <input type="text" value={a.nome} placeholder="nome"
                onChange={(e) => alterar((c) => { c.interno.agentes[k].nome = e.target.value; })} />
              <select value={a.tipo} onChange={(e) => alterar((c) => { c.interno.agentes[k].tipo = e.target.value; })}>
                {["pessoa", "empresa", "coletivo"].map((t) => <option key={t}>{t}</option>)}
              </select>
              <select value={a.vinc} onChange={(e) => alterar((c) => { c.interno.agentes[k].vinc = e.target.value; })}>
                {["do coletivo", "do projeto cultural", "externo"].map((t) => <option key={t}>{t}</option>)}
              </select>
              <input type="text" value={a.papel} placeholder="papel neste formulário"
                onChange={(e) => alterar((c) => { c.interno.agentes[k].papel = e.target.value; })} />
              <button type="button" className="x" aria-label="remover"
                onClick={() => alterar((c) => { c.interno.agentes.splice(k, 1); }, true)}>×</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn sm" style={{ marginTop: 8 }}
          onClick={() => alterar((c) => { c.interno.agentes.push({ nome: "", tipo: "pessoa", vinc: "do coletivo", papel: "" }); }, true)}>
          + agente
        </button>
      </div>

      <div className="bloco">
        <div className="bloco-h">
          <h4>Cronograma interno</h4>
          <span className="cont">{i.crono.filter((c) => c.ok).length} de {i.crono.length} feitos</span>
        </div>
        <div className="lista">
          {i.crono.map((marco, k) => (
            <div className={"lin cr" + (marco.ok ? " ok" : "")} key={k}>
              <button type="button" className={"ck" + (marco.ok ? " on" : "")} aria-label="marcar feito"
                onClick={() => alterar((c) => { c.interno.crono[k].ok = !c.interno.crono[k].ok; }, true)}>
                {marco.ok ? "✓" : ""}
              </button>
              <input type="date" value={marco.data || ""} onChange={(e) => alterar((c) => { c.interno.crono[k].data = e.target.value; })} />
              <input type="text" value={marco.m} placeholder="o que fechar até essa data"
                onChange={(e) => alterar((c) => { c.interno.crono[k].m = e.target.value; })} />
              <span className="dias">{marco.ok ? "feito" : dias(marco.data)}</span>
              <button type="button" className="x" aria-label="remover"
                onClick={() => alterar((c) => { c.interno.crono.splice(k, 1); }, true)}>×</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn sm" style={{ marginTop: 8 }}
          onClick={() => alterar((c) => { c.interno.crono.push({ data: "", m: "", ok: false }); }, true)}>+ marco</button>
      </div>

      {candidatura && (
        <div className="bloco cand">
          <div className="bloco-h">
            <h4>Documentos da candidatura</h4>
            <span className="q">checklist do Painel, editada daqui</span>
            <span className="cont">{(candidatura.docs || []).filter((d) => d.ok).length} de {(candidatura.docs || []).length} prontos</span>
          </div>
          <div className="lista">
            {(candidatura.docs || []).map((d, k) => (
              <div className={"lin dc" + (d.ok ? " ok" : "")} key={k}>
                <button type="button" className={"ck" + (d.ok ? " on" : "")} aria-label="marcar pronto"
                  onClick={() => alterarDocsCandidatura((docs) => { docs[k].ok = !docs[k].ok; })}>
                  {d.ok ? "✓" : ""}
                </button>
                <input type="text" value={d.nome} placeholder="documento"
                  onChange={(e) => alterarDocsCandidatura((docs) => { docs[k].nome = e.target.value; })} />
                <input type="text" value={d.obs || ""} placeholder="observação"
                  onChange={(e) => alterarDocsCandidatura((docs) => { docs[k].obs = e.target.value; })} />
                <button type="button" className="x" aria-label="remover"
                  onClick={() => alterarDocsCandidatura((docs) => { docs.splice(k, 1); })}>×</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn sm" style={{ marginTop: 8 }}
            onClick={() => alterarDocsCandidatura((docs) => { docs.push({ nome: "", ok: false, obs: "" }); })}>+ documento</button>
        </div>
      )}

      <div className="bloco">
        <div className="bloco-h">
          <h4>{candidatura ? "Outros documentos (só deste rascunho)" : "Documentos necessários"}</h4>
          <span className="cont">{i.docs.filter((d) => d.ok).length} de {i.docs.length} garantidos</span>
        </div>
        <div className="lista">
          {i.docs.map((d, k) => (
            <div className={"lin dc" + (d.ok ? " ok" : "")} key={k}>
              <button type="button" className={"ck" + (d.ok ? " on" : "")} aria-label="marcar garantido"
                onClick={() => alterar((c) => { c.interno.docs[k].ok = !c.interno.docs[k].ok; }, true)}>
                {d.ok ? "✓" : ""}
              </button>
              <input type="text" value={d.nome} placeholder="documento (declaração, certidão, ficha…)"
                onChange={(e) => alterar((c) => { c.interno.docs[k].nome = e.target.value; })} />
              <input type="text" value={d.obs || ""} placeholder="observação"
                onChange={(e) => alterar((c) => { c.interno.docs[k].obs = e.target.value; })} />
              <button type="button" className="x" aria-label="remover"
                onClick={() => alterar((c) => { c.interno.docs.splice(k, 1); }, true)}>×</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn sm" style={{ marginTop: 8 }}
          onClick={() => alterar((c) => { c.interno.docs.push({ nome: "", ok: false, obs: "" }); }, true)}>+ documento</button>
      </div>
    </div>
  );
}
