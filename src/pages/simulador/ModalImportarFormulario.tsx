/* Importar formulário: cola a definição JSON (extraída da plataforma, ou
   escrita com o Claude), o validador confere a estrutura e a definição vai
   para o banco — formulário novo entra para todo mundo, sem deploy. */
import { useState } from "react";
import { Modal, RodapeModal } from "../../components/Modal";
import { toast } from "../../components/Toast";
import { salvarFormulario } from "../../store/mutacoes";
import { formularioDe, nomePlataforma } from "../../data";
import { validarFormulario, type ValidacaoFormulario } from "../../lib/simulador/validarFormulario";

export function ModalImportarFormulario({ aoFechar }: { aoFechar: () => void }) {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<ValidacaoFormulario | null>(null);

  const pronto = Boolean(resultado?.formulario && !resultado.erros.length);
  const existente = resultado?.formulario ? formularioDe(resultado.formulario.id) : undefined;

  function importar() {
    if (!resultado?.formulario) return;
    salvarFormulario(resultado.formulario);
    toast(`Formulário "${resultado.formulario.nome}" importado`);
    aoFechar();
  }

  return (
    <Modal titulo="Importar formulário" aoFechar={aoFechar} largo>
      <p className="hint" style={{ marginTop: 0 }}>
        Cole a definição JSON de um formulário (etapas → blocos → campos). O site confere a
        estrutura antes de gravar; importado, ele aparece para todo mundo na hora — sem precisar
        de nova versão do site. Para reimportar um formulário existente, use o mesmo <span className="mono">id</span>.
      </p>
      <textarea
        className="bloco-edt" rows={10} value={texto}
        placeholder='{ "id": "dc-140", "nome": "…", "plataforma": "dc", "etapas": [ { "id": "e1", "nome": "…", "blocos": [ { "t": "…", "campos": [ … ] } ] } ] }'
        onChange={(e) => { setTexto(e.target.value); setResultado(null); }}
      />

      {resultado && (
        <>
          {pronto && resultado.resumo && (
            <p className="hint">
              ✓ <b>{resultado.resumo.nome}</b> · {nomePlataforma(resultado.resumo.plataforma)} ·{" "}
              {resultado.resumo.etapas} etapa(s) · {resultado.resumo.campos} campo(s) ·{" "}
              id <span className="mono">{resultado.resumo.id}</span>
            </p>
          )}
          {pronto && existente && (
            <p className="hint">
              <b>Atenção:</b> já existe um formulário com esse id ("{existente.nome}") — importar vai
              sobrescrevê-lo, e os rascunhos dele passam a usar a nova definição.
            </p>
          )}
          {resultado.erros.length > 0 && (
            <ul className="import-lista">
              {resultado.erros.map((e, i) => <li key={i} className="erro-import">{e}</li>)}
            </ul>
          )}
          {resultado.avisos.length > 0 && (
            <ul className="import-lista">
              {resultado.avisos.map((a, i) => <li key={i}>⚠ {a}</li>)}
            </ul>
          )}
        </>
      )}

      <RodapeModal>
        <span className="sp">
          <button className="btn ghost" onClick={aoFechar}>Cancelar</button>
          {pronto
            ? <button className="btn" onClick={importar}>{existente ? "Sobrescrever formulário" : "Importar formulário"}</button>
            : <button className="btn" disabled={!texto.trim()} onClick={() => setResultado(validarFormulario(texto))}>Conferir</button>}
        </span>
      </RodapeModal>
    </Modal>
  );
}
