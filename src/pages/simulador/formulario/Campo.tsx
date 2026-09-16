/* Um campo da plataforma no editor: cabeçalho com rótulo, obrigatório, código,
   status (rascunho → revisado → colado), copiar e nota — e o corpo delegado ao
   componente do tipo (campos/*). */
import { statusEfetivo, textoDe } from "../../../lib/simulador/motor";
import { copiarComAviso, toast } from "../../../components/Toast";
import { ROTULO_STATUS_CAMPO, type StatusCampo } from "../../../types";
import type { PropsCampo } from "./tipos";
import { CampoTexto } from "./campos/CampoTexto";
import { CampoTextoLongo } from "./campos/CampoTextoLongo";
import { CampoData, CampoSelecao } from "./campos/CampoSelecao";
import { CampoOpcaoUnica } from "./campos/CampoOpcaoUnica";
import { CampoMultiplaEscolha } from "./campos/CampoMultiplaEscolha";
import { CampoRepetivel } from "./campos/CampoRepetivel";
import { CampoDocumentos } from "./campos/CampoDocumentos";
import { CampoAnexo } from "./campos/CampoAnexo";
import { PlanilhaOrcamento } from "../orcamento/PlanilhaOrcamento";
import { ResumoOrcamento } from "../orcamento/ResumoOrcamento";

/** O componente de corpo de cada tipo de campo do motor. */
function CorpoDoCampo(props: PropsCampo) {
  switch (props.c.t) {
    case "txt": return <CampoTexto {...props} />;
    case "ta": return <CampoTextoLongo {...props} />;
    case "sel": return <CampoSelecao {...props} />;
    case "date": return <CampoData {...props} />;
    case "rad": return <CampoOpcaoUnica {...props} />;
    case "chk": return <CampoMultiplaEscolha {...props} />;
    case "rep": return <CampoRepetivel {...props} />;
    case "docs": return <CampoDocumentos {...props} />;
    case "anexo": return <CampoAnexo {...props} />;
    case "orc": return <PlanilhaOrcamento r={props.r} alterar={props.alterar} />;
    case "orcresumo": return <ResumoOrcamento r={props.r} alterar={props.alterar} />;
    default: return null;
  }
}

export function Campo({ r, c, alterar }: PropsCampo) {
  const st = statusEfetivo(r, c);

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
            onClick={() => void copiarComAviso(textoDe(c, r.valores[c.n], r), "Campo copiado")}>Copiar</button>
          <button type="button" className="btn sm quiet" onClick={alternarNota}>Nota</button>
        </span>
      </div>
      {c.dica && <p className="instr">{c.dica}</p>}
      <CorpoDoCampo r={r} c={c} alterar={alterar} />
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
