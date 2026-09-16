# Central do Coletivo

Site de gestão do coletivo cultural: captação de editais, portfólio, agenda,
pessoas, reuniões e tarefas, o **Simulador** de formulários das plataformas
(Cultura Rio, Desenvolve Cultura, Salic/Rouanet) e o **Contexto** de escrita
(fichas, regras e julgamentos) para redigir propostas com IA.

É a versão site do artefato "Central do Coletivo", com os mesmos dados, o mesmo
visual e os mesmos nomes de campos — agora com **React + TypeScript + Firebase**.

## Rodar localmente

```bash
npm install
npm run dev
```

Sem Firebase configurado o site roda em **modo local**: tudo fica salvo no
navegador (localStorage), sem login — bom para desenvolver. Na primeira abertura
o banco é semeado com os dados reais extraídos do artefato (16 artistas,
17 editais, 17 candidaturas...).

## Ligar o Firebase (modo nuvem)

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. **Firestore Database** → Create database (production mode).
3. **Rules**: cole o conteúdo de [firestore.rules](firestore.rules) e publique.
4. **Authentication** → Sign-in method → habilite **Email/Password**.
5. **Authentication** → Users → **Add user** para cada pessoa do coletivo
   (não há auto-cadastro de propósito: só entra quem for cadastrado ali).
6. **Configurações do projeto** → Seus apps → Web (`</>`): copie as credenciais.
7. Copie `.env.exemplo` para `.env` e preencha as variáveis `VITE_FIREBASE_*`.

Com o `.env` preenchido, `npm run dev` já abre com tela de login, dados
sincronizados em tempo real entre todo mundo e cache offline (o site funciona
sem internet e sincroniza quando ela volta).

## Publicar na Vercel

1. Suba o repositório para o GitHub e importe na Vercel (framework: **Vite**).
2. Em **Settings → Environment Variables**, cadastre as mesmas `VITE_FIREBASE_*` do `.env`.
3. Deploy. (Build: `npm run build`, output: `dist` — a Vercel detecta sozinha.)

## Estrutura de dados (Firestore)

Coleções planas, uma por entidade — cada registro é um documento cujo campos
usam **os mesmos nomes do artefato**:

| Coleção        | O que é                                           |
| -------------- | ------------------------------------------------- |
| `artistas`     | blocos, rodas e grupos do portfólio               |
| `projetos`     | projetos de cada artista (→ `artistaId`)          |
| `editais`      | editais e fontes de captação                      |
| `candidaturas` | projeto × edital, o cartão do pipeline (`etapa` 0–7) |
| `tarefas`      | tarefas da equipe (→ `respId`, `origem`)          |
| `equipe`       | pessoas do coletivo (contém CPF/RG — ver LGPD)    |
| `elenco`       | músicos e técnicos que entram nos editais         |
| `contatos`     | contatos externos                                 |
| `reunioes`     | reuniões, pauta e ata                             |
| `rascunhos`    | rascunhos do Simulador (`valores`, `status`, `interno`) |
| `fichas`       | Contexto: conhecimento de escrita (id = id do Painel) |
| `regras`       | Contexto: regras com fonte obrigatória            |
| `julgamentos`  | Contexto: pareceres e lições                      |

Detalhes que diferem do artefato (por limitação do Firestore, que não aceita
array dentro de array): as tuplas viraram arrays de objetos —
`producao: [{texto, status}]`, `det.portfolio: [{ano, texto}]`,
`det.docs: [{nome, status}]`, `det.links: [{rotulo, url}]`,
`vocabulario: [{usar, evitar}]`, `usados: [{texto, onde, quando}]`,
`licoes: [{texto, regra}]`. O importador converte os dois sentidos: o `.json`
exportado do artefato entra direto pelo botão **Importar**.

Campos de manutenção: `_ord` (posição na listagem) e `atualizado` (ISO da última
gravação, usado no último-ganha da sincronização).

## Mapa do código

```
src/
  tipos.ts               ← todas as entidades documentadas (comece por aqui)
  estilos.css            ← CSS portado 1:1 do artefato
  App.tsx                ← casca: login, ambientes, abas, exportar/importar
  banco/
    firebase.ts          ← conexão (env) — sem env = modo local
    banco.ts             ← camada de armazenamento (Firestore ⇄ localStorage)
    dados.ts             ← estado central, semeadura, mutações, export/import
    sessao.ts            ← login e-mail/senha
  estado/
    navegacao.ts         ← ambiente/aba/ficha aberta (o "Shell")
    edicao.ts            ← qual modal de registro está aberto
  blocos/
    EdicaoRegistro.tsx   ← modal genérico de criar/editar registros do Painel
    Login.tsx, Toast.tsx
  ambientes/
    Painel.tsx           ← Resumo + Pendências
    Portfolio.tsx        ← Artistas + Projetos (+ fichas)
    Captacao.tsx         ← Pipeline + Editais (+ fichas)
    Agenda.tsx           ← Cronograma + Calendário
    Pessoas.tsx          ← Elenco + Equipe + Contatos
    Gestao.tsx           ← Reuniões + Tarefas
    simulador/           ← Mesa, Plataformas, Formulário, Orçamento Salic, Transferência
    contexto/            ← Geral, Fichas, Regras, Julgamentos, Trocar com o Claude
  dados/
    semente-*.json       ← dados iniciais (estado do artefato em set/2026)
    formularios.json     ← definições dos 6 formulários replicados
    salic-dados.json     ← catálogos da planilha orçamentária do Salic
    plataformas.json     ← plataformas + registro de formulários
```

## LGPD

`equipe` e `elenco` guardam CPF, RG e data de nascimento (necessários para as
inscrições). Com as regras atuais, qualquer pessoa logada do coletivo lê esses
dados — o combinado do time. Se um dia houver perfis de acesso, o caminho é
mover esses campos para uma subcoleção com regra própria.
