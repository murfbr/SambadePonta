/* Trocar com o Claude: mão dupla, sempre em texto.
   Para fora: marca fichas (e as regras gerais) e copia o bloco de contexto que
   abre uma conversa de escrita. Para dentro: cola o bloco que o Claude devolveu
   e o site cria/atualiza fichas, regras (como "a confirmar") e julgamentos. */
import { useState } from "react";
import { usarCentral, obterEstado } from "../../store/central";
import { salvarFicha, salvarJulgamento, salvarRegra } from "../../store/mutacoes";
import {
  TIPOS_FICHA, entidadePorId, entidades, fichaDe, nomeDaEntidade, temFicha,
} from "../../lib/contexto/consultas";
import { lerBloco, montarBloco, type BlocoLido } from "../../lib/contexto/bloco";
import { Modal, RodapeModal } from "../../components/Modal";
import { copiarComAviso, toast } from "../../components/Toast";
import type { TipoFicha } from "../../types";

export function TelaTrocar() {
  usarCentral();
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [comGerais, setComGerais] = useState(true);
  const [entrada, setEntrada] = useState("");
  const [pendente, setPendente] = useState<BlocoLido | null>(null);

  const bloco = montarBloco([...selecionadas], comGerais);

  const alternar = (id: string, marcado: boolean) => {
    const novo = new Set(selecionadas);
    if (marcado) novo.add(id); else novo.delete(id);
    setSelecionadas(novo);
  };

  function importar() {
    const lido = lerBloco(entrada);
    if (!lido.fichas.length && !lido.regras.length && !lido.julgamentos.length) {
      toast("Não reconheci nada no bloco");
      return;
    }
    setPendente(lido);
  }

  /** Aplica o bloco confirmado: fichas mesclam, regras não duplicam, julgamentos atualizam. */
  function aplicar(lido: BlocoLido) {
    const unicos = (a: string[]) => [...new Set(a)];
    const unicosPor = <T,>(a: T[], chave: (x: T) => string) => {
      const vistos = new Set<string>();
      return a.filter((x) => { const k = chave(x); if (vistos.has(k)) return false; vistos.add(k); return true; });
    };
    lido.fichas.forEach((f) => {
      if (!entidadePorId(f.id)) return; // ficha de id que não existe no Painel é ignorada
      const atual = fichaDe(f.id);
      salvarFicha({
        id: f.id, tipo: atual.tipo,
        posicionamento: f.posicionamento || atual.posicionamento,
        argumentos: unicos([...atual.argumentos, ...f.argumentos]),
        julgador: unicos([...(atual.julgador || []), ...f.julgador]),
        vocabulario: unicosPor([...atual.vocabulario, ...f.vocabulario], (v) => v.usar + "|" + v.evitar),
        usados: unicosPor([...atual.usados, ...f.usados], (u) => u.texto + "|" + u.onde + "|" + u.quando),
        cuidados: f.cuidados || atual.cuidados,
      });
    });
    const existentes = Object.values(obterEstado().regras);
    lido.regras.forEach((r) => {
      if (existentes.some((x) => x.texto === r.texto)) return;
      salvarRegra(r);
    });
    lido.julgamentos.forEach((j) => {
      const atual = obterEstado().julgamentos[j.id];
      salvarJulgamento(atual ? { ...atual, ...j, id: j.id } : j);
    });
    setPendente(null);
    setEntrada("");
    toast("Bloco importado");
  }

  const grupo = (tipo: TipoFicha) => (
    <span style={{ display: "contents" }} key={tipo}>
      <div className="eyebrow" style={{ padding: "8px 0 2px" }}>{TIPOS_FICHA[tipo]}</div>
      {entidades(tipo).map((f) => (
        <label key={f.id}>
          <input type="checkbox" checked={selecionadas.has(f.id)} onChange={(e) => alternar(f.id, e.target.checked)} />
          {f.nome}{!temFicha(f.id) && <> <span className="vazio">(sem ficha)</span></>}
        </label>
      ))}
    </span>
  );

  return (
    <>
      <div className="shead">
        <div>
          <h2>Trocar com o Claude</h2>
          <p className="sub">Mão dupla, sempre em texto. Para fora: o bloco de contexto que abre uma conversa de escrita. Para dentro: o bloco que o Claude devolve depois de ler os materiais.</p>
        </div>
      </div>

      <div className="troca">
        <div className="pan">
          <h3 style={{ fontSize: 16 }}>Para fora: montar o contexto</h3>
          <label>
            <input type="checkbox" checked={comGerais} onChange={(e) => setComGerais(e.target.checked)} />
            <b>Regras gerais</b>
          </label>
          {grupo("artista")}{grupo("projeto")}{grupo("edital")}
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button className="btn primary" onClick={() => void copiarComAviso(bloco, "Bloco copiado")}>Copiar bloco</button>
            <span style={{ fontSize: 12.5, color: "var(--ink3)", alignSelf: "center" }}>cole no início da conversa de escrita</span>
          </div>

          <h3 style={{ fontSize: 16, marginTop: 26 }}>Para dentro: colar o que o Claude devolveu</h3>
          <ol className="passos">
            <li>Numa conversa do Project, junte os materiais (edital, parecer, portfólio) e o md de orientação.</li>
            <li>O Claude devolve um bloco no mesmo formato ao lado.</li>
            <li>Cole aqui: fichas, regras e julgamentos são criados ou atualizados (as regras novas entram como "a confirmar").</li>
          </ol>
          <textarea className="entrada" value={entrada} onChange={(e) => setEntrada(e.target.value)}
            placeholder={'## FICHA edital ed7 · Nome do edital\nposicionamento: ...\n- JULGADOR ...\n- REGRA [edital ed7] [prioridade] ... | fonte: edital, item 5.2'} />
          <button className="btn" style={{ marginTop: 8 }} onClick={importar}>Importar bloco</button>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            bloco gerado ({selecionadas.size} ficha{selecionadas.size === 1 ? "" : "s"}{comGerais ? " + gerais" : ""})
          </div>
          <pre className="saida">{bloco}</pre>
        </div>
      </div>

      {pendente && (
        <Modal titulo="Importar bloco" aoFechar={() => setPendente(null)}>
          <p className="hint">
            Vai criar ou atualizar: {pendente.fichas.length} ficha(s), {pendente.regras.length} regra(s),{" "}
            {pendente.julgamentos.length} julgamento(s). Fichas de ids que não existem no Painel são ignoradas.
            Regras novas entram como "a confirmar".
          </p>
          <ul className="itens" style={{ maxHeight: "40vh", overflow: "auto" }}>
            {pendente.fichas.map((f, i) => (
              <li key={"f" + i}><span className="k">F</span><span>{f.tipo} {f.id}{!entidadePorId(f.id) && " (ignorada: id não existe no Painel)"}</span></li>
            ))}
            {pendente.regras.map((r, i) => <li key={"r" + i}><span className="k">R</span><span>{r.texto}</span></li>)}
            {pendente.julgamentos.map((j, i) => <li key={"j" + i}><span className="k">J</span><span>{j.id} · {nomeDaEntidade(j.edital)}</span></li>)}
          </ul>
          <RodapeModal>
            <span className="sp">
              <button className="btn quiet" onClick={() => setPendente(null)}>Cancelar</button>
              <button className="btn primary" onClick={() => aplicar(pendente)}>Importar</button>
            </span>
          </RodapeModal>
        </Modal>
      )}
    </>
  );
}
