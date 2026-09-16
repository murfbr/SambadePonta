/* Ficha completa do artista, com sub-abas alimentadas pelo acervo `det`:
   geral, portfólio cultural, documentos, fotos, links e manual de marca. */
import { usarCentral } from "../../store/central";
import { porId } from "../../store/mutacoes";
import { fecharDetalhe, mudarSubAba } from "../../store/navegacao";
import { abrirEdicao } from "../../store/edicao";

const SUB_ABAS: [string, string][] = [
  ["geral", "Geral"], ["portfolio", "Portfólio cultural"], ["docs", "Documentos"],
  ["fotos", "Fotos"], ["links", "Links"], ["marca", "Manual de marca"],
];

export function FichaArtista({ id, sub }: { id: string; sub: string }) {
  usarCentral();
  const a = porId("artistas", id)!;
  const d = a.det;

  let corpo;
  if (!d) {
    corpo = <div className="panel"><p className="muted">Ficha ainda a preencher. As sub-abas já existem — edite o artista para começar a alimentar.</p></div>;
  } else if (sub === "geral") {
    corpo = (
      <>
        <div className="panel">
          <h4>Dados gerais</h4>
          {Object.entries(d.geral || {}).map(([k, v]) => (
            <div className="row-line" key={k}>
              <span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>{k}</span><b>{v}</b>
            </div>
          ))}
        </div>
        <div className="panel">
          <h4>Sobre</h4>
          <p style={{ margin: 0 }}>{a.bio}</p>
          <div style={{ marginTop: 8 }}>{(a.tags || []).map((t) => <span className="chip" key={t}>{t}</span>)}</div>
        </div>
      </>
    );
  } else if (sub === "portfolio") {
    corpo = (
      <div className="panel">
        <h4>Histórico &amp; realizações</h4>
        {(d.portfolio || []).map((item, i) => (
          <div className="row-line" key={i}><span className="yr">{item.ano}</span><span>{item.texto}</span></div>
        ))}
      </div>
    );
  } else if (sub === "docs") {
    corpo = (
      <div className="panel">
        <h4>Documentos</h4>
        {(d.docs || []).map((doc, i) => (
          <div className="docitem" key={i}>
            <span style={{ flex: 1 }}>{doc.nome}</span>
            <span className={"badge " + (doc.status === "ok" ? "pill-ok" : "pill-pend")}>{doc.status === "ok" ? "anexado" : "pendente"}</span>
          </div>
        ))}
        <p className="hint" style={{ marginTop: 12 }}>Esse acervo abastece o checklist de documentos das candidaturas deste artista.</p>
      </div>
    );
  } else if (sub === "fotos") {
    corpo = (
      <div className="panel">
        <h4>Fotos</h4>
        <div className="photos">
          {Array.from({ length: d.fotos || 0 }).map((_, i) => <div className="photo" key={i}>Foto {i + 1}</div>)}
        </div>
      </div>
    );
  } else if (sub === "links") {
    corpo = (
      <div className="panel">
        <h4>Links</h4>
        {(d.links || []).map((l, i) => (
          <div className="row-line" key={i}>
            <span className="yr" style={{ flexBasis: "auto", color: "var(--accent)" }}>↗</span>
            <span><b>{l.rotulo}</b> <span className="muted">— {l.url}</span></span>
          </div>
        ))}
      </div>
    );
  } else if (sub === "marca") {
    corpo = (
      <div className="panel">
        <h4>Manual de marca</h4>
        <div style={{ marginBottom: 14 }}>
          {(d.marca?.cores || []).map((c) => (
            <span className="swatch" key={c}><span className="sw" style={{ background: c }} /><span className="lb">{c}</span></span>
          ))}
        </div>
        <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Logo</span><b>{d.marca?.logo}</b></div>
        <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Tipografia</span><b>{d.marca?.fonte}</b></div>
        <div className="row-line"><span className="yr" style={{ flexBasis: 110, color: "var(--muted)" }}>Observações</span><span>{d.marca?.obs}</span></div>
      </div>
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
