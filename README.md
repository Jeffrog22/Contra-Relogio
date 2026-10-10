# Festival Interno PPt

App de gestão do **Festival Interno de Natação Contra o Relógio (25 m)**: cadastro de atletas via CSV, balizamento automático, cálculo de medalhas por tabela de índices, controle de resultados e análise comparativa entre edições.

## Status do Projeto

![Version](https://img.shields.io/badge/version-0.2.0--dev-blue)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-39%20passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## Tecnologias

- **UI:** React 18 + TypeScript + Vite
- **Estilo:** Tailwind CSS (`darkMode: 'class'`) — Design System "Fizapp" (`identidade visual Fizapp.txt`)
- **Roteamento:** React Router v6
- **Estado:** Zustand (+ `persist` em `localStorage`)
- **CSV:** PapaParse
- **Testes:** Vitest
- **Deploy:** Cloudflare Pages / qualquer host estático (SPA pura, sem backend)

## Pré-requisitos

- Node.js 18+ (testado com Node 24)
- npm 9+

## Como Rodar

```bash
npm install
npm run dev      # http://localhost:5173
```

### Comandos

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Typecheck (`tsc -b`) + build de produção em `dist/` |
| `npm run preview` | Serve o build de produção |
| `npm test` | Roda os testes unitários (Vitest) uma vez |
| `npm run test:watch` | Testes em modo watch |

## Fluxo de Uso

1. **`/carregar`** — envie o CSV de atletas, confira a pré-visualização e clique em **Processar**.
2. **`/lista`** — listagem geral com categoria recalculada pela idade; busca por nome e exportação CSV.
3. **`/balizamento`** — escolha o período (Manhã / Tarde / Geral) e clique em **Executar Balizamento**.
4. **`/controle`** — lance os tempos (máscara `00'00`); a medalha é recalculada na hora. **Imprimir Resultados** gera a folha limpa por série.
5. **`/analise`** — envie CSVs históricos, filtre por atleta/medalha/ano/categoria/gênero e imprima o panorama comparativo.

Os dados ficam em `localStorage` (sem backend). O tema claro/escuro também é persistido.

## Formato dos CSVs

### Entrada (atletas) — `/carregar`

```csv
nome,idade,categoria,genero,horario,professor,nivel,tempo
Julia Barros Camargo,13,Petiz,feminino,manhã,J,Nível 2 B,
Alice Marino Ribeiro,11,Mirim,feminino,manhã,J,Nível 2 B,34.66
```

| Coluna | Obrigatória | Observação |
|---|---|---|
| `nome` | ✅ | Nome completo do atleta |
| `idade` | ✅ | Idade do atleta na edição (1–99) |
| `categoria` | ✅ | Categoria oficial informada (comparada com a calculada) |
| `genero` | ✅ | `feminino` ou `masculino` (aceita acentos/caixa) |
| `horario` | ✅ | `manhã` ou `tarde` |
| `professor` | ✅ | Iniciais ou nome do professor |
| `nivel` | ✅ | Ex.: `Nível 2 B` — usado no agrupamento das séries |
| `tempo` | ❌ | Segundos com 2 casas (`34.66`, `34,66` ou `34'66`); vazio = Sem Tempo |

### Histórico — `/analise`

```csv
ano,aluno,tempo,medalha,categoria,genero
2024,Ana Cristina Goldberger,22.36,PRATA,Petiz,feminino
2025,Ana Cristina Goldberger,19.80,OURO,Infantil,feminino
```

`genero` é opcional. `medalha` aceita `OURO`, `PRATA`, `BRONZE` ou `Sem Tempo`.

### Saída (exportação em `/lista`)

```csv
nome,idade,categoria,categoria_oficial,genero,horario,professor,nivel,tempo,medalha
Alice Marino Ribeiro,11,Petiz,Mirim,feminino,manhã,J,Nível 2 B,34.66,BRONZE
```

## Regras de Negócio (resumo)

- **Categoria** é calculada diretamente da idade (tabela em `src/utils/categorias.ts`), independente do ano — o mesmo app serve qualquer edição. Se a categoria oficial do CSV divergir da calculada, a listagem exibe um selo de divergência. Subclasses/turmas no CSV (`Mirim II`, `Petiz A`) são normalizadas para a categoria-base.
- **Medalha** (`src/utils/medalhas.ts`): compara o tempo com a faixa da categoria **+ gênero**. Tempo vazio, `0` ou não numérico → `Sem Tempo`. Ex.: faixa OURO `< 28,00` significa que `28,00` exato já é PRATA.
- **Balizamento** (`src/utils/balizamento.ts`): feminino primeiro, depois masculino; agrupamento por `categoria + nível`; séries com **apenas 3 ou 4 atletas** (nunca 1 ou 2). Sobras de um grupo se redistribuem com o grupo vizinho do mesmo gênero (ex.: 5+3 → 4+4; 6 → 3+3; 9 → 3+3+3). Raias: série de 4 → `1,2,3,4`; série de 3 → `2,3,4`; **nunca raia 5**. Casos impossíveis (grupo isolado com 1, 2 ou 5 atletas) geram série com selo de aviso.
- **Impressão**: TopBar/Sidebar/botões são ocultos via `@media print`.

## Estrutura do Projeto

```
Contra-Relógio/
├── index.html
├── tailwind.config.js        # paleta primary, dark mode, animação shake
├── vite.config.ts            # Vite + config do Vitest
├── src/
│   ├── main.tsx              # entry (dark mode inicial sem flash)
│   ├── App.tsx               # rotas
│   ├── index.css             # Tailwind + dark inputs + @media print
│   ├── types.ts              # Atleta, Serie, EventoHistorico...
│   ├── utils/                # categorias, medalhas, balizamento, csv (+ testes)
│   ├── store/useAppStore.ts  # Zustand + persist (localStorage)
│   ├── components/
│   │   ├── layout/           # TopBar, Sidebar (recollable), Layout
│   │   └── ui/               # Button, Pill, Input, SearchInput, Card,
│   │                         # Modal, TabelaGenerica, Toast, MedalhaBadge, Badge
│   └── pages/                # Carregar, Lista, Balizamento, Controle, Analise
├── PRD.md                    # requisitos (RF01–RF05)
├── ARCHITECTURE.md           # estrutura de pastas e convenções
├── DEVELOPMENT.md            # SemVer, Conventional Commits, rotina de docs
├── AGENTS.md                 # histórico de sessões (memória do projeto)
├── CHANGELOG.md              # Keep a Changelog
├── identidade visual Fizapp.txt  # fonte da verdade do Design System
├── scripts/                  # kit: init-projeto, nova-sessao
└── templates/                # templates dos docs + hook post-commit
```

## Deploy — Cloudflare Pages

SPA estática sem backend: build em `dist/`, nenhuma variável de ambiente necessária.

### Opção A — Conexão com o GitHub (recomendada, deploy automático)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Selecione o repositório **`Jeffrog22/Contra-Relogio`** (autorize o GitHub se pedir).
3. Configure a build:
   | Campo | Valor |
   |---|---|
   | Framework preset | **Vite** (ou *None*) |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Node version | 18+ (padrão já serve) |
4. **Save and Deploy** → o site fica em `https://contra-relogio.pages.dev`.
5. A partir daí, cada `git push` em `master` gera um deploy automático.

### Opção B — Deploy manual via Wrangler (CLI)

```bash
npm run build                 # gera dist/
npx wrangler login            # autentica no Cloudflare (uma vez)
npx wrangler pages deploy dist --project-name contra-relogio
```

### Rotas SPA (deep links)

O arquivo `public/_redirects` (`/*  /index.html  200`) é copiado para `dist/` em todo build — é ele que faz `/lista`, `/balizamento`, `/controle` etc. voltarem a funcionar ao recarregar a página no Pages. Não é preciso configurar nada no dashboard.

### Domínio próprio (opcional)

Pages → seu projeto → **Custom domains** → **Set up a custom domain** (o DNS do domínio aponta para `contra-relogio.pages.dev`; certificado TLS é automático).

## Kit de Documentação (scripts e templates)

A documentação oficial do projeto segue o kit replicável na raiz:

- **`AGENTS.md`** — único histórico do projeto; o opencode lê automaticamente. Toda sessão é registrada com `scripts/nova-sessao.ps1`.
- **`CHANGELOG.md`** — Keep a Changelog + SemVer.
- **`DEVELOPMENT.md`** — convenções de commits (Conventional Commits) e rotina de registros.
- **`.githooks/post-commit`** — cria a tag SemVer automaticamente a cada commit (feat → MINOR, fix → PATCH, `!` → MAJOR). Habilitado via `git config core.hooksPath .githooks`.

### Registrar uma sessão

```powershell
& ".\scripts\nova-sessao.ps1" -Titulo "Título da sessão" -Itens @("Feito A", "Feito B") -Decisoes @("Decisão X")
```

### Inicializar outro projeto com o mesmo kit

```powershell
& ".\scripts\init-projeto.ps1" -Nome MeuApp -Descricao "..." -Repo "https://github.com/usuario/meuapp"
```

## Troubleshooting

- **Botão de impressão não mostra nada** — verifique se `Sidebar`/`TopBar` estão com classe `no-print` e a área de impressão com `print-area` (CSS em `src/index.css`).
- **Dados sumiram** — tudo fica em `localStorage` (`festival-storage` + `festival-tema`); limpar dados do navegador apaga o estado.
- **CSV rejeitado** — confira o cabeçalho exato (`nome,idade,categoria,genero,horario,professor,nivel,tempo`), o gênero (`feminino|masculino`) e o horário (`manhã|tarde`). Erros linha a linha aparecem no preview.

## Licença

MIT
