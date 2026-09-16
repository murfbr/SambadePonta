/* O modal genérico de criar/editar registros do Painel.
   Cada entidade descreve seus campos numa tabela (ENTIDADES) e o modal desenha
   o formulário sozinho — mesma mecânica do artefato, com os mesmos campos.
   Tipos de campo: texto (padrão), textarea, date, select (opções fixas),
   opts (valor+rótulo), ref (aponta outra coleção), origem (vínculo polimórfico),
   csv (lista separada por vírgula), lines (lista um-por-linha), multi (checkboxes). */
import { useMemo, useState } from "react";
import {
  excluirRegistro, obterEstado, porId, salvarRegistro, usarCentral,
} from "../banco/dados";
import { fecharEdicao, usarEdicao, type ChaveEntidade } from "../estado/edicao";
import { REGISTRO } from "../dados/estaticos";
import { clonar, uid } from "../util";
import { toast } from "./Toast";
import type { Candidatura, ColecaoPainel, Edital, ItemChecklist } from "../tipos";

type TipoCampo = "texto" | "textarea" | "date" | "select" | "opts" | "ref" | "origem" | "csv" | "lines" | "multi";

interface CampoSpec {
  chave: string;
  rotulo: string;
  tipo?: TipoCampo;
  /** select: opções; opts: pares [valor, rótulo]; ref/multi: nome da coleção. */
  fonte?: string[] | [string, string][] | ColecaoPainel;
}

interface EntidadeSpec {
  titulo: string;
  colecao: ColecaoPainel;
  /** Prefixo do id gerado (ex. "a" → "a-x7k2p9"). */
  prefixoId: string;
  padrao?: Record<string, unknown>;
  campos: CampoSpec[];
  /** Ajustes depois de salvar os campos (ex. candidatura ganha checklist de docs). */
  depois?: (registro: Record<string, unknown>) => void;
}

/** Checklist de documentos padrão de uma candidatura, pelo mecanismo do edital. */
export function documentosPorMecanismo(edital?: Edital): ItemChecklist[] {
  const M: Record<string, string[]> = {
    "Renúncia fiscal": ["Projeto técnico", "Planilha orçamentária", "Portfólio", "Documentos do proponente", "Cartas de anuência"],
    "Renúncia + direto": ["Projeto técnico", "Planilha orçamentária", "Portfólio", "Documentos do proponente"],
    "Fomento direto": ["Formulário de inscrição", "Plano de trabalho", "Portfólio", "Documentos do proponente"],
    "Patrocínio": ["Apresentação / media kit", "Projeto", "Contrapartidas", "Documentos do proponente"],
    "Incentivo público": ["Cadastro atualizado", "Comprovante de desfiles anteriores", "Documentos do bloco"],
  };
  return (M[edital?.mec || ""] || ["Projeto", "Portfólio", "Documentos do proponente"])
    .map((nome) => ({ nome, ok: false }));
}

const ENTIDADES: Record<ChaveEntidade, EntidadeSpec> = {
  artista: {
    titulo: "Artista", colecao: "artistas", prefixoId: "a",
    campos: [
      { chave: "nome", rotulo: "Nome" },
      { chave: "tipo", rotulo: "Tipo", tipo: "select", fonte: ["Bloco de carnaval", "Grupo musical", "Artista individual", "Grupo / afoxé"] },
      { chave: "enq", rotulo: "Enquadramento", tipo: "select", fonte: ["PF", "MEI", "PJ · Associação", "PJ", "Coletivo sem CNPJ"] },
      { chave: "cnpj", rotulo: "CNPJ (situação)" },
      { chave: "mun", rotulo: "Sede (município)" },
      { chave: "bio", rotulo: "Bio", tipo: "textarea" },
      { chave: "tags", rotulo: "Tags (vírgula)", tipo: "csv" },
    ],
  },
  projeto: {
    titulo: "Projeto", colecao: "projetos", prefixoId: "p",
    padrao: { producao: [], equipeIds: [] },
    campos: [
      { chave: "nome", rotulo: "Nome" },
      { chave: "artistaId", rotulo: "Artista", tipo: "ref", fonte: "artistas" },
      { chave: "tipo", rotulo: "Tipo", tipo: "select", fonte: ["Carnaval", "Álbum", "Single", "Videoclipe", "Turnê", "Circulação", "Show", "Outro"] },
      { chave: "meta", rotulo: "Meta de captação" },
      { chave: "ano", rotulo: "Janela / ano" },
    ],
  },
  edital: {
    titulo: "Edital", colecao: "editais", prefixoId: "ed",
    campos: [
      { chave: "nome", rotulo: "Nome" },
      { chave: "orgao", rotulo: "Órgão / promotor" },
      { chave: "esfera", rotulo: "Esfera", tipo: "opts", fonte: [["fed", "Federal"], ["est", "Estadual"], ["mun", "Municipal"], ["priv", "Privado"]] },
      { chave: "mec", rotulo: "Mecanismo", tipo: "select", fonte: ["Renúncia fiscal", "Fomento direto", "Patrocínio", "Incentivo público", "Renúncia + direto", "Credenciamento", "Fomento / intercâmbio"] },
      { chave: "area", rotulo: "Área" },
      { chave: "eleg", rotulo: "Elegibilidade (separe por vírgula)", tipo: "csv" },
      { chave: "teto", rotulo: "Teto" },
      { chave: "prazo", rotulo: "Prazo (texto)" },
      { chave: "prazoIso", rotulo: "Prazo (data)", tipo: "date" },
      {
        chave: "formId", rotulo: "Formulário no Simulador", tipo: "opts",
        fonte: ([["", "— nenhum"]] as [string, string][])
          .concat(REGISTRO.filter((x) => x.migrado).map((x) => [x.id, x.nome] as [string, string])),
      },
      { chave: "status", rotulo: "Status", tipo: "opts", fonte: [["open", "Aberto"], ["prev", "Previsto"], ["closed", "Encerrado"]] },
      { chave: "objeto", rotulo: "O que financia", tipo: "textarea" },
      { chave: "publico", rotulo: "Quem pode se inscrever", tipo: "textarea" },
      { chave: "comoInscrever", rotulo: "Como se inscrever", tipo: "textarea" },
      { chave: "contrapartidas", rotulo: "Contrapartidas", tipo: "textarea" },
      { chave: "docsExig", rotulo: "Documentos exigidos (um por linha)", tipo: "lines" },
      { chave: "linkEdital", rotulo: "Link do edital (site oficial)" },
      { chave: "linkDrive", rotulo: "Link da pasta no Google Drive" },
      { chave: "obs", rotulo: "Observações", tipo: "textarea" },
    ],
  },
  candidatura: {
    titulo: "Candidatura", colecao: "candidaturas", prefixoId: "c",
    campos: [
      { chave: "projetoId", rotulo: "Projeto", tipo: "ref", fonte: "projetos" },
      { chave: "editalId", rotulo: "Edital", tipo: "ref", fonte: "editais" },
      { chave: "respId", rotulo: "Responsável", tipo: "ref", fonte: "equipe" },
      { chave: "valor", rotulo: "Valor pleiteado" },
      { chave: "linkDrive", rotulo: "Link da pasta da inscrição no Drive" },
    ],
    depois: (r) => {
      const c = r as unknown as Candidatura;
      if (c.etapa == null) c.etapa = 0;
      if (!c.docs) c.docs = documentosPorMecanismo(porId("editais", c.editalId));
    },
  },
  tarefa: {
    titulo: "Tarefa", colecao: "tarefas", prefixoId: "t",
    padrao: { status: "fazer" },
    campos: [
      { chave: "titulo", rotulo: "Tarefa" },
      { chave: "respId", rotulo: "Responsável", tipo: "ref", fonte: "equipe" },
      { chave: "origem", rotulo: "Vinculada a", tipo: "origem" },
      { chave: "prazo", rotulo: "Prazo", tipo: "date" },
      { chave: "obs", rotulo: "Observações", tipo: "textarea" },
      { chave: "status", rotulo: "Status", tipo: "opts", fonte: [["fazer", "A fazer"], ["and", "Em andamento"], ["feito", "Concluído"]] },
    ],
  },
  reuniao: {
    titulo: "Reunião", colecao: "reunioes", prefixoId: "r",
    padrao: { status: "agendada", pauta: [] },
    campos: [
      { chave: "titulo", rotulo: "Título" },
      { chave: "data", rotulo: "Data", tipo: "date" },
      { chave: "hora", rotulo: "Hora (ex.: 19:00)" },
      { chave: "recorrencia", rotulo: "Recorrência", tipo: "select", fonte: ["Avulsa", "Diária", "Semanal", "Quinzenal", "Mensal"] },
      { chave: "proxima", rotulo: "Próxima reunião (data)", tipo: "date" },
      { chave: "local", rotulo: "Local / link" },
      { chave: "participanteIds", rotulo: "Participantes (da equipe)", tipo: "multi", fonte: "equipe" },
      { chave: "emailsExtra", rotulo: "Convidados externos (e-mails, vírgula)", tipo: "csv" },
      { chave: "pauta", rotulo: "Pauta (um item por linha)", tipo: "lines" },
      { chave: "ata", rotulo: "Ata / o que rolou", tipo: "textarea" },
      { chave: "status", rotulo: "Status", tipo: "opts", fonte: [["agendada", "Agendada"], ["realizada", "Realizada"]] },
    ],
  },
  equipe: {
    titulo: "Pessoa da equipe", colecao: "equipe", prefixoId: "eq",
    campos: [
      { chave: "nome", rotulo: "Nome artístico / como é chamado(a)" },
      { chave: "nomeCompleto", rotulo: "Nome completo" },
      { chave: "email", rotulo: "E-mail (p/ convites de reunião)" },
      { chave: "rg", rotulo: "RG" },
      { chave: "cpf", rotulo: "CPF" },
      { chave: "nascimento", rotulo: "Data de nascimento", tipo: "date" },
      { chave: "funcoes", rotulo: "Funções (vírgula)", tipo: "csv" },
    ],
  },
  elenco: {
    titulo: "Colaborador", colecao: "elenco", prefixoId: "el",
    campos: [
      { chave: "nome", rotulo: "Nome artístico" },
      { chave: "nomeCompleto", rotulo: "Nome completo" },
      { chave: "funcao", rotulo: "Função" },
      { chave: "email", rotulo: "E-mail" },
      { chave: "rg", rotulo: "RG" },
      { chave: "cpf", rotulo: "CPF" },
      { chave: "nascimento", rotulo: "Data de nascimento", tipo: "date" },
      { chave: "bio", rotulo: "Minibio", tipo: "textarea" },
      { chave: "docsStatus", rotulo: "Documentos", tipo: "opts", fonte: [["ok", "ok"], ["pend", "pendente"]] },
    ],
  },
  contato: {
    titulo: "Contato externo", colecao: "contatos", prefixoId: "k",
    campos: [
      { chave: "nome", rotulo: "Nome" },
      { chave: "tipo", rotulo: "Tipo" },
      { chave: "ref", rotulo: "Referência" },
      { chave: "contato", rotulo: "Contato" },
    ],
  },
};

/** O modal em si. Fica montado no App; só aparece quando algo abre a edição. */
export function EdicaoRegistro() {
  const { aberto } = usarEdicao();
  if (!aberto) return null;
  return <ModalEdicao key={aberto.chave + ":" + (aberto.id || "novo")} />;
}

function ModalEdicao() {
  const { aberto } = usarEdicao();
  const { painel } = usarCentral();
  const spec = ENTIDADES[aberto!.chave];
  const editando = aberto!.id != null;

  // Estado local do formulário: começa do registro (edição) ou dos padrões (novo).
  // Selects sem valor assumem a primeira opção, como o <select> nativo do artefato.
  const [valores, setValores] = useState<Record<string, unknown>>(() => {
    const base: Record<string, unknown> = editando
      ? (clonar(porId(spec.colecao, aberto!.id!) || {}) as Record<string, unknown>)
      : { ...(spec.padrao || {}), ...(aberto!.prefill || {}) };
    for (const c of spec.campos) {
      if (base[c.chave] != null && base[c.chave] !== "") continue;
      if (c.tipo === "select") base[c.chave] = (c.fonte as string[])[0];
      else if (c.tipo === "opts") base[c.chave] = (c.fonte as [string, string][])[0]?.[0] ?? "";
      else if (c.tipo === "ref") base[c.chave] = (obterEstado().painel[c.fonte as ColecaoPainel][0] as { id?: string } | undefined)?.id ?? "";
    }
    return base;
  });
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const listaDe = (colecao: ColecaoPainel) => painel[colecao] as { id: string; nome?: string; titulo?: string }[];

  // Opções do campo "origem" (vínculo polimórfico da tarefa).
  const opcoesOrigem = useMemo(() => {
    const nomeEdital = (c: { editalId: string }) => porId("editais", c.editalId)?.nome || "?";
    return [
      ["", "— sem vínculo"] as [string, string],
      ...painel.projetos.map((p) => ["proj:" + p.id, "Projeto · " + p.nome] as [string, string]),
      ...painel.reunioes.map((r) => ["reuniao:" + r.id, "Reunião · " + (r.titulo || r.data || r.id)] as [string, string]),
      ...painel.candidaturas.map((c) => ["cand:" + c.id, "Candidatura · " + nomeEdital(c)] as [string, string]),
    ];
  }, [painel]);

  const definir = (chave: string, valor: unknown) => setValores((v) => ({ ...v, [chave]: valor }));

  function salvar() {
    const registro: Record<string, unknown> = editando
      ? { ...clonar(porId(spec.colecao, aberto!.id!) || {}), ...valores }
      : { id: uid(spec.prefixoId), ...(spec.padrao || {}), ...valores };
    spec.depois?.(registro);
    salvarRegistro(spec.colecao, registro as never);
    fecharEdicao();
    toast("Salvo");
  }

  function excluir() {
    if (!confirmandoExclusao) { setConfirmandoExclusao(true); return; }
    excluirRegistro(spec.colecao, aberto!.id!);
    fecharEdicao();
    toast("Excluído");
  }

  function campoInput(c: CampoSpec) {
    const v = valores[c.chave];
    const id = "campo-" + c.chave;
    switch (c.tipo) {
      case "textarea":
        return <textarea id={id} value={String(v ?? "")} onChange={(e) => definir(c.chave, e.target.value)} />;
      case "date":
        return <input id={id} type="date" value={String(v ?? "")} onChange={(e) => definir(c.chave, e.target.value)} />;
      case "select":
        return (
          <select id={id} value={String(v ?? "")} onChange={(e) => definir(c.chave, e.target.value)}>
            {(v == null || v === "") && <option value="" />}
            {(c.fonte as string[]).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      case "opts":
        return (
          <select id={id} value={String(v ?? "")} onChange={(e) => definir(c.chave, e.target.value)}>
            {(c.fonte as [string, string][]).map(([val, rot]) => <option key={val} value={val}>{rot}</option>)}
          </select>
        );
      case "ref": {
        const lista = listaDe(c.fonte as ColecaoPainel);
        return (
          <select id={id} value={String(v ?? "")} onChange={(e) => definir(c.chave, e.target.value)}>
            {(v == null || v === "") && <option value="">—</option>}
            {lista.map((o) => <option key={o.id} value={o.id}>{o.nome || o.titulo || o.id}</option>)}
          </select>
        );
      }
      case "origem":
        return (
          <select id={id} value={String(v ?? "")} onChange={(e) => definir(c.chave, e.target.value)}>
            {opcoesOrigem.map(([val, rot]) => <option key={val} value={val}>{rot}</option>)}
          </select>
        );
      case "csv":
        return (
          <input id={id} value={Array.isArray(v) ? (v as string[]).join(", ") : String(v ?? "")}
            onChange={(e) => definir(c.chave, e.target.value)}
            onBlur={(e) => definir(c.chave, e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
        );
      case "lines":
        return (
          <textarea id={id} style={{ minHeight: 96 }}
            value={Array.isArray(v) ? (v as string[]).join("\n") : String(v ?? "")}
            onChange={(e) => definir(c.chave, e.target.value)}
            onBlur={(e) => definir(c.chave, e.target.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean))} />
        );
      case "multi": {
        const selecionados = Array.isArray(v) ? (v as string[]) : [];
        const lista = listaDe(c.fonte as ColecaoPainel);
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", padding: "4px 0" }}>
            {lista.map((o) => (
              <label key={o.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 500, fontSize: 12.5, color: "var(--ink)" }}>
                <input type="checkbox" style={{ width: "auto" }} checked={selecionados.includes(o.id)}
                  onChange={(e) => definir(c.chave, e.target.checked
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
        return <input id={id} value={String(v ?? "")} onChange={(e) => definir(c.chave, e.target.value)} />;
    }
  }

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) fecharEdicao(); }}>
      <div className="modal">
        <h3>{(editando ? "Editar: " : "Novo: ") + spec.titulo}</h3>
        {spec.campos.map((c) => (
          <div className="field" key={c.chave}>
            <label htmlFor={"campo-" + c.chave}>{c.rotulo}</label>
            {campoInput(c)}
          </div>
        ))}
        <div className="mfoot">
          {editando && (
            <button className="del" data-confirmar={confirmandoExclusao || undefined} onClick={excluir}>
              {confirmandoExclusao ? "Confirmar exclusão" : "Excluir"}
            </button>
          )}
          <span className="sp">
            <button className="btn ghost" onClick={fecharEdicao}>Cancelar</button>
            <button className="btn" onClick={salvar}>Salvar</button>
          </span>
        </div>
      </div>
    </div>
  );
}
