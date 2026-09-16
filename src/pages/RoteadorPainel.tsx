/* Roteia o conteúdo dos ambientes de gestão (Painel, Portfólio, Captação,
   Agenda, Pessoas, Gestão): ou uma ficha de detalhe aberta, ou a tela da aba. */
import { useEffect } from "react";
import { usarCentral } from "../store/central";
import { porId } from "../store/mutacoes";
import { fecharDetalhe, usarNavegacao } from "../store/navegacao";
import { Resumo } from "./painel/Resumo";
import { Pendencias } from "./painel/Pendencias";
import { ListaArtistas } from "./portfolio/ListaArtistas";
import { FichaArtista } from "./portfolio/FichaArtista";
import { ListaProjetos } from "./portfolio/ListaProjetos";
import { FichaProjeto } from "./portfolio/FichaProjeto";
import { Pipeline } from "./captacao/Pipeline";
import { ListaEditais } from "./captacao/ListaEditais";
import { FichaEdital } from "./captacao/FichaEdital";
import { FichaCandidatura } from "./captacao/FichaCandidatura";
import { Cronograma } from "./agenda/Cronograma";
import { Calendario } from "./agenda/Calendario";
import { Elenco } from "./pessoas/Elenco";
import { Equipe } from "./pessoas/Equipe";
import { Contatos } from "./pessoas/Contatos";
import { Reunioes } from "./gestao/Reunioes";
import { FichaReuniao } from "./gestao/FichaReuniao";
import { QuadroTarefas } from "./gestao/QuadroTarefas";
import type { ColecaoPainel } from "../types";

const COLECAO_DO_DETALHE: Record<string, ColecaoPainel> = {
  artista: "artistas", projeto: "projetos", cand: "candidaturas", edital: "editais", reuniao: "reunioes",
};

export function RoteadorPainel() {
  const nav = usarNavegacao();
  usarCentral(); // re-renderiza este roteador quando os dados mudam

  // Se o registro da ficha aberta sumiu (excluído em outra aba), volta para a lista.
  const detalheValido = nav.detalhe && porId(COLECAO_DO_DETALHE[nav.detalhe.tipo], nav.detalhe.id);
  useEffect(() => {
    if (nav.detalhe && !detalheValido) fecharDetalhe();
  }, [nav.detalhe, detalheValido]);

  if (nav.detalhe && detalheValido) {
    switch (nav.detalhe.tipo) {
      case "artista": return <FichaArtista id={nav.detalhe.id} sub={nav.detalhe.sub || "geral"} />;
      case "projeto": return <FichaProjeto id={nav.detalhe.id} sub={nav.detalhe.sub || "geral"} />;
      case "edital": return <FichaEdital id={nav.detalhe.id} sub={nav.detalhe.sub || "geral"} />;
      case "cand": return <FichaCandidatura id={nav.detalhe.id} />;
      case "reuniao": return <FichaReuniao id={nav.detalhe.id} />;
    }
  }

  switch (nav.aba) {
    case "resumo": return <Resumo />;
    case "pendencias": return <Pendencias />;
    case "artistas": return <ListaArtistas />;
    case "projetos": return <ListaProjetos />;
    case "pipeline": return <Pipeline />;
    case "editais": return <ListaEditais />;
    case "cronograma": return <Cronograma />;
    case "calendario": return <Calendario />;
    case "elenco": return <Elenco />;
    case "equipe": return <Equipe />;
    case "contatos": return <Contatos />;
    case "reunioes": return <Reunioes />;
    case "quadro": return <QuadroTarefas />;
    default: return <Resumo />;
  }
}
