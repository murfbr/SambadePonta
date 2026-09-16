/* Formulário de Projeto (de um artista; reúne candidaturas, produção e equipe). */
import type { EntidadeSpec } from "../tipos";

export const projeto: EntidadeSpec = {
  titulo: "Projeto", colecao: "projetos", prefixoId: "p",
  padrao: { producao: [], equipeIds: [] },
  campos: [
    { chave: "nome", rotulo: "Nome" },
    { chave: "artistaId", rotulo: "Artista", tipo: "ref", fonte: "artistas" },
    { chave: "tipo", rotulo: "Tipo", tipo: "select", fonte: ["Carnaval", "Álbum", "Single", "Videoclipe", "Turnê", "Circulação", "Show", "Outro"] },
    { chave: "meta", rotulo: "Meta de captação" },
    { chave: "ano", rotulo: "Janela / ano" },
  ],
};
