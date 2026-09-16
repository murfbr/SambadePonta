/* Formulário de Reunião (pauta antes, ata depois; participantes viram convites). */
import type { EntidadeSpec } from "../tipos";

export const reuniao: EntidadeSpec = {
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
};
