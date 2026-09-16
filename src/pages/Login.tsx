/* Tela de entrada (modo nuvem): e-mail e senha do Firebase Auth.
   Não há auto-cadastro — contas são criadas no console do Firebase pelo coletivo. */
import { useState, type FormEvent } from "react";
import { entrar, redefinirSenha } from "../services/sessao";

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [avisoOk, setAvisoOk] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setErro(""); setAvisoOk(""); setEntrando(true);
    try {
      await entrar(email, senha);
      // O App troca de tela sozinho quando a sessão muda.
    } catch (ex) {
      setErro((ex as Error).message);
    } finally {
      setEntrando(false);
    }
  }

  async function aoEsquecer() {
    setErro(""); setAvisoOk("");
    if (!email.trim()) { setErro("Digite o e-mail primeiro, aí eu envio o link"); return; }
    try {
      await redefinirSenha(email);
      setAvisoOk("Enviei o link de redefinição para " + email.trim());
    } catch (ex) {
      setErro((ex as Error).message);
    }
  }

  return (
    <div className="login-fundo">
      <form className="login-caixa" onSubmit={aoEnviar}>
        <h1>Central do Coletivo</h1>
        <p className="sub">captação, escrita e contexto dos projetos culturais</p>
        {erro && <div className="erro">{erro}</div>}
        {avisoOk && <div className="aviso-ok">{avisoOk}</div>}
        <div className="field">
          <label htmlFor="login-email">E-mail</label>
          <input id="login-email" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="login-senha">Senha</label>
          <input id="login-senha" type="password" autoComplete="current-password" value={senha}
            onChange={(e) => setSenha(e.target.value)} />
        </div>
        <button className="btn" type="submit" disabled={entrando}>
          {entrando ? "Entrando…" : "Entrar"}
        </button>
        <button className="esqueci" type="button" onClick={aoEsquecer}>Esqueci a senha</button>
        <p className="rodape">Sem conta? Peça a quem administra o coletivo para criar a sua no painel do Firebase.</p>
      </form>
    </div>
  );
}
