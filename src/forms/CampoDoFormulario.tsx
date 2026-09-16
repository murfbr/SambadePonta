/* Um campo do editor de registros, desenhado a partir da especificação.
   Recebe o valor atual e devolve mudanças pelo `definir` — o estado vive no
   FormularioRegistro. */
import type { CampoSpec } from "./tipos";
import { usarCentral } from "../store/central";
import type { ColecaoPainel } from "../types";

interface Props {
  campo: CampoSpec;
  valor: unknown;
  definir: (valor: unknown) => void;
  /** Opções do vínculo polimórfico (tarefa → projeto/reunião/candidatura). */
  opcoesOrigem: [valor: string, rotulo: string][];
}

export function CampoDoFormulario({ campo: c, valor: v, definir, opcoesOrigem }: Props) {
  const { painel } = usarCentral();
  const listaDe = (colecao: ColecaoPainel) =>
    painel[colecao] as { id: string; nome?: string; titulo?: string }[];
  const id = "campo-" + c.chave;

  switch (c.tipo) {
    case "textarea":
      return <textarea id={id} value={String(v ?? "")} onChange={(e) => definir(e.target.value)} />;

    case "date":
      return <input id={id} type="date" value={String(v ?? "")} onChange={(e) => definir(e.target.value)} />;

    case "select":
      return (
        <select id={id} value={String(v ?? "")} onChange={(e) => definir(e.target.value)}>
          {(v == null || v === "") && <option value="" />}
          {(c.fonte as string[]).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );

    case "opts":
      return (
        <select id={id} value={String(v ?? "")} onChange={(e) => definir(e.target.value)}>
          {(c.fonte as [string, string][]).map(([val, rot]) => <option key={val} value={val}>{rot}</option>)}
        </select>
      );

    case "ref": {
      const lista = listaDe(c.fonte as ColecaoPainel);
      return (
        <select id={id} value={String(v ?? "")} onChange={(e) => definir(e.target.value)}>
          {(v == null || v === "") && <option value="">—</option>}
          {lista.map((o) => <option key={o.id} value={o.id}>{o.nome || o.titulo || o.id}</option>)}
        </select>
      );
    }

    case "origem":
      return (
        <select id={id} value={String(v ?? "")} onChange={(e) => definir(e.target.value)}>
          {opcoesOrigem.map(([val, rot]) => <option key={val} value={val}>{rot}</option>)}
        </select>
      );

    case "csv":
      // Enquanto digita é texto; ao sair do campo vira lista limpa.
      return (
        <input id={id} value={Array.isArray(v) ? (v as string[]).join(", ") : String(v ?? "")}
          onChange={(e) => definir(e.target.value)}
          onBlur={(e) => definir(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
      );

    case "lines":
      return (
        <textarea id={id} style={{ minHeight: 96 }}
          value={Array.isArray(v) ? (v as string[]).join("\n") : String(v ?? "")}
          onChange={(e) => definir(e.target.value)}
          onBlur={(e) => definir(e.target.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean))} />
      );

    case "multi": {
      const selecionados = Array.isArray(v) ? (v as string[]) : [];
      const lista = listaDe(c.fonte as ColecaoPainel);
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", padding: "4px 0" }}>
          {lista.map((o) => (
            <label key={o.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 500, fontSize: 12.5, color: "var(--ink)" }}>
              <input type="checkbox" style={{ width: "auto" }} checked={selecionados.includes(o.id)}
                onChange={(e) => definir(e.target.checked
                  ? [...selecionados, o.id]
                  : selecionados.filter((x) => x !== o.id))} />
              {o.nome}
            </label>
          ))}
          {!lista.length && <span className="muted" style={{ fontSize: 12 }}>ninguém na equipe ainda</span>}
        </div>
      );
    }

    default:
      return <input id={id} value={String(v ?? "")} onChange={(e) => definir(e.target.value)} />;
  }
}
