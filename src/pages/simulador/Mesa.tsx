/* Mesa do Simulador: os rascunhos agrupados por formulário, com progresso por
   status (rascunho/revisado/colado), duplicar, arquivar, exportar e importar. */
import { useRef, useState, type ChangeEvent } from "react";
import { usarCentral } from "../../store/central";
import { excluirRascunho, nomeCandidatura, porId, salvarRascunho } from "../../store/mutacoes";
import { importarPacote } from "../../store/importarExportar";
import { abrirRascunho } from "../../store/navegacao";
import { FORMULARIOS, REGISTRO, nomePlataforma } from "../../data";
import { normalizarRascunho, novoRascunho, resumoRascunho } from "../../lib/simulador/motor";
import { toast } from "../../components/Toast";
import { baixarArquivo, clonar, relativo, slug } from "../../utils";
import type { Rascunho } from "../../types";

export function Mesa({ aoAbrir }: { aoAbrir: () => void }) {
  const { rascunhos } = usarCentral();
  const [abaMesa, setAbaMesa] = useState<"rasc" | "arq">("rasc");
  const [menuNovo, setMenuNovo] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);

  const todos = Object.values(rascunhos).map((r) => normalizarRascunho(clonar(r)));
  const ativos = todos.filter((r) => !r.arquivado);
  const arquivados = todos.filter((r) => r.arquivado);
  const lista = abaMesa === "rasc" ? ativos : arquivados;
  const migrados = REGISTRO.filter((x) => x.migrado);

  function criarEm(form: string) {
    const r = novoRascunho(form, "Novo rascunho", "");
    salvarRascunho(r, true);
    aoAbrir();
    abrirRascunho(r.id);
  }

  function duplicar(r: Rascunho) {
    const copia = clonar(r);
    copia.id = novoRascunho(r.form).id;
    copia.nome = r.nome + " · cópia";
    copia.arquivado = false;
    copia.criado = new Date().toISOString();
    salvarRascunho(copia, true);
    toast("Rascunho duplicado");
  }

  function arquivar(r: Rascunho, valor: boolean) {
    salvarRascunho({ ...clonar(r), arquivado: valor }, true);
    toast(valor ? "Arquivado" : "De volta à Mesa");
  }

  function excluir(r: Rascunho) {
    if (confirmandoExclusao !== r.id) { setConfirmandoExclusao(r.id); return; }
    excluirRascunho(r.id);
    setConfirmandoExclusao(null);
    toast("Excluído");
  }

  function aoImportar(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    arquivo.text().then((texto) => {
      try {
        toast(importarPacote(JSON.parse(texto)));
        setAbaMesa("rasc");
      } catch {
        toast("Não reconheci esse arquivo .json");
      }
    });
  }

  const referenciaDe = (r: Rascunho) => {
    const c = porId("candidaturas", r.ref);
    if (c) return <><span className="mono">{r.ref}</span> {nomeCandidatura(c)}</>;
    if (r.ref) return <>referência: <span className="mono">{r.ref}</span></>;
    return <>sem candidatura vinculada</>;
  };

  return (
    <>
      <div className="shead">
        <div>
          <h2>Mesa</h2>
          <p className="sub">Rascunhos em andamento, agrupados pelo formulário a que pertencem. Um formulário pode ter quantos rascunhos você quiser.</p>
        </div>
        <div className="acts">
          <button className="btn" onClick={() => arquivoRef.current?.click()}>Importar .json</button>
          <input ref={arquivoRef} type="file" accept="application/json" hidden onChange={aoImportar} />
          <button className="btn" onClick={() => baixarArquivo("simulador-backup.json", JSON.stringify({ simulador: 1, docs: rascunhos }, null, 2))}>
            Exportar tudo
          </button>
          <span className="menu-wrap">
            <button className="btn primary" onClick={() => setMenuNovo(!menuNovo)}>Novo rascunho ▾</button>
            {menuNovo && (
              <div className="menu">
                {migrados.map((x) => (
                  <button key={x.id} onClick={() => { setMenuNovo(false); criarEm(x.id); }}>
                    {x.nome}<small>{nomePlataforma(x.plataforma)}</small>
                  </button>
                ))}
              </div>
            )}
          </span>
        </div>
      </div>

      <div className="mesa-tabs">
        <button className={abaMesa === "rasc" ? "on" : ""} onClick={() => setAbaMesa("rasc")}>Rascunhos <span>{ativos.length}</span></button>
        <button className={abaMesa === "arq" ? "on" : ""} onClick={() => setAbaMesa("arq")}>Arquivados <span>{arquivados.length}</span></button>
      </div>
      <div className="legenda">
        <span className="l-r">rascunho</span><span className="l-v">revisado</span><span className="l-c">colado na plataforma</span><span>vazio</span>
      </div>

      {REGISTRO.map((x) => {
        const doGrupo = lista
          .filter((r) => r.form === x.id)
          .sort((a, b) => (b.atualizado || "").localeCompare(a.atualizado || ""));

        if (!x.migrado) {
          if (abaMesa !== "rasc") return null;
          return (
            <div className="grupo" key={x.id}>
              <div className="grupo-h">
                <h3>{x.nome}</h3>
                <span className="plat">{nomePlataforma(x.plataforma)} · {x.etapas} etapas</span>
                <span className="n">ainda não migrado</span>
              </div>
              <div className="antigo">
                Este formulário ainda vive no artefato antigo.{" "}
                <a href={x.antigo} target="_blank" rel="noopener noreferrer">Abrir a réplica atual</a>.
                Ele entra no Simulador na próxima etapa da migração.
              </div>
            </div>
          );
        }

        return (
          <div className="grupo" key={x.id}>
            <div className="grupo-h">
              <h3>{x.nome}</h3>
              <span className="plat">{nomePlataforma(x.plataforma)} · {x.etapas} etapas · {x.campos} campos</span>
              <span className="n">{doGrupo.length} {abaMesa === "rasc" ? "rascunho" : "arquivado"}{doGrupo.length === 1 ? "" : "s"}</span>
            </div>
            <div className="rasc">
              {doGrupo.map((r) => {
                const s = resumoRascunho(r);
                const pct = (k: "col" | "rev" | "rasc") => (s.total ? (100 * s[k]) / s.total : 0);
                const total = s.total ? Math.round((100 * (s.rasc + s.rev + s.col)) / s.total) : 0;
                return (
                  <div className="card" key={r.id}>
                    <button className="abrir" onClick={() => { aoAbrir(); abrirRascunho(r.id); }}>
                      <h4>{r.nome}</h4>
                      <div className="ref">{referenciaDe(r)}</div>
                    </button>
                    <div className="prog">
                      <div className="bar">
                        <i className="c" style={{ width: pct("col") + "%" }} />
                        <i className="v" style={{ width: pct("rev") + "%" }} />
                        <i className="r" style={{ width: pct("rasc") + "%" }} />
                      </div>
                      {total}%
                    </div>
                    <div className="meta">
                      editado {relativo(r.atualizado)}
                      <span className="sp">
                        <button className="btn sm quiet" onClick={() => duplicar(r)}>Duplicar</button>
                        <button className="btn sm quiet" onClick={() => baixarArquivo(`rascunho-${slug(r.nome)}.json`, JSON.stringify(r, null, 2))}>Exportar</button>
                        <button className="btn sm quiet" onClick={() => arquivar(r, !r.arquivado)}>{r.arquivado ? "Reabrir" : "Arquivar"}</button>
                        {r.arquivado && (
                          <button className="btn sm quiet danger" onClick={() => excluir(r)}>
                            {confirmandoExclusao === r.id ? "Confirmar exclusão" : "Excluir"}
                          </button>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
              {abaMesa === "rasc" && FORMULARIOS[x.id] && (
                <div className="card novo" onClick={() => criarEm(x.id)}>+ novo rascunho neste formulário</div>
              )}
            </div>
          </div>
        );
      })}

      {!todos.length && (
        <div className="vazio-msg">
          Nenhum rascunho ainda. Crie um em "Novo rascunho" ou importe um backup .json das réplicas antigas.
        </div>
      )}
    </>
  );
}
