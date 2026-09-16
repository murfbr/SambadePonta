/* Formulário de Candidatura (projeto × edital). Ao salvar, entra na etapa
   Prospecção e ganha o checklist de documentos do mecanismo do edital. */
import { porId } from "../../store/mutacoes";
import { documentosPorMecanismo } from "../../lib/documentos";
import type { Candidatura } from "../../types";
import type { EntidadeSpec } from "../tipos";

export const candidatura: EntidadeSpec = {
  titulo: "Candidatura", colecao: "candidaturas", prefixoId: "c",
  campos: [
    { chave: "projetoId", rotulo: "Projeto", tipo: "ref", fonte: "projetos" },
    { chave: "editalId", rotulo: "Edital", tipo: "ref", fonte: "editais" },
    { chave: "respId", rotulo: "Responsável", tipo: "ref", fonte: "equipe" },
    { chave: "valor", rotulo: "Valor pleiteado" },
    { chave: "linkDrive", rotulo: "Link da pasta da inscrição no Drive" },
  ],
  depois: (r) => {
    const c = r as unknown as Candidatura;
    if (c.etapa == null) c.etapa = 0;
    if (!c.docs) c.docs = documentosPorMecanismo(porId("editais", c.editalId));
  },
};
