/* Ler e gerar CSV (planilhas): detecção do separador, aspas com quebra de
   linha, BOM, e a decodificação de arquivos salvos pelo Excel brasileiro
   (windows-1252, quando não for UTF-8). */

/** Bytes do arquivo → texto: tenta UTF-8; se inválido, windows-1252 (Excel pt-BR). */
export function decodificarTexto(buf: ArrayBuffer): string {
  try { return new TextDecoder("utf-8", { fatal: true }).decode(buf); }
  catch { return new TextDecoder("windows-1252").decode(buf); }
}

/** Ocorrências de `sep` fora de aspas. */
function contarFora(linha: string, sep: string): number {
  let n = 0, aspas = false;
  for (const ch of linha) {
    if (ch === '"') aspas = !aspas;
    else if (ch === sep && !aspas) n++;
  }
  return n;
}

/** Separador mais provável da primeira linha: ; , ou tabulação. */
function detectarSeparador(texto: string): string {
  const fim = texto.indexOf("\n");
  const linha = fim === -1 ? texto : texto.slice(0, fim);
  let melhor = ";", max = 0;
  for (const s of [";", ",", "\t"]) {
    const n = contarFora(linha, s);
    if (n > max) { max = n; melhor = s; }
  }
  return melhor;
}

/** CSV → matriz de células. Linhas totalmente vazias são descartadas. */
export function lerCsv(texto: string): string[][] {
  texto = texto.replace(/^﻿/, "");
  // O Excel às vezes abre o arquivo com uma linha "sep=;" — ela define o separador.
  let sep = "";
  const m = texto.match(/^sep=(.)\r?\n/i);
  if (m) { sep = m[1]; texto = texto.slice(m[0].length); }
  sep = sep || detectarSeparador(texto);
  const linhas: string[][] = [];
  let linha: string[] = [], celula = "", aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (aspas) {
      if (ch === '"') {
        if (texto[i + 1] === '"') { celula += '"'; i++; }
        else aspas = false;
      } else celula += ch;
    } else if (ch === '"') {
      aspas = true;
    } else if (ch === sep) {
      linha.push(celula); celula = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && texto[i + 1] === "\n") i++;
      linha.push(celula); celula = "";
      linhas.push(linha); linha = [];
    } else {
      celula += ch;
    }
  }
  if (celula !== "" || linha.length) { linha.push(celula); linhas.push(linha); }
  return linhas.filter((l) => l.some((c) => c.trim() !== ""));
}

/** Matriz → texto CSV que o Excel pt-BR abre direto (BOM, ";" e CRLF). */
export function gerarCsv(linhas: (string | number)[][]): string {
  const celula = (v: string | number) => {
    const t = String(v ?? "");
    return /[";\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  };
  return "﻿" + linhas.map((l) => l.map(celula).join(";")).join("\r\n");
}
