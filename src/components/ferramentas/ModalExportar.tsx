/* Modal de exportação: o pacote .json completo (backup que restaura tudo) e
   cada coleção do Painel como planilha .csv (Excel/Google, relações pelo nome)
   ou .json (registro completo, reimportável). */
import { Modal, RodapeModal } from "../Modal";
import { toast } from "../Toast";
import { usarCentral } from "../../store/central";
import { exportarTudo } from "../../store/importarExportar";
import { exportarColecaoCsv, exportarColecaoJson } from "../../store/planilha";
import { COLECOES_PAINEL, ROTULO_COLECAO } from "../../types";

export function ModalExportar({ aoFechar }: { aoFechar: () => void }) {
  const { painel, rascunhos, fichas, regras, julgamentos } = usarCentral();
  const docsContexto = Object.keys(fichas).length + Object.keys(regras).length + Object.keys(julgamentos).length;

  return (
    <Modal titulo="Exportar dados" aoFechar={aoFechar} largo>
      <div className="export-tudo">
        <div>
          <b>Backup completo (.json)</b>
          <p className="hint" style={{ margin: "2px 0 0" }}>
            Painel inteiro + {Object.keys(rascunhos).length} rascunho(s) do Simulador
            + {docsContexto} doc(s) do Contexto. É o arquivo que restaura tudo pelo Importar.
          </p>
        </div>
        <button className="btn" onClick={() => { exportarTudo(); toast("Backup completo gerado"); }}>
          ⤓ Baixar pacote
        </button>
      </div>

      <p className="hint" style={{ margin: "14px 0 8px" }}>
        Por coleção: <b>CSV</b> abre no Excel/Google Planilhas (bom pra revisar e compartilhar);{" "}
        <b>JSON</b> guarda o registro completo e volta pelo Importar sem perder nada.
      </p>
      <div className="tbl-wrap">
        <table>
          <tbody>
            {COLECOES_PAINEL.map((c) => (
              <tr key={c}>
                <td><b>{ROTULO_COLECAO[c]}</b></td>
                <td className="muted" style={{ whiteSpace: "nowrap" }}>{painel[c].length} registro(s)</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="btn ghost sm" disabled={!painel[c].length}
                    onClick={() => { exportarColecaoCsv(c); toast("Planilha de " + ROTULO_COLECAO[c] + " gerada"); }}>
                    ⤓ CSV
                  </button>{" "}
                  <button className="btn ghost sm" disabled={!painel[c].length}
                    onClick={() => { exportarColecaoJson(c); toast(ROTULO_COLECAO[c] + " exportado em .json"); }}>
                    ⤓ JSON
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RodapeModal>
        <span className="sp"><button className="btn ghost" onClick={aoFechar}>Fechar</button></span>
      </RodapeModal>
    </Modal>
  );
}
