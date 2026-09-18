/* Formulário de Edital / fonte de captação — o mais completo do Painel. */
import { registroCompleto } from "../../data";
import type { EntidadeSpec } from "../tipos";

export const edital: EntidadeSpec = {
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
      // Função: a lista sai do banco na hora de desenhar (formulário importado já aparece).
      fonte: () => ([["", "— nenhum"]] as [string, string][])
        .concat(registroCompleto().filter((x) => x.migrado).map((x) => [x.id, x.nome] as [string, string])),
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
};
