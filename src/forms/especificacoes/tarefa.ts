/* Formulário de Tarefa (designada à equipe, opcionalmente vinculada). */
import type { EntidadeSpec } from "../tipos";

export const tarefa: EntidadeSpec = {
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
};
