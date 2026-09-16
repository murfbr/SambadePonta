/* Roteia o conteúdo dos ambientes do Painel: ou uma ficha de detalhe aberta
   (artista, projeto, candidatura, edital, reunião), ou a visão da aba ativa. */
import { useEffect } from "react";
import { porId, usarCentral } from "../banco/dados";
import { fecharDetalhe, usarNavegacao } from "../estado/navegacao";
import { VisaoResumo, VisaoPendencias } from "./Painel";
import { VisaoArtistas, VisaoProjetos, FichaArtista, FichaProjeto } from "./Portfolio";
import { VisaoPipeline, VisaoEditais, FichaEdital, FichaCandidatura } from "./Captacao";
import { VisaoCronograma, VisaoCalendario } from "./Agenda";
import { VisaoElenco, VisaoEquipe, VisaoContatos } from "./Pessoas";
import { VisaoReunioes, VisaoTarefas, FichaReuniao } from "./Gestao";
import type { ColecaoPainel } from "../tipos";

const COLECAO_DO_DETALHE: Record<string, ColecaoPainel> = {
  artista: "artistas", projeto: "projetos", cand: "candidaturas", edital: "editais", reuniao: "reunioes",
};

export function AmbientePainel() {
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
    case "resumo": return <VisaoResumo />;
    case "pendencias": return <VisaoPendencias />;
    case "artistas": return <VisaoArtistas />;
    case "projetos": return <VisaoProjetos />;
    case "pipeline": return <VisaoPipeline />;
    case "editais": return <VisaoEditais />;
    case "cronograma": return <VisaoCronograma />;
    case "calendario": return <VisaoCalendario />;
    case "elenco": return <VisaoElenco />;
    case "equipe": return <VisaoEquipe />;
    case "contatos": return <VisaoContatos />;
    case "reunioes": return <VisaoReunioes />;
    case "quadro": return <VisaoTarefas />;
    default: return <VisaoResumo />;
  }
}
