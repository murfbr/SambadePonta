/* Confirmação de exclusão com o impacto nos vínculos: lista o que está ligado
   ao registro e oferece excluir levando junto ou desvinculando (mantém os
   registros, só limpa a ligação). Sem vínculos, é uma confirmação simples. */
import { Modal, RodapeModal } from "./Modal";
import type { DestinoVinculos, ImpactoExclusao } from "../store/vinculos";

interface Props {
  /** Título da entidade ("Projeto", "Edital"...). */
  titulo: string;
  /** Nome do registro, quando houver. */
  nome?: string;
  impacto: ImpactoExclusao;
  aoFechar: () => void;
  aoExcluir: (destino: DestinoVinculos) => void;
}

export function ModalExclusao({ titulo, nome, impacto, aoFechar, aoExcluir }: Props) {
  const temVinculos = impacto.vinculos.length > 0;
  return (
    <Modal titulo={"Excluir " + titulo.toLowerCase() + (nome ? ": " + nome : "") + "?"} aoFechar={aoFechar}>
      {temVinculos ? (
        <>
          <p className="hint" style={{ marginTop: 0 }}>Este registro tem vínculos:</p>
          <ul className="import-lista">
            {impacto.vinculos.map((v) => <li key={v}>{v}</li>)}
          </ul>
          <p className="hint">
            <b>Levar junto</b> apaga também o que está listado.{" "}
            <b>Desvincular</b> mantém esses registros, só limpando a ligação.
          </p>
        </>
      ) : (
        <p className="hint" style={{ marginTop: 0 }}>Nenhum registro do Painel depende deste.</p>
      )}
      {impacto.notas.map((nota) => <p className="hint" key={nota}>{nota}</p>)}
      <RodapeModal>
        <span className="sp">
          <button className="btn ghost" onClick={aoFechar}>Cancelar</button>
          {temVinculos && (
            <button className="btn ghost" onClick={() => aoExcluir("desvincular")}>Excluir e desvincular</button>
          )}
          <button className="btn perigo" onClick={() => aoExcluir("junto")}>
            {temVinculos ? "Excluir levando junto" : "Excluir"}
          </button>
        </span>
      </RodapeModal>
    </Modal>
  );
}
