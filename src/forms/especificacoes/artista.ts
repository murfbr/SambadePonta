/* Formulário de Artista (bloco, roda, grupo...). */
import type { EntidadeSpec } from "../tipos";

export const artista: EntidadeSpec = {
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
};
