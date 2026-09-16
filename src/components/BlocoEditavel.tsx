/* Painel com edição em linha: mostra o conteúdo e, no "editar", vira um
   textarea de texto simples (um item por linha; pares separados por " | ").
   Usado no acervo do artista — mesmo jeitão dos blocos das fichas do Contexto. */
import { useState, type ReactNode } from "react";

interface Props {
  titulo: ReactNode;
  /** Dica do formato ("por linha: ano | texto"). */
  dica: string;
  /** Conteúdo atual já em texto editável. */
  valor: string;
  aoSalvar: (texto: string) => void;
  /** Como o bloco aparece fora da edição. */
  children: ReactNode;
}

export function BlocoEditavel({ titulo, dica, valor, aoSalvar, children }: Props) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");

  return (
    <div className="panel">
      <h4>
        {titulo}
        <span className="act">
          {!editando && (
            <button className="btn ghost sm" onClick={() => { setTexto(valor); setEditando(true); }}>editar</button>
          )}
        </span>
      </h4>
      {editando ? (
        <>
          <textarea className="bloco-edt" autoFocus value={texto}
            rows={Math.max(4, valor.split("\n").length + 2)}
            onChange={(e) => setTexto(e.target.value)} />
          <div className="bloco-edt-f">
            <span className="hint" style={{ margin: 0 }}>{dica}</span>
            <button className="btn sm" onClick={() => { aoSalvar(texto); setEditando(false); }}>Salvar</button>
            <button className="btn ghost sm" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </>
      ) : children}
    </div>
  );
}
