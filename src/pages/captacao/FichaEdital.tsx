/* Ficha do edital: dados gerais, o que financia, documentos exigidos,
   candidaturas no edital e observações & links. */
import { usarCentral } from "../../store/central";
import { porId } from "../../store/mutacoes";
import { abrirDetalhe, fecharDetalhe, mudarSubAba } from "../../store/navegacao";
import { abrirEdicao } from "../../store/edicao";
import { projetoArtistaDe } from "../../lib/nomes";
import { ESFERAS, ETAPAS_PIPELINE, STATUS_EDITAL } from "../../types";
import { url } from "../../utils";

const SUB_ABAS: [string, string][] = [
  ["geral", "Geral"], ["financia", "O que financia"], ["docs", "Documentos"],
  ["cands", "Candidaturas"], ["obs", "Observações & links"],
];

export function FichaEdital({ id, sub }: { id: string; sub: string }) {
  const { painel } = usarCentral();
  const e = porId("editais", id)!;
  const esf = ESFERAS[e.esfera] || { rotulo: "—", classe: "" };
  const st = STATUS_EDITAL[e.status] || STATUS_EDITAL.open;
  const cands = painel.candidaturas.filter((c) => c.editalId === e.id);

  const LinhaDado = ({ rotulo, valor }: { rotulo: string; valor?: string | number }) => (
    <div className="row-line">
      <span className="yr" style={{ flexBasis: 135, color: "var(--muted)" }}>{rotulo}</span>
      <b>{valor || "—"}</b>
    </div>
  );
  const LinhaLink = ({ rotulo, href }: { rotulo: string; href?: string }) => (
    <div className="row-line">
      <span className="yr" style={{ flexBasis: 120, color: "var(--muted)" }}>{rotulo}</span>
      {href ? (
        <span><a href={url(href)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontWeight: 600, wordBreak: "break-all" }}>↗ {href}</a></span>
      ) : (
        <span className="muted">— (adicione pelo botão Editar)</span>
      )}
    </div>
  );
  const TextoOuVazio = ({ texto }: { texto?: string }) =>
    texto ? <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{texto}</p> : <p style={{ margin: 0 }}><span className="muted">—</span></p>;

  let corpo;
  if (sub === "geral") {
    corpo = (
      <div className="panel">
        <h4>Dados do edital</h4>
        <LinhaDado rotulo="Esfera" valor={esf.rotulo} />
        <LinhaDado rotulo="Órgão / promotor" valor={e.orgao} />
        <LinhaDado rotulo="Mecanismo" valor={e.mec} />
        <LinhaDado rotulo="Área" valor={e.area} />
        <LinhaDado rotulo="Teto" valor={e.teto} />
        <LinhaDado rotulo="Prazo" valor={e.prazo} />
        <div className="row-line">
          <span className="yr" style={{ flexBasis: 135, color: "var(--muted)" }}>Status</span>
          <span className={"badge " + st.classe}>{st.rotulo}</span>
        </div>
        <div className="row-line">
          <span className="yr" style={{ flexBasis: 135, color: "var(--muted)" }}>Elegibilidade</span>
          <span>{(e.eleg || []).length ? (e.eleg || []).map((x) => <span className="chip" key={x}>{x}</span>) : "—"}</span>
        </div>
        <div className="row-line">
          <span className="yr" style={{ flexBasis: 135, color: "var(--muted)" }}>Verificado</span>
          <span className="muted">{e.verif || "—"}</span>
        </div>
      </div>
    );
  } else if (sub === "financia") {
    corpo = (
      <>
        <div className="panel"><h4>O que financia</h4>{e.objeto ? <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{e.objeto}</p> : <p style={{ margin: 0 }}><span className="muted">A preencher — use o botão Editar.</span></p>}</div>
        <div className="panel"><h4>Quem pode se inscrever</h4><TextoOuVazio texto={e.publico} /></div>
        <div className="panel"><h4>Contrapartidas</h4><TextoOuVazio texto={e.contrapartidas} /></div>
      </>
    );
  } else if (sub === "docs") {
    const docs = e.docsExig || [];
    corpo = (
      <>
        <div className="panel">
          <h4>Documentos exigidos</h4>
          {docs.length
            ? docs.map((d) => <div className="docitem" key={d}><span style={{ flex: 1 }}>{d}</span></div>)
            : <p className="muted" style={{ margin: 0 }}>Ainda não cadastrados — edite o edital para listar.</p>}
          <p className="hint" style={{ marginTop: 12 }}>Referência do que juntar. O checklist de cada candidatura é gerado automaticamente pelo mecanismo do edital.</p>
        </div>
        <div className="panel"><h4>Como se inscrever</h4><TextoOuVazio texto={e.comoInscrever} /></div>
      </>
    );
  } else if (sub === "cands") {
    corpo = (
      <div className="panel">
        <h4>Candidaturas neste edital</h4>
        {cands.map((c) => (
          <div className="row-line" style={{ cursor: "pointer" }} key={c.id} onClick={() => abrirDetalhe("cand", c.id)}>
            <span style={{ flex: 1 }}>
              <b>{projetoArtistaDe(c)}</b>
              <div className="muted">{c.valor || "—"} · {ETAPAS_PIPELINE[c.etapa]}</div>
            </span>
            <span className="arrow">→</span>
          </div>
        ))}
        {!cands.length && <p className="muted" style={{ margin: 0 }}>Nenhuma candidatura neste edital ainda.</p>}
      </div>
    );
  } else if (sub === "obs") {
    corpo = (
      <>
        <div className="panel">
          <h4>Arquivos &amp; links</h4>
          <LinhaLink rotulo="Site do edital" href={e.linkEdital} />
          <LinhaLink rotulo="Pasta no Drive" href={e.linkDrive} />
          <p className="hint" style={{ marginTop: 10 }}>Os PDFs e anexos do edital ficam no Google Drive (pasta 00_Editais) — cole aqui o link da pasta pelo botão Editar.</p>
        </div>
        <div className="panel"><h4>Observações</h4><TextoOuVazio texto={e.obs} /></div>
      </>
    );
  }

  return (
    <>
      <button className="back" onClick={fecharDetalhe}>← Voltar para Editais</button>
      <div className="dhead">
        <div className="avatar" style={{ background: `linear-gradient(135deg, var(--${e.esfera || "accent"}), var(--gold))` }}>
          {esf.rotulo[0] || "E"}
        </div>
        <div>
          <h2>{e.nome}</h2>
          <span className={"badge esfera " + esf.classe}>{esf.rotulo}</span>{" "}
          <span className={"badge " + st.classe}>{st.rotulo}</span>{" "}
          <span className="muted" style={{ fontSize: 12.5 }}>· {e.mec}</span>
        </div>
        <span className="act"><button className="btn ghost sm" onClick={() => abrirEdicao("edital", e.id)}>Editar</button></span>
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
