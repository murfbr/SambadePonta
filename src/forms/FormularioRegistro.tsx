/* O modal "Novo / Editar" de registros do Painel. Lê a especificação da
   entidade (forms/especificacoes) e desenha um CampoDoFormulario por campo.
   Abre pelo estado global de edição (store/edicao): qualquer tela chama
   abrirNovo()/abrirEdicao() e o modal aparece. */
import { useMemo, useState } from "react";
import { Modal, RodapeModal } from "../components/Modal";
import { ModalExclusao } from "../components/ModalExclusao";
import { toast } from "../components/Toast";
import { CampoDoFormulario } from "./CampoDoFormulario";
import { ENTIDADES } from "./especificacoes";
import { fecharEdicao, usarEdicao } from "../store/edicao";
import { usarCentral, obterEstado } from "../store/central";
import { porId, salvarRegistro } from "../store/mutacoes";
import { impactoExclusao, type ImpactoExclusao } from "../store/vinculos";
import { clonar, uid } from "../utils";
import type { ColecaoPainel } from "../types";

/** Monta o modal só quando algo abriu a edição (o `key` zera o estado a cada abertura). */
export function FormularioRegistro() {
  const { aberto } = usarEdicao();
  if (!aberto) return null;
  return <ModalDeRegistro key={aberto.chave + ":" + (aberto.id || "novo")} />;
}

function ModalDeRegistro() {
  const { aberto } = usarEdicao();
  const { painel } = usarCentral();
  const spec = ENTIDADES[aberto!.chave];
  const editando = aberto!.id != null;

  // Estado local do formulário: começa do registro (edição) ou dos padrões (novo).
  // Selects sem valor assumem a primeira opção, como o <select> nativo do artefato.
  const [valores, setValores] = useState<Record<string, unknown>>(() => {
    const base: Record<string, unknown> = editando
      ? (clonar(porId(spec.colecao, aberto!.id!) || {}) as Record<string, unknown>)
      : { ...(spec.padrao || {}), ...(aberto!.prefill || {}) };
    for (const c of spec.campos) {
      if (base[c.chave] != null && base[c.chave] !== "") continue;
      if (c.tipo === "select") base[c.chave] = (c.fonte as string[])[0];
      else if (c.tipo === "opts") base[c.chave] = (c.fonte as [string, string][])[0]?.[0] ?? "";
      else if (c.tipo === "ref") base[c.chave] = (obterEstado().painel[c.fonte as ColecaoPainel][0] as { id?: string } | undefined)?.id ?? "";
    }
    return base;
  });

  // Opções do campo "origem" (vínculo polimórfico da tarefa).
  const opcoesOrigem = useMemo(() => {
    const nomeEdital = (c: { editalId: string }) => porId("editais", c.editalId)?.nome || "?";
    return [
      ["", "— sem vínculo"] as [string, string],
      ...painel.projetos.map((p) => ["proj:" + p.id, "Projeto · " + p.nome] as [string, string]),
      ...painel.reunioes.map((r) => ["reuniao:" + r.id, "Reunião · " + (r.titulo || r.data || r.id)] as [string, string]),
      ...painel.candidaturas.map((c) => ["cand:" + c.id, "Candidatura · " + nomeEdital(c)] as [string, string]),
    ];
  }, [painel]);

  // Exclusão em duas etapas: primeiro o impacto nos vínculos, depois o destino.
  const [impacto, setImpacto] = useState<ImpactoExclusao | null>(null);

  function salvar() {
    const registro: Record<string, unknown> = editando
      ? { ...clonar(porId(spec.colecao, aberto!.id!) || {}), ...valores }
      : { id: uid(spec.prefixoId), ...(spec.padrao || {}), ...valores };
    spec.depois?.(registro);
    salvarRegistro(spec.colecao, registro as never);
    fecharEdicao();
    toast("Salvo");
  }

  return (
    <Modal titulo={(editando ? "Editar: " : "Novo: ") + spec.titulo} aoFechar={fecharEdicao}>
      {spec.campos.map((c) => (
        <div className="field" key={c.chave}>
          <label htmlFor={"campo-" + c.chave}>{c.rotulo}</label>
          <CampoDoFormulario
            campo={c}
            valor={valores[c.chave]}
            definir={(valor) => setValores((v) => ({ ...v, [c.chave]: valor }))}
            opcoesOrigem={opcoesOrigem}
          />
        </div>
      ))}
      <RodapeModal>
        {editando && (
          <button className="del" onClick={() => setImpacto(impactoExclusao(aberto!.chave, aberto!.id!))}>
            Excluir
          </button>
        )}
        <span className="sp">
          <button className="btn ghost" onClick={fecharEdicao}>Cancelar</button>
          <button className="btn" onClick={salvar}>Salvar</button>
        </span>
      </RodapeModal>

      {impacto && (
        <ModalExclusao
          titulo={spec.titulo}
          nome={String(valores.nome || valores.titulo || "")}
          impacto={impacto}
          aoFechar={() => setImpacto(null)}
          aoExcluir={(destino) => {
            impacto.excluir(destino);
            setImpacto(null);
            fecharEdicao();
            toast("Excluído");
          }}
        />
      )}
    </Modal>
  );
}
