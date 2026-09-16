/* Ficha completa do artista, com o acervo `det` EDITÁVEL em cada sub-aba:
   geral, portfólio cultural, documentos (checklist que abastece candidaturas
   e Pendências), fotos, links e manual de marca. */
import { useState } from "react";
import { usarCentral } from "../../store/central";
import { porId, salvarRegistro } from "../../store/mutacoes";
import { fecharDetalhe, mudarSubAba } from "../../store/navegacao";
import { abrirEdicao } from "../../store/edicao";
import { BlocoEditavel } from "../../components/BlocoEditavel";
import { clonar } from "../../utils";
import type { DetalheArtista } from "../../types";

const SUB_ABAS: [string, string][] = [
  ["geral", "Geral"], ["portfolio", "Portfólio cultural"], ["docs", "Documentos"],
  ["fotos", "Fotos"], ["links", "Links"], ["marca", "Manual de marca"],
];

/** Quebra "a | b | c" nos pedaços, sem perder os do meio vazios. */
const partes = (linha: string) => linha.split("|").map((x) => x.trim());
const linhasDe = (texto: string) => texto.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

export function FichaArtista({ id, sub }: { id: string; sub: string }) {
  usarCentral();
  const a = porId("artistas", id)!;
  const d: DetalheArtista = a.det || {};
  const [novoDoc, setNovoDoc] = useState("");

  /** Toda edição do acervo passa por aqui: clona o artista, mexe no det, salva. */
  function alterarDet(mudar: (det: DetalheArtista) => void, rapido = true) {
    const copia = clonar(a);
    copia.det = copia.det || {};
    mudar(copia.det);
    salvarRegistro("artistas", copia, rapido);
  }

  function adicionarDoc() {
    const nome = novoDoc.trim();
    if (!nome) return;
    alterarDet((det) => { det.docs = [...(det.docs || []), { nome, status: "pend" }]; });
    setNovoDoc("");
  }

  const vazio = <p className="muted" style={{ margin: 0 }}>nada registrado ainda — use o "editar" do bloco</p>;

  let corpo;
  if (sub === "geral") {
    corpo = (
      <>
        <BlocoEditavel titulo="Dados gerais" dica='por linha: rótulo | valor (ex.: "Local | Pedra do Leme")'
          valor={Object.entries(d.geral || {}).map(([k, v]) => k + " | " + v).join("\n")}
          aoSalvar={(t) => alterarDet((det) => {
            det.geral = Object.fromEntries(linhasDe(t).map((l) => {
              const p = partes(l);
              return [p[0] || "—", p.slice(1).join(" | ")];
            }));
          })}>
          {Object.keys(d.geral || {}).length ? Object.entries(d.geral || {}).map(([k, v]) => (
            <div className="row-line" key={k}>
              <span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>{k}</span><b>{v}</b>
            </div>
          )) : vazio}
        </BlocoEditavel>
        <div className="panel">
          <h4>Sobre</h4>
          <p style={{ margin: 0 }}>{a.bio}</p>
          <div style={{ marginTop: 8 }}>{(a.tags || []).map((t) => <span className="chip" key={t}>{t}</span>)}</div>
          <p className="hint" style={{ marginTop: 10 }}>Bio e tags são do cadastro — botão Editar lá em cima.</p>
        </div>
      </>
    );
  } else if (sub === "portfolio") {
    corpo = (
      <BlocoEditavel titulo="Histórico & realizações" dica='por linha: ano | texto (ex.: "2025 | 40 rodas na Pedra do Leme")'
        valor={(d.portfolio || []).map((x) => x.ano + " | " + x.texto).join("\n")}
        aoSalvar={(t) => alterarDet((det) => {
          det.portfolio = linhasDe(t).map((l) => {
            const p = partes(l);
            return { ano: p[0] || "", texto: p.slice(1).join(" | ") };
          });
        })}>
        {(d.portfolio || []).length ? (d.portfolio || []).map((item, i) => (
          <div className="row-line" key={i}><span className="yr">{item.ano}</span><span>{item.texto}</span></div>
        )) : vazio}
      </BlocoEditavel>
    );
  } else if (sub === "docs") {
    corpo = (
      <div className="panel">
        <h4>Documentos <span className="act hint" style={{ margin: 0 }}>clique no status para alternar</span></h4>
        {(d.docs || []).map((doc, i) => (
          <div className="docitem" key={i}>
            <span style={{ flex: 1 }}>{doc.nome}</span>
            <span className={"badge clicavel " + (doc.status === "ok" ? "pill-ok" : "pill-pend")}
              title="alternar anexado / pendente"
              onClick={() => alterarDet((det) => { det.docs![i].status = det.docs![i].status === "ok" ? "pend" : "ok"; })}>
              {doc.status === "ok" ? "anexado" : "pendente"}
            </span>
            <button className="rm" title="remover"
              onClick={() => alterarDet((det) => { det.docs!.splice(i, 1); })}>×</button>
          </div>
        ))}
        {!(d.docs || []).length && vazio}
        <div className="add-linha">
          <input value={novoDoc} placeholder="novo documento (ex.: Portfólio em PDF)"
            onChange={(e) => setNovoDoc(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") adicionarDoc(); }} />
          <button className="btn sm" onClick={adicionarDoc}>+ adicionar</button>
        </div>
        <p className="hint" style={{ marginTop: 12 }}>Esse acervo abastece o checklist das candidaturas deste artista e as Pendências.</p>
      </div>
    );
  } else if (sub === "fotos") {
    corpo = (
      <div className="panel">
        <h4>Fotos</h4>
        <div className="add-linha" style={{ margin: "0 0 12px" }}>
          <span className="hint" style={{ margin: 0 }}>quantidade no acervo:</span>
          <input type="number" min={0} style={{ flex: "0 0 90px" }} value={d.fotos || 0}
            onChange={(e) => alterarDet((det) => { det.fotos = Math.max(0, Number(e.target.value) || 0); }, false)} />
        </div>
        <div className="photos">
          {Array.from({ length: d.fotos || 0 }).map((_, i) => <div className="photo" key={i}>Foto {i + 1}</div>)}
        </div>
        <p className="hint" style={{ marginTop: 10 }}>Contagem de referência — as fotos em si vivem na pasta do Drive.</p>
      </div>
    );
  } else if (sub === "links") {
    corpo = (
      <BlocoEditavel titulo="Links" dica='por linha: rótulo | url (ex.: "Instagram | instagram.com/bloco")'
        valor={(d.links || []).map((l) => l.rotulo + " | " + l.url).join("\n")}
        aoSalvar={(t) => alterarDet((det) => {
          det.links = linhasDe(t).map((l) => {
            const p = partes(l);
            return { rotulo: p[0] || "link", url: p.slice(1).join(" | ") };
          });
        })}>
        {(d.links || []).length ? (d.links || []).map((l, i) => (
          <div className="row-line" key={i}>
            <span className="yr" style={{ flexBasis: "auto", color: "var(--accent)" }}>↗</span>
            <span><b>{l.rotulo}</b> <span className="muted">— {l.url}</span></span>
          </div>
        )) : vazio}
      </BlocoEditavel>
    );
  } else if (sub === "marca") {
    const m = d.marca;
    corpo = (
      <BlocoEditavel titulo="Manual de marca"
        dica='linhas "cores:" (vírgula), "logo:", "fonte:" e "obs:"'
        valor={[
          "cores: " + (m?.cores || []).join(", "),
          "logo: " + (m?.logo || ""),
          "fonte: " + (m?.fonte || ""),
          "obs: " + (m?.obs || ""),
        ].join("\n")}
        aoSalvar={(t) => alterarDet((det) => {
          const marca = { cores: [] as string[], logo: "", fonte: "", obs: "", ...(det.marca || {}) };
          linhasDe(t).forEach((l) => {
            const dois = l.indexOf(":");
            if (dois < 0) return;
            const chave = l.slice(0, dois).trim().toLowerCase();
            const valor = l.slice(dois + 1).trim();
            if (chave === "cores") marca.cores = valor.split(",").map((x) => x.trim()).filter(Boolean);
            else if (chave === "logo") marca.logo = valor;
            else if (chave === "fonte") marca.fonte = valor;
            else if (chave === "obs") marca.obs = valor;
          });
          det.marca = marca;
        })}>
        {m ? (
          <>
            <div style={{ marginBottom: 14 }}>
              {(m.cores || []).map((c) => (
                <span className="swatch" key={c}><span className="sw" style={{ background: c }} /><span className="lb">{c}</span></span>
              ))}
            </div>
            <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Logo</span><b>{m.logo}</b></div>
            <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Tipografia</span><b>{m.fonte}</b></div>
            <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Observações</span><span>{m.obs}</span></div>
          </>
        ) : vazio}
      </BlocoEditavel>
    );
  }

  return (
    <>
      <button className="back" onClick={fecharDetalhe}>← Voltar para Artistas</button>
      <div className="dhead">
        <div className="avatar">{a.nome[0]}</div>
        <div>
          <h2>{a.nome}</h2>
          <span className="badge b-type">{a.tipo}</span>{" "}
          <span className="muted" style={{ fontSize: 12.5 }}>· {a.enq} · {a.mun}</span>
        </div>
        <span className="act"><button className="btn ghost sm" onClick={() => abrirEdicao("artista", a.id)}>Editar</button></span>
      </div>
      <div className="subtabs">
        {SUB_ABAS.map(([k, rotulo]) => (
          <button key={k} className={sub === k ? "on" : ""} onClick={() => mudarSubAba(k)}>{rotulo}</button>
        ))}
      </div>
      {corpo}
    </>
  );
}
