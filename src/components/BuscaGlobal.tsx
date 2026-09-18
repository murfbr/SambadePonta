/* Paleta de busca global: abre com Ctrl+K (ou pelo botão do cabeçalho),
   procura em todas as coleções e navega direto para o resultado.
   Vive no App, como o Toast; qualquer lugar chama `abrirBusca()`. */
import { useEffect, useMemo, useRef, useState } from "react";
import { usarCentral } from "../store/central";
import { filtrar, montarIndice, type ResultadoBusca } from "../lib/busca";

let abrirFora: (() => void) | null = null;
/** Abre a paleta de busca de qualquer lugar. */
export function abrirBusca() { abrirFora?.(); }

export function BuscaGlobal() {
  const estado = usarCentral();
  const [aberta, setAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const [ativo, setAtivo] = useState(0);
  const caixa = useRef<HTMLInputElement>(null);
  const linhaAtiva = useRef<HTMLDivElement>(null);

  useEffect(() => {
    abrirFora = () => { setAberta(true); setTermo(""); setAtivo(0); };
    const atalho = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); abrirFora?.(); }
    };
    window.addEventListener("keydown", atalho);
    return () => { abrirFora = null; window.removeEventListener("keydown", atalho); };
  }, []);

  const indice = useMemo(() => (aberta ? montarIndice(estado) : []), [aberta, estado]);
  const resultados = useMemo(() => filtrar(indice, termo), [indice, termo]);

  useEffect(() => { if (aberta) caixa.current?.focus(); }, [aberta]);
  useEffect(() => { setAtivo(0); }, [termo]);
  useEffect(() => { linhaAtiva.current?.scrollIntoView({ block: "nearest" }); }, [ativo, resultados]);

  if (!aberta) return null;

  const escolher = (x: ResultadoBusca) => { setAberta(false); x.abrir(); };

  const teclas = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setAtivo((i) => Math.min(i + 1, resultados.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAtivo((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && resultados[ativo]) escolher(resultados[ativo]);
    else if (e.key === "Escape") setAberta(false);
  };

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setAberta(false); }}>
      <div className="paleta" role="dialog" aria-label="Busca global">
        <input
          ref={caixa} type="search" value={termo}
          placeholder="buscar em tudo — artistas, editais, candidaturas, tarefas, rascunhos…"
          onChange={(e) => setTermo(e.target.value)} onKeyDown={teclas}
        />
        <div className="paleta-lista">
          {resultados.map((x, i) => (
            <div
              key={i} ref={i === ativo ? linhaAtiva : undefined}
              className={"paleta-item" + (i === ativo ? " on" : "")}
              // onMouseMove (não Enter): rolar a lista sob o cursor parado não rouba a seleção do teclado
              onMouseMove={() => ativo !== i && setAtivo(i)} onClick={() => escolher(x)}
            >
              <span className="badge b-type">{x.grupo}</span>
              <span className="t">{x.titulo}</span>
              {x.detalhe && <span className="s">{x.detalhe}</span>}
            </div>
          ))}
          {termo.trim() !== "" && !resultados.length && (
            <div className="paleta-vazia">nada encontrado para “{termo}”</div>
          )}
          {termo.trim() === "" && (
            <div className="paleta-vazia">digite para buscar · ↑↓ navega · Enter abre · Esc fecha</div>
          )}
        </div>
      </div>
    </div>
  );
}
