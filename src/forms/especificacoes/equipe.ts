/* Formulário de Pessoa da equipe (quem recebe tarefas e convites de reunião). */
import type { EntidadeSpec } from "../tipos";

export const equipe: EntidadeSpec = {
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
};
