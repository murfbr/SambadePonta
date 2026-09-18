/* Transferência: a hora de colar na plataforma oficial. Só os campos com
   conteúdo, na ordem do site, um de cada vez — copiar, marcar como colado
   e seguir para o próximo. */
import { useState, type ReactNode } from "react";
import { salvarRascunho } from "../../store/mutacoes";
import { irParaAba } from "../../store/navegacao";
import { formularioDe } from "../../data";
import {
  campos, statusEfetivo, temValor, textoDe, visivel, type CampoAchatado,
} from "../../lib/simulador/motor";
import { copiarComAviso } from "../../components/Toast";
import { clonar } from "../../utils";
import { ROTULO_STATUS_CAMPO, type Rascunho } from "../../types";

/** Campos preenchidos e visíveis, na ordem do formulário. */
const listaTransferivel = (r: Rascunho): CampoAchatado[] =>
  campos(r.form).filter((c) => c.t !== "orcresumo" && visivel(c, r.valores) && temValor(r.valores[c.n]));

export function Transferencia({ rascunho: r }: { rascunho: Rascunho }) {
  const f = formularioDe(r.form);
  const lista = listaTransferivel(r);
  const [indice, setIndice] = useState(0);
  const i = Math.min(indice, Math.max(0, lista.length - 1));
  const colados = lista.filter((c) => statusEfetivo(r, c) === "col").length;

  // A definição vem do banco; sem ela ainda, não há o que transferir.
  if (!f) return <div className="vazio-msg">abrindo os formulários do banco…</div>;

  async function copiarEMarcar() {
    const c = lista[i];
    await copiarComAviso(textoDe(c, r.valores[c.n], r), "Copiado e marcado como colado");
    const copia = clonar(r);
    copia.status[c.n] = "col";
    salvarRascunho(copia);
    // pula para o próximo campo ainda não colado
    const proximo = lista.findIndex((x, k) => k > i && statusEfetivo(copia, x) !== "col");
    if (proximo >= 0) setIndice(proximo);
  }

  const cabecalho = (
    <div className="shead">
      <div>
        <h2>Transferência</h2>
        <p className="sub">Para a hora de colar na plataforma oficial. Só os campos com conteúdo, na ordem do site, um de cada vez.</p>
      </div>
      <div className="acts">
        <span className="eyebrow" style={{ alignSelf: "center" }}>{r.nome} · {f.nome}</span>
        <button className="btn sm" onClick={() => irParaAba("formulario")}>← Formulário</button>
      </div>
    </div>
  );

  if (!lista.length) {
    return <>{cabecalho}<div className="vazio-msg">Nenhum campo preenchido ainda neste rascunho.</div></>;
  }

  const atual = lista[i];
  const valorTexto = textoDe(atual, r.valores[atual.n], r);
  const st = statusEfetivo(r, atual);

  // Lista lateral com separadores por etapa.
  const itensLista: ReactNode[] = [];
  let etapaAnterior = -1;
  lista.forEach((c, k) => {
    if (c.ei !== etapaAnterior) {
      etapaAnterior = c.ei;
      itensLista.push(<div className="et" key={"et" + c.ei}>{c.etapa.nome}</div>);
    }
    const stc = statusEfetivo(r, c);
    itensLista.push(
      <button key={c.n} className={k === i ? "on" : ""} onClick={() => setIndice(k)}>
        <span className={"pt " + stc} />{c.l}<span className="k">{c.ei + 1}</span>
      </button>,
    );
  });

  const instrucaoTipo =
    atual.t === "sel" || atual.t === "rad" || atual.t === "chk" ? " e marque a(s) opção(ões) abaixo"
      : atual.t === "anexo" || atual.t === "docs" ? " e faça o upload dos arquivos indicados"
        : atual.t === "rep" ? " e cadastre cada item da lista"
          : atual.t === "orc" ? ": cadastre item a item, na ordem abaixo" : "";

  return (
    <>
      {cabecalho}
      <div className="tr-prog">
        <span>{colados} de {lista.length} campos colados</span>
        <div className="bar"><i className="c" style={{ width: (lista.length ? (100 * colados) / lista.length : 0) + "%" }} /></div>
      </div>
      <div className="tr-grid">
        <div className="tr-list">{itensLista}</div>
        <div className="tr-atual">
          <div className="eyebrow">{atual.etapa.nome} · {atual.bloco.t} · campo {i + 1} de {lista.length}</div>
          <h3>{atual.l}</h3>
          <div className="onde">Na plataforma, procure o campo <span className="mono">{atual.cod || atual.n}</span>{instrucaoTipo}</div>
          <div className="tr-texto">{valorTexto}</div>
          {r.notas[atual.n] && (
            <div className="nota" style={{ maxWidth: "72ch" }}><b>Nota:</b><span>{r.notas[atual.n]}</span></div>
          )}
          <div className="tr-acts">
            <button className="btn primary" onClick={() => void copiarEMarcar()}>Copiar e marcar como colado</button>
            <button className="btn" onClick={() => void copiarComAviso(valorTexto)}>Só copiar</button>
            <button className="btn quiet" onClick={() => setIndice(Math.min(lista.length - 1, i + 1))}>Pular →</button>
            <span className="cont">{valorTexto.length} caracteres · {ROTULO_STATUS_CAMPO[st]}</span>
          </div>
        </div>
      </div>
    </>
  );
}
