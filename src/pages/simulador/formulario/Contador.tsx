/* Contador de caracteres com aviso perto do limite (90%) e no estouro. */

export function Contador({ atual, max }: { atual: number; max?: number }) {
  const classe = max && atual >= max ? " over" : max && atual >= max * 0.9 ? " perto" : "";
  return <span className={"cont" + classe}>{atual}{max ? " / " + max : " caracteres · sem limite"}</span>;
}
