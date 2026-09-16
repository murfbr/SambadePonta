/* Utilitários do Contexto: quem são as entidades (vêm do Painel, pelo mesmo id),
   ficha completa com valores padrão, filtros de regras e o formato de texto
   que circula entre o site e as conversas com o Claude ("Trocar"). */
import { obterEstado } from "../../banco/dados";
import {
  ROTULO_FONTE, ROTULO_TIPO_REGRA, type Ficha, type Julgamento, type Regra, type TipoFicha,
} from "../../tipos";
import { uid } from "../../util";

export const TIPOS_FICHA: Record<TipoFicha, string> = {
  artista: "Artistas e coletivos", projeto: "Projetos", edital: "Editais e leis",
};

/** Entidade "fichável": artista, projeto ou edital do Painel. */
export interface EntidadeContexto {
  id: string;
  tipo: TipoFicha;
  nome: string;
  /** Para projetos: o id do artista (para ligar julgamentos ao artista). */
  artista?: string;
}

/** Entidades de um tipo, direto do Painel. */
export function entidades(tipo: TipoFicha): EntidadeContexto[] {
  const { painel } = obterEstado();
  if (tipo === "artista") return painel.artistas.map((a) => ({ id: a.id, tipo, nome: a.nome }));
  if (tipo === "projeto") return painel.projetos.map((p) => ({ id: p.id, tipo, nome: p.nome, artista: p.artistaId }));
  return painel.editais.map((e) => ({ id: e.id, tipo, nome: e.nome }));
}

/** Procura uma entidade em qualquer um dos três tipos. */
export function entidadePorId(id: string): EntidadeContexto | null {
  for (const t of ["artista", "projeto", "edital"] as TipoFicha[]) {
    const achada = entidades(t).find((x) => x.id === id);
    if (achada) return achada;
  }
  return null;
}

export const nomeDaEntidade = (id: string): string => entidadePorId(id)?.nome || id;

/** Ficha completa de um id, com padrões preenchidos (mesmo sem doc no banco). */
export function fichaDe(id: string): Ficha & { nome: string; artista?: string } {
  const entidade = entidadePorId(id);
  const doBanco = obterEstado().fichas[id] || ({} as Partial<Ficha>);
  const padrao: Ficha = {
    id, tipo: entidade?.tipo || "artista",
    posicionamento: "", argumentos: [], julgador: [], vocabulario: [], usados: [], cuidados: "",
  };
  return Object.assign(padrao, doBanco, { nome: entidade?.nome || id, artista: entidade?.artista });
}

export const temFicha = (id: string): boolean => Boolean(obterEstado().fichas[id]);

/** Regras de um escopo (geral, ou de uma entidade específica). */
export function regrasDe(tipo: string, id?: string): Regra[] {
  return Object.values(obterEstado().regras)
    .filter((r) => r.escopo.tipo === tipo && (tipo === "geral" || r.escopo.id === id));
}

/** Julgamentos, do mais recente para o mais antigo. */
export const julgamentosOrdenados = (): Julgamento[] =>
  Object.values(obterEstado().julgamentos).sort((a, b) => String(b.ano).localeCompare(String(a.ano)));

/** Texto da fonte de uma regra ("fonte: edital, item 5.2"). */
export function textoFonte(fonte: Regra["fonte"]): string {
  const f = fonte || { tipo: "experiencia", ref: "" };
  if (f.tipo === "julgamento") {
    const j = obterEstado().julgamentos[f.ref];
    return "fonte: julgamento " + (j ? nomeDaEntidade(j.edital) + " " + j.ano : f.ref);
  }
  return "fonte: " + (ROTULO_FONTE[f.tipo] || f.tipo) + (f.ref ? ", " + f.ref : "");
}

/* ══════════ o bloco de texto do "Trocar com o Claude" ══════════ */

/** Monta o bloco de contexto em texto para abrir uma conversa de escrita. */
export function montarBloco(ids: string[], comGerais: boolean): string {
  const saida: string[] = [];
  if (comGerais) {
    saida.push("## GERAL");
    regrasDe("geral").forEach((r) =>
      saida.push(`- REGRA [geral] [${r.tipoRegra}] ${r.texto} | fonte: ${ROTULO_FONTE[r.fonte.tipo]}, ${r.fonte.ref}${r.status === "duvida" ? " | a confirmar" : ""}`));
    saida.push("");
  }
  ids.forEach((id) => {
    if (!entidadePorId(id)) return;
    const f = fichaDe(id);
    saida.push(`## FICHA ${f.tipo} ${f.id} · ${f.nome}`);
    if (f.posicionamento) saida.push(`posicionamento: ${f.posicionamento}`);
    if (f.tipo === "edital") (f.julgador || []).forEach((a) => saida.push(`- JULGADOR ${a}`));
    else (f.argumentos || []).forEach((a) => saida.push(`- ARGUMENTO ${a}`));
    (f.vocabulario || []).forEach((v) => saida.push(`- VOCAB usar "${v.usar}" | evitar "${v.evitar}"`));
    (f.usados || []).forEach((u) => saida.push(`- USADO ${u.texto} | onde: ${u.onde} | quando: ${u.quando}`));
    if (f.cuidados) saida.push(`cuidados: ${f.cuidados}`);
    regrasDe(f.tipo, f.id).forEach((r) =>
      saida.push(`- REGRA [${f.tipo} ${f.id}] [${r.tipoRegra}] ${r.texto} | fonte: ${ROTULO_FONTE[r.fonte.tipo]}, ${r.fonte.ref}${r.status === "duvida" ? " | a confirmar" : ""}`));
    julgamentosOrdenados().filter((j) => j.edital === id || j.projeto === id).forEach((j) => {
      saida.push(`## JULGAMENTO ${j.id} · ${nomeDaEntidade(j.edital)} · ${j.projeto ? nomeDaEntidade(j.projeto) : "sem projeto"} · ${j.ano} · ${j.resultado}`);
      if (j.resumo) saida.push(`resumo: ${j.resumo}`);
      (j.fortes || []).forEach((x) => saida.push(`- FORTE ${x}`));
      (j.fracos || []).forEach((x) => saida.push(`- FRACO ${x}`));
      (j.licoes || []).forEach((l) => saida.push(`- LICAO ${l.texto}${l.regra ? " | regra: " + l.regra : ""}`));
    });
    saida.push("");
  });
  return saida.join("\n");
}

export interface BlocoLido {
  fichas: (Ficha & { geral?: boolean })[];
  regras: Regra[];
  julgamentos: Julgamento[];
}

const idPorNome = (tipo: TipoFicha, nome: string): string => {
  if (!nome) return "";
  const n = nome.toLowerCase();
  const e = entidades(tipo).find((x) => x.nome.toLowerCase() === n || n.startsWith(x.nome.toLowerCase().split(" (")[0]));
  return e ? e.id : "";
};

/** Lê um bloco devolvido pelo Claude e devolve fichas, regras e julgamentos. */
export function lerBloco(texto: string): BlocoLido {
  const saida: BlocoLido = { fichas: [], regras: [], julgamentos: [] };
  let fichaAtual: (Ficha & { geral?: boolean }) | null = null;
  let julgAtual: Julgamento | null = null;

  const lerRegra = (linha: string) => {
    const m = linha.match(/^-\s*REGRA\s*\[([^\]]*)\]\s*\[([^\]]*)\]\s*(.*)$/i);
    if (!m) return;
    const escopo = m[1].trim().split(/\s+/);
    const tipoRegraTexto = m[2].trim().toLowerCase();
    const partes = m[3].split("|").map((x) => x.trim());
    let fonte: Regra["fonte"] = { tipo: "experiencia", ref: "" };
    partes.slice(1).forEach((p) => {
      const f = p.match(/^fonte:\s*([^,]+),?\s*(.*)$/i);
      if (f) {
        const ft = f[1].trim().toLowerCase().replace("ê", "e");
        fonte = { tipo: (ROTULO_FONTE as Record<string, string>)[ft] !== undefined ? (ft as Regra["fonte"]["tipo"]) : "experiencia", ref: f[2].trim() };
      }
    });
    const tipoRegra = (Object.keys(ROTULO_TIPO_REGRA) as (keyof typeof ROTULO_TIPO_REGRA)[])
      .find((k) => k === tipoRegraTexto || ROTULO_TIPO_REGRA[k] === tipoRegraTexto) || "dica";
    saida.regras.push({
      id: uid("r"), texto: partes[0],
      escopo: { tipo: (escopo[0] === "geral" ? "geral" : escopo[0]) as Regra["escopo"]["tipo"], id: escopo[1] || "" },
      tipoRegra, fonte,
      status: "duvida", // regra importada entra sempre como "a confirmar"
    });
  };

  texto.split(/\r?\n/).forEach((bruta) => {
    const linha = bruta.trim();
    if (!linha) return;
    let m: RegExpMatchArray | null;
    if (/^##\s*GERAL/i.test(linha)) { fichaAtual = { geral: true } as Ficha & { geral: boolean }; julgAtual = null; return; }
    if ((m = linha.match(/^##\s*FICHA\s+(\w+)\s+([\w-]+)\s*·?\s*(.*)$/i))) {
      fichaAtual = {
        id: m[2], tipo: m[1].toLowerCase() as TipoFicha,
        posicionamento: "", argumentos: [], julgador: [], vocabulario: [], usados: [], cuidados: "",
      };
      saida.fichas.push(fichaAtual);
      julgAtual = null;
      return;
    }
    if ((m = linha.match(/^##\s*JULGAMENTO\s+([\w-]+)\s*·\s*(.*)$/i))) {
      const p = m[2].split("·").map((x) => x.trim());
      julgAtual = {
        id: m[1], edital: idPorNome("edital", p[0]) || "", projeto: idPorNome("projeto", p[1]) || "",
        ano: p[2] || "", resultado: ((p[3] || "aguardando").toLowerCase()) as Julgamento["resultado"],
        nota: "", resumo: "", fortes: [], fracos: [], licoes: [],
      };
      saida.julgamentos.push(julgAtual);
      fichaAtual = null;
      return;
    }
    if (julgAtual) {
      if ((m = linha.match(/^resumo:\s*(.*)$/i))) julgAtual.resumo = m[1];
      else if ((m = linha.match(/^-\s*FORTE\s+(.*)$/i))) julgAtual.fortes.push(m[1]);
      else if ((m = linha.match(/^-\s*FRACO\s+(.*)$/i))) julgAtual.fracos.push(m[1]);
      else if ((m = linha.match(/^-\s*LICAO\s+(.*)$/i))) {
        const p = m[1].split("|").map((x) => x.trim());
        julgAtual.licoes.push({ texto: p[0], regra: (p[1] || "").replace(/^regra:\s*/i, "") });
      }
      return;
    }
    if (!fichaAtual) return;
    if (/^-\s*REGRA/i.test(linha)) { lerRegra(linha); return; }
    if (fichaAtual.geral) return;
    if ((m = linha.match(/^posicionamento:\s*(.*)$/i))) fichaAtual.posicionamento = m[1];
    else if ((m = linha.match(/^cuidados:\s*(.*)$/i))) fichaAtual.cuidados = m[1];
    else if ((m = linha.match(/^-\s*ARGUMENTO\s+(.*)$/i))) fichaAtual.argumentos.push(m[1]);
    else if ((m = linha.match(/^-\s*JULGADOR\s+(.*)$/i))) fichaAtual.julgador.push(m[1]);
    else if ((m = linha.match(/^-\s*VOCAB\s+usar\s+"([^"]*)"\s*\|\s*evitar\s+"([^"]*)"/i))) fichaAtual.vocabulario.push({ usar: m[1], evitar: m[2] });
    else if ((m = linha.match(/^-\s*USADO\s+(.*)$/i))) {
      const p = m[1].split("|").map((x) => x.trim());
      fichaAtual.usados.push({ texto: p[0], onde: (p[1] || "").replace(/^onde:\s*/i, ""), quando: (p[2] || "").replace(/^quando:\s*/i, "") });
    }
  });
  return saida;
}
