/* Modal de importação em dois tempos: analisa o arquivo (ou texto colado) e
   mostra a prévia ANTES de gravar qualquer coisa.
   - Pacote .json da Central: contagem do que vem dentro + escolha entre
     mesclar (não apaga nada) e substituir.
   - Planilha .csv (daqui, do Excel ou do Google): escolha da coleção, mapeamento
     coluna → campo com exemplo, e mesclar ou só adicionar. */
import { useRef, useState, type ChangeEvent } from "react";
import { Modal, RodapeModal } from "../Modal";
import { toast } from "../Toast";
import { analisarPacote, type ModoPainel, type ResumoPacote } from "../../store/importarExportar";
import {
  COLUNAS_CSV, detectarColecao, importarCsv, mapeamentoInicial,
  type AlvoColuna, type ResultadoCsv,
} from "../../store/planilha";
import { decodificarTexto, lerCsv } from "../../lib/csv";
import { COLECOES_PAINEL, ROTULO_COLECAO, type ColecaoPainel } from "../../types";

interface EstadoCsv {
  colecao: ColecaoPainel;
  cabecalho: string[];
  linhas: string[][];
  mapeamento: AlvoColuna[];
}

export function ModalImportar({ aoFechar }: { aoFechar: () => void }) {
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [colado, setColado] = useState("");
  const [erro, setErro] = useState("");
  const [resumo, setResumo] = useState<ResumoPacote | null>(null);
  const [modo, setModo] = useState<ModoPainel>("mesclar");
  const [csv, setCsv] = useState<EstadoCsv | null>(null);
  const [modoCsv, setModoCsv] = useState<"mesclar" | "adicionar">("mesclar");
  const [resultado, setResultado] = useState<ResultadoCsv | null>(null);

  function analisar(texto: string) {
    setErro("");
    const t = texto.trim();
    if (!t) { setErro("O arquivo está vazio."); return; }
    if (t[0] === "{" || t[0] === "[") {
      try { setResumo(analisarPacote(JSON.parse(t))); }
      catch (e) { setErro((e as Error).message); }
      return;
    }
    const linhas = lerCsv(t);
    if (linhas.length < 2) { setErro("A planilha precisa de uma linha de cabeçalho e ao menos uma de dados."); return; }
    const cabecalho = linhas[0];
    const colecao = detectarColecao(cabecalho);
    setCsv({ colecao, cabecalho, linhas: linhas.slice(1), mapeamento: mapeamentoInicial(colecao, cabecalho) });
  }

  function aoEscolherArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    arquivo.arrayBuffer().then((buf) => analisar(decodificarTexto(buf)));
  }

  function aplicarJson() {
    if (!resumo) return;
    try { toast(resumo.aplicar(modo)); aoFechar(); }
    catch (e) { setErro((e as Error).message); }
  }

  function aplicarCsv() {
    if (!csv) return;
    const r = importarCsv(csv.colecao, csv.mapeamento, csv.linhas, modoCsv);
    if (r.avisos.length) { setResultado(r); return; }
    toast(`${ROTULO_COLECAO[csv.colecao]}: ${r.criados} criado(s), ${r.atualizados} atualizado(s)`);
    aoFechar();
  }

  function trocarAlvo(indice: number, valor: string) {
    if (!csv) return;
    const novo: AlvoColuna = valor === "" ? null
      : valor === "id" ? "id"
        : COLUNAS_CSV[csv.colecao].find((c) => c.campo === valor) || null;
    setCsv({ ...csv, mapeamento: csv.mapeamento.map((a, i) => (i === indice ? novo : a)) });
  }

  const valorAlvo = (a: AlvoColuna) => (a === "id" ? "id" : a ? a.campo : "");

  return (
    <Modal titulo="Importar dados" aoFechar={aoFechar} largo>
      {!resumo && !csv && !resultado && (
        <>
          <p className="hint">
            Aceita o pacote <b>.json</b> da Central (backup completo ou de uma coleção) e planilhas{" "}
            <b>.csv</b> — as exportadas daqui ou as suas do Excel/Google Planilhas.
            Nada é gravado antes da prévia.
          </p>
          <button className="btn" onClick={() => arquivoRef.current?.click()}>Escolher arquivo…</button>
          <input ref={arquivoRef} type="file" style={{ display: "none" }}
            accept=".json,.csv,.txt,application/json,text/csv" onChange={aoEscolherArquivo} />
          <div className="field" style={{ marginTop: 12 }}>
            <label>ou cole o conteúdo aqui (JSON ou tabela)</label>
            <textarea value={colado} onChange={(e) => setColado(e.target.value)}
              placeholder={'{"central":"coletivo", ...}   ou   Nome;Tipo;Contato'} />
          </div>
          {erro && <p className="erro-import">{erro}</p>}
          <RodapeModal>
            <span className="sp">
              <button className="btn ghost" onClick={aoFechar}>Cancelar</button>
              <button className="btn" disabled={!colado.trim()} onClick={() => analisar(colado)}>Analisar</button>
            </span>
          </RodapeModal>
        </>
      )}

      {resumo && (
        <>
          <p className="hint">Formato reconhecido: <b>{resumo.formato}</b></p>
          <ul className="import-lista">
            {resumo.painel && Object.entries(resumo.painel).map(([c, n]) => (
              <li key={c}><b>{n}</b> · {ROTULO_COLECAO[c as ColecaoPainel]}</li>
            ))}
            {resumo.rascunhos != null && <li><b>{resumo.rascunhos}</b> · rascunho(s) do Simulador (sempre entram como cópia)</li>}
            {resumo.contexto && (
              <li>
                <b>{resumo.contexto.fichas + resumo.contexto.regras + resumo.contexto.julgamentos}</b>
                {" "}· docs do Contexto ({resumo.contexto.fichas} ficha(s), {resumo.contexto.regras} regra(s), {resumo.contexto.julgamentos} julgamento(s))
              </li>
            )}
          </ul>
          {resumo.painel && (
            <div className="field">
              <label>Como aplicar as coleções do Painel</label>
              <label className="radio">
                <input type="radio" checked={modo === "mesclar"} onChange={() => setModo("mesclar")} />
                <span><b>Mesclar</b> — atualiza os registros de mesmo id, adiciona os novos e não apaga nada.</span>
              </label>
              <label className="radio">
                <input type="radio" checked={modo === "substituir"} onChange={() => setModo("substituir")} />
                <span><b>Substituir</b> — as coleções presentes no arquivo ficam exatamente como nele; o que não estiver lá é apagado.</span>
              </label>
            </div>
          )}
          {erro && <p className="erro-import">{erro}</p>}
          <RodapeModal>
            <button className="btn ghost" onClick={() => { setResumo(null); setErro(""); }}>← Voltar</button>
            <span className="sp">
              <button className="btn ghost" onClick={aoFechar}>Cancelar</button>
              <button className="btn" onClick={aplicarJson}>Importar</button>
            </span>
          </RodapeModal>
        </>
      )}

      {csv && !resultado && (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>Importar como</label>
            <select value={csv.colecao} style={{ font: "inherit", fontSize: 13, padding: "6px 9px", border: "1px solid var(--line)", borderRadius: 7 }}
              onChange={(e) => {
                const c = e.target.value as ColecaoPainel;
                setCsv({ ...csv, colecao: c, mapeamento: mapeamentoInicial(c, csv.cabecalho) });
              }}>
              {COLECOES_PAINEL.map((c) => <option key={c} value={c}>{ROTULO_COLECAO[c]}</option>)}
            </select>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>{csv.linhas.length} linha(s) de dados</span>
          </div>

          <div className="tbl-wrap" style={{ maxHeight: 290, overflowY: "auto" }}>
            <table>
              <thead>
                <tr><th>Coluna do arquivo</th><th>Vai para</th><th>Exemplo (1ª linha)</th></tr>
              </thead>
              <tbody>
                {csv.cabecalho.map((h, j) => (
                  <tr key={j}>
                    <td><b>{h.trim() || "(sem nome)"}</b></td>
                    <td>
                      <select value={valorAlvo(csv.mapeamento[j])} onChange={(e) => trocarAlvo(j, e.target.value)}
                        style={{ font: "inherit", fontSize: 12.5, padding: "4px 7px", border: "1px solid var(--line)", borderRadius: 6, maxWidth: 190 }}>
                        <option value="">— ignorar —</option>
                        <option value="id">id (usado pra mesclar)</option>
                        {COLUNAS_CSV[csv.colecao].map((c) => <option key={c.campo} value={c.campo}>{c.rotulo}</option>)}
                      </select>
                    </td>
                    <td className="muted">{(csv.linhas[0] || [])[j] || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <label className="radio">
              <input type="radio" checked={modoCsv === "mesclar"} onChange={() => setModoCsv("mesclar")} />
              <span><b>Mesclar</b> — atualiza pelo id ou por nome/título igual; o resto entra como novo. Células vazias não apagam nada.</span>
            </label>
            <label className="radio">
              <input type="radio" checked={modoCsv === "adicionar"} onChange={() => setModoCsv("adicionar")} />
              <span><b>Só adicionar</b> — todas as linhas entram como registros novos.</span>
            </label>
          </div>

          <RodapeModal>
            <button className="btn ghost" onClick={() => { setCsv(null); setErro(""); }}>← Voltar</button>
            <span className="sp">
              <button className="btn ghost" onClick={aoFechar}>Cancelar</button>
              <button className="btn" onClick={aplicarCsv}>Importar {csv.linhas.length} linha(s)</button>
            </span>
          </RodapeModal>
        </>
      )}

      {resultado && (
        <>
          <p className="hint">
            Importação concluída: <b>{resultado.criados}</b> criado(s), <b>{resultado.atualizados}</b> atualizado(s).
          </p>
          <p className="hint">Avisos — relações que não foram encontradas ficaram em branco (dá pra ajustar abrindo o registro):</p>
          <ul className="import-lista">
            {resultado.avisos.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
          <RodapeModal>
            <span className="sp"><button className="btn" onClick={aoFechar}>Fechar</button></span>
          </RodapeModal>
        </>
      )}
    </Modal>
  );
}
