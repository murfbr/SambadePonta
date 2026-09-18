/* Plataformas: a parte de conhecimento do Simulador — como cada sistema funciona
   (arquitetura, armadilhas) e a tabela do que já está mapeado. Formulários novos
   entram pelo "Importar formulário", direto no banco, sem deploy. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { excluirFormulario } from "../../store/mutacoes";
import { PLATAFORMAS, nomePlataforma, registroCompleto } from "../../data";
import { ModalImportarFormulario } from "./ModalImportarFormulario";

export function Plataformas() {
  const { rascunhos, formularios } = usarCentral(); // re-render quando o banco muda
  const [importando, setImportando] = useState(false);
  const [confirmandoExcluir, setConfirmandoExcluir] = useState<string | null>(null);
  const registro = registroCompleto();
  const rascunhosNo = (formId: string) =>
    Object.values(rascunhos).filter((r) => r.form === formId).length;

  return (
    <>
      <div className="shead">
        <div>
          <h2>Plataformas</h2>
          <p className="sub">Como cada sistema funciona e quais formulários já estão mapeados. É a parte de conhecimento do Simulador.</p>
        </div>
        <div className="acts">
          <button className="btn" onClick={() => setImportando(true)}>Importar formulário</button>
        </div>
      </div>

      <div className="plats">
        {PLATAFORMAS.map((p) => (
          <div className="plat-card" key={p.id}>
            <h3>{p.nome}</h3>
            <p className="org">{p.orgao}</p>
            <dl className="kv">
              <dt>Arquitetura</dt><dd>{p.arq}</dd>
              <dt>Porta de entrada</dt><dd>{p.porta}</dd>
              <dt>Códigos de campo</dt><dd>{p.codigos}</dd>
              <dt>Limites</dt><dd>{p.limites}</dd>
              <dt>Anexos</dt><dd>{p.anexos}</dd>
            </dl>
            <div className="arm"><b>Armadilhas:</b> {p.armadilhas}</div>
          </div>
        ))}
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>Formulários mapeados</div>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Formulário</th><th>Plataforma</th><th>Etapas</th><th>Campos</th>
              <th>Extraído em</th><th>Mapeamento</th><th>No Simulador</th><th>Peças especiais</th>
            </tr>
          </thead>
          <tbody>
            {registro.map((x) => (
              <tr key={x.id}>
                <td>{x.nome}</td>
                <td>{nomePlataforma(x.plataforma)}</td>
                <td className="num">{x.etapas}</td>
                <td className="num">{x.campos ?? "—"}</td>
                <td>{x.extraido}</td>
                <td><span className={"chip " + (x.mapeamento === "atual" ? "ok" : "at")}>{x.mapeamento}</span></td>
                <td>
                  {x.migrado
                    ? <>
                      <span className="chip ok">migrado</span>
                      {/* Excluir só aparece sem rascunhos no formulário (e vai para a lixeira). */}
                      {formularios[x.id] && rascunhosNo(x.id) === 0 && (
                        <button
                          className="lnk-excluir"
                          onClick={() => {
                            if (confirmandoExcluir !== x.id) { setConfirmandoExcluir(x.id); return; }
                            excluirFormulario(x.id);
                            setConfirmandoExcluir(null);
                          }}
                        >
                          {confirmandoExcluir === x.id ? "confirmar?" : "excluir"}
                        </button>
                      )}
                    </>
                    : <a href={x.antigo} target="_blank" rel="noopener noreferrer">artefato antigo</a>}
                </td>
                <td>{x.especiais || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {importando && <ModalImportarFormulario aoFechar={() => setImportando(false)} />}
    </>
  );
}
