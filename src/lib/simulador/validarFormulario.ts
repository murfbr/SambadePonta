/* Validação de uma definição de formulário colada no "Importar formulário":
   confere a estrutura (etapas → blocos → campos) e os tipos de campo que o
   motor desta versão conhece. Erros impedem a importação; avisos não. */
import { PLATAFORMAS } from "../../data";
import { clonar } from "../../utils";
import type { CampoFormulario, Formulario, TipoCampo } from "../../types";

const TIPOS_CAMPO: TipoCampo[] = [
  "txt", "ta", "sel", "rad", "chk", "date", "rep", "docs", "anexo", "orc", "orcresumo", "info",
];

export interface ValidacaoFormulario {
  erros: string[];
  avisos: string[];
  /** A definição pronta para gravar (null quando há erro). */
  formulario: Formulario | null;
  resumo: { id: string; nome: string; plataforma: string; etapas: number; campos: number } | null;
}

export function validarFormulario(texto: string): ValidacaoFormulario {
  const erros: string[] = [];
  const avisos: string[] = [];
  const falha = (): ValidacaoFormulario => ({ erros, avisos, formulario: null, resumo: null });

  if (texto.length > 900_000) {
    erros.push("Definição grande demais (limite de ~900 KB por formulário — o teto de documento do Firestore).");
    return falha();
  }

  let bruto: unknown;
  try { bruto = JSON.parse(texto); } catch {
    erros.push("Isso não é um JSON válido — confira vírgulas, aspas e chaves.");
    return falha();
  }
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) {
    erros.push("O JSON precisa ser um objeto com id, nome, plataforma e etapas.");
    return falha();
  }

  // Aceita também o embrulho { "id-do-form": {...} } com um único formulário dentro.
  let objeto = bruto as Record<string, unknown>;
  if (!objeto.etapas) {
    const valores = Object.values(objeto);
    if (valores.length === 1 && valores[0] && typeof valores[0] === "object"
      && (valores[0] as Record<string, unknown>).etapas) {
      objeto = valores[0] as Record<string, unknown>;
      avisos.push("O JSON veio embrulhado num objeto externo — usei o formulário de dentro.");
    }
  }

  const f = clonar(objeto) as unknown as Formulario;

  if (typeof f.id !== "string" || !f.id.trim()) {
    erros.push('Falta o campo `id` (texto curto e único, ex. "dc-140").');
  } else {
    f.id = f.id.trim();
    if (/[/\s]/.test(f.id)) erros.push("O `id` não pode ter barra nem espaço (ele vira o id do documento no banco).");
  }
  if (typeof f.nome !== "string" || !f.nome.trim()) erros.push("Falta o campo `nome` (o nome do formulário).");
  if (typeof f.plataforma !== "string" || !f.plataforma.trim()) {
    erros.push('Falta o campo `plataforma` (ex. "dc", "cr", "salic").');
  } else if (!PLATAFORMAS.some((p) => p.id === f.plataforma)) {
    avisos.push(`Plataforma "${f.plataforma}" não está no catálogo — o nome dela vai aparecer como o próprio id.`);
  }
  if (!Array.isArray(f.etapas) || !f.etapas.length) {
    erros.push("Falta `etapas`: uma lista com pelo menos uma etapa ({ id, nome, blocos: [...] }).");
    return falha();
  }

  let totalCampos = 0;
  const validarCampos = (listaCampos: CampoFormulario[], onde: string, dentroDeRep: boolean) => {
    listaCampos.forEach((c, ci) => {
      const rotulo = `${onde}, campo ${ci + 1}` + (c?.l ? ` ("${c.l}")` : "");
      if (!c || typeof c !== "object") { erros.push(`${rotulo}: não é um objeto.`); return; }
      if (!c.t) { erros.push(`${rotulo}: falta o tipo \`t\`.`); return; }
      if (!TIPOS_CAMPO.includes(c.t)) {
        erros.push(`${rotulo}: tipo "${c.t}" desconhecido nesta versão do site (tipos válidos: ${TIPOS_CAMPO.join(", ")}).`);
        return;
      }
      if (c.t !== "info" && !c.n) avisos.push(`${rotulo}: sem \`n\` (name) — não guarda valor nem conta no progresso.`);
      if (c.n) totalCampos++;
      if ((c.t === "sel" || c.t === "rad" || c.t === "chk") && !c.opts?.length && !c.grupos?.length) {
        avisos.push(`${rotulo}: tipo "${c.t}" sem \`opts\` — vai aparecer vazio.`);
      }
      if (c.quando && (typeof c.quando.n !== "string" || !Array.isArray(c.quando.v))) {
        avisos.push(`${rotulo}: \`quando\` fora do formato { n, v: [...] } — a condição será ignorada.`);
      }
      if (c.t === "rep") {
        if (dentroDeRep) avisos.push(`${rotulo}: lista repetível dentro de outra — o site não desenha esse aninhamento.`);
        else if (!Array.isArray(c.campos) || !c.campos.length) avisos.push(`${rotulo}: lista repetível sem \`campos\`.`);
        else validarCampos(c.campos, rotulo, true);
      }
    });
  };

  f.etapas.forEach((e, ei) => {
    const onde = `etapa ${ei + 1}` + (e?.nome ? ` ("${e.nome}")` : "");
    if (!e || typeof e !== "object") { erros.push(`${onde}: não é um objeto.`); return; }
    if (!e.nome) erros.push(`${onde}: falta o \`nome\`.`);
    if (!e.id) { e.id = "e" + (ei + 1); avisos.push(`${onde}: sem \`id\` — usei "${e.id}".`); }
    if (!Array.isArray(e.blocos)) { erros.push(`${onde}: falta \`blocos\` (lista de { t, campos: [...] }).`); return; }
    e.blocos.forEach((b, bi) => {
      const ondeB = `${onde}, bloco ${bi + 1}` + (b?.t ? ` ("${b.t}")` : "");
      if (!b || typeof b !== "object") { erros.push(`${ondeB}: não é um objeto.`); return; }
      if (b.t == null) { b.t = ""; avisos.push(`${ondeB}: sem título \`t\`.`); }
      if (!Array.isArray(b.campos)) { erros.push(`${ondeB}: falta \`campos\`.`); return; }
      validarCampos(b.campos, ondeB, false);
    });
  });

  if (erros.length) return falha();
  return {
    erros, avisos, formulario: f,
    resumo: { id: f.id, nome: f.nome, plataforma: f.plataforma, etapas: f.etapas.length, campos: totalCampos },
  };
}
