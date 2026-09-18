/* Lixeira: tudo o que foi excluído nos últimos 30 dias, com restaurar,
   excluir de vez e esvaziar. Ao abrir a tela, itens além dos 30 dias caem. */
import { useEffect, useState } from "react";
import { usarCentral } from "../../store/central";
import {
  esvaziarLixeira, excluirDeVez, limparLixeiraAntiga, porId, restaurarDaLixeira,
} from "../../store/mutacoes";
import { CabecalhoSecao } from "../../components/CabecalhoSecao";
import { toast } from "../../components/Toast";
import { ROTULO_COLECAO, type ItemLixeira } from "../../types";
import { relativo } from "../../utils";

const ROTULO_ORIGEM: Record<string, string> = {
  ...ROTULO_COLECAO,
  rascunhos: "Rascunho do Simulador", regras: "Regra do Contexto",
  julgamentos: "Julgamento", formularios: "Formulário do Simulador",
};

/** Nome de exibição de um item, seja de que coleção for. */
function nomeDoItem(item: ItemLixeira): string {
  const x = item as Record<string, unknown>;
  if (typeof x.nome === "string" && x.nome) return x.nome;
  if (typeof x.titulo === "string" && x.titulo) return x.titulo;
  if (item._de === "candidaturas") {
    const p = porId("projetos", String(x.projetoId || ""));
    const e = porId("editais", String(x.editalId || ""));
    if (p || e) return (p?.nome || "?") + " → " + (e?.nome || "?");
  }
  if (typeof x.texto === "string" && x.texto) return String(x.texto).slice(0, 80);
  if (item._de === "julgamentos" && x.ano) return "Julgamento " + x.ano;
  return item.id;
}

export function Lixeira() {
  const { lixeira } = usarCentral();
  const [confirmando, setConfirmando] = useState<string | null>(null); // chave ou "__esvaziar"

  // Retenção: ao abrir a tela, o que passou de 30 dias cai de vez.
  useEffect(() => { limparLixeiraAntiga(); }, []);

  const itens = Object.entries(lixeira)
    .sort(([, a], [, b]) => String(b._apagadoEm).localeCompare(String(a._apagadoEm)));

  const restaurar = (chave: string) => {
    if (restaurarDaLixeira(chave)) toast("Restaurado");
    else toast("Não deu para restaurar: já existe um registro com esse id na origem");
  };

  const quando = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <CabecalhoSecao titulo="Lixeira" sub="o que foi excluído fica aqui por 30 dias — dá para restaurar ou apagar de vez">
        {itens.length > 0 && (
          <button
            className={"btn sm " + (confirmando === "__esvaziar" ? "perigo" : "ghost")}
            onClick={() => {
              if (confirmando !== "__esvaziar") { setConfirmando("__esvaziar"); return; }
              esvaziarLixeira();
              setConfirmando(null);
              toast("Lixeira esvaziada");
            }}
          >
            {confirmando === "__esvaziar" ? "Confirmar: apagar tudo de vez" : "Esvaziar lixeira"}
          </button>
        )}
      </CabecalhoSecao>

      {!itens.length && (
        <div className="vazio-msg">
          ✓ Lixeira vazia. Tudo o que for excluído no site cai aqui, com 30 dias para restaurar.
        </div>
      )}

      {itens.map(([chave, item]) => (
        <div className="lix-item" key={chave}>
          <span className="badge b-type">{ROTULO_ORIGEM[item._de] || item._de}</span>
          <span className="t" title={item.id}>{nomeDoItem(item)}</span>
          <span className="quando" title={quando(item._apagadoEm)}>
            {relativo(item._apagadoEm)}{item._apagadoPor ? " · " + item._apagadoPor : ""}
          </span>
          <button className="btn sm" onClick={() => restaurar(chave)}>Restaurar</button>
          <button
            className={"btn sm " + (confirmando === chave ? "perigo" : "ghost")}
            onClick={() => {
              if (confirmando !== chave) { setConfirmando(chave); return; }
              excluirDeVez(chave);
              setConfirmando(null);
            }}
          >
            {confirmando === chave ? "Confirmar" : "Excluir de vez"}
          </button>
        </div>
      ))}
    </>
  );
}
