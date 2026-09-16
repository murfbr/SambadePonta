/* Formulário de Contato externo (patrocinadores, órgãos, responsáveis). */
import type { EntidadeSpec } from "../tipos";

export const contato: EntidadeSpec = {
  titulo: "Contato externo", colecao: "contatos", prefixoId: "k",
  campos: [
    { chave: "nome", rotulo: "Nome" },
    { chave: "tipo", rotulo: "Tipo" },
    { chave: "ref", rotulo: "Referência" },
    { chave: "contato", rotulo: "Contato" },
  ],
};
