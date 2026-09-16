/* Formulário de Colaborador de elenco (músicos e técnicos dos editais). */
import type { EntidadeSpec } from "../tipos";

export const elenco: EntidadeSpec = {
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
};
