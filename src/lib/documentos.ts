/* Checklist de documentos padrão de uma candidatura, derivada do mecanismo do
   edital (renúncia fiscal pede cartas de anuência, patrocínio pede media kit...). */
import type { Edital, ItemChecklist } from "../types";

export function documentosPorMecanismo(edital?: Edital): ItemChecklist[] {
  const M: Record<string, string[]> = {
    "Renúncia fiscal": ["Projeto técnico", "Planilha orçamentária", "Portfólio", "Documentos do proponente", "Cartas de anuência"],
    "Renúncia + direto": ["Projeto técnico", "Planilha orçamentária", "Portfólio", "Documentos do proponente"],
    "Fomento direto": ["Formulário de inscrição", "Plano de trabalho", "Portfólio", "Documentos do proponente"],
    "Patrocínio": ["Apresentação / media kit", "Projeto", "Contrapartidas", "Documentos do proponente"],
    "Incentivo público": ["Cadastro atualizado", "Comprovante de desfiles anteriores", "Documentos do bloco"],
  };
  return (M[edital?.mec || ""] || ["Projeto", "Portfólio", "Documentos do proponente"])
    .map((nome) => ({ nome, ok: false }));
}
