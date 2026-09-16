/* Seção Interno do rascunho — nada disso vai para a plataforma: anotações,
   proponente e agentes, cronograma interno, documentos da candidatura (editados
   daqui, mas gravados no Painel) e documentos só deste rascunho. */
import { porId, salvarRegistro } from "../../../store/mutacoes";
import { PERFIS_JURIDICOS } from "../../../data";
import { clonar } from "../../../utils";
import type { Rascunho } from "../../../types";
import type { Alterar } from "./tipos";

export function SecaoInterno({ r, alterar }: { r: Rascunho; alterar: Alterar }) {
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
