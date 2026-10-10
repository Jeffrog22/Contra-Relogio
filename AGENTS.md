<!-- última-sessão: 10/10/2026 — projeto iniciado com o kit de documentação → v0.1.0 -->
# AGENTS.md — Histórico Completo do Projeto

## Regras de Ouro

- **Report style**: ao finalizar, responder com `Done.` + bullets do que foi feito + `commit hash + tag → destino` (nunca omitir bullets).
  Ex:
  ```
  Done.
  - Corrige A
  - Adiciona B
  `abc123 + v1.9.20 → origin/master`
  ```
- **AGENTS.md é o único histórico**: SESSION.md não existe mais. Toda sessão registrada aqui.
- **Commits + Push**: ao receber "done" (ou "anote ai! done", "done + commit tag destino", etc), executar automaticamente o ciclo completo: `git add -A → git commit -m "..." → git push origin master && git push origin <tag>`. Sempre. Sem perguntar. **Nunca perguntar se deve push** — fazer sempre.

## Versionamento Semântico (SemVer 2.0.0)

O post-commit hook (.githooks/post-commit) detecta automaticamente o bump baseado na mensagem do commit (Conventional Commits):

| Mensagem do commit | Bump | Exemplo |
|---|---|---|
| `BREAKING CHANGE` no body ou `!:` no subject | **MAJOR** (vX.0.0) | `feat!: remove deprecated endpoint` |
| `feat:` no subject | **MINOR** (v0.X.0) | `feat: add new feature` |
| `fix:`, `refactor:`, `chore:`, `docs:`, etc | **PATCH** (v0.0.X) | `fix: corrige calculo` |

Regras:
- **MAJOR**: mudança incompatível na API ou no banco (breaking change)
- **MINOR**: adição de funcionalidade retrocompatível
- **PATCH**: correção de bugs e pequenas melhorias
- O hook usa `git log -1` para ler a mensagem do commit recém-criado
- Tags conflitantes (orphan) são puladas automaticamente (loop `while` incrementa PATCH)

## Identidade
- **Nome:** Festival Interno PPt
- **Descrição:** App de gestão do Festival Interno de Natação Contra o Relógio (25 m)
- **Repositório:** `https://github.com/Jeffrog22/Contra-Relogio`
- **Versão atual:** v0.2.0
- **Stack:** SPA React 18 + TypeScript + Vite, Tailwind CSS (darkMode: class), React Router v6, Zustand, PapaParse, Vitest
- **Deploy:** Cloudflare Pages (frontend puro, sem backend)
- **Ferramenta de IA:** opencode (lê este arquivo automaticamente)

---

## Sumário de Arquivos Relevantes

| Arquivo | Função |
|---------|--------|
| `ARCHITECTURE.md` | Estrutura de pastas e camadas do SPA |
| `CHANGELOG.md` | Histórico de versões |
| `PRD.md` | Requisitos do produto (RF01–RF05, regras de negócio) |
| `DEVELOPMENT.md` | Diretrizes de desenvolvimento |
| `AGENTS.md` | Histórico completo do projeto (substitui SESSION.md) |
| `identidade visual Fizapp.txt` | **Fonte da verdade** do Design System (seguir à risca) |
| `scripts/` | Kit: init-projeto, nova-sessao |
| `templates/` | Templates dos docs oficiais + hook post-commit |
| `src/utils/` | categorias, medalhas, balizamento, csv |
| `src/components/` | Design System (ui/) e layout (TopBar, Sidebar) |
| `src/pages/` | As 5 telas |
| `src/store/` | Zustand + persist (localStorage) |
| `tailwind.config.js` | Paleta primary, dark mode, animação shake |

---

## Contexto Crítico (Conhecimento Adquirido)

> Descobertas importantes que uma IA nova precisa saber antes de mexer no código.
> Regra: se uma IA nova ler só o `AGENTS.md`, ela deve conseguir trabalhar no projeto sem ler `git log`.

- **Tailwind é 3.4 fixado** (não 4.x): o Design System exige `tailwind.config.js` com `darkMode: 'class'` + keyframes `shake`. Não migrar para Tailwind 4 sem refatorar o setup.
- **Design System tem fonte da verdade**: `identidade visual Fizapp.txt`. Nenhuma cor fora da paleta `primary`/semânticas; sempre variantes `dark:`; `bg-primary-600` (nunca `bg-blue-600`) para ação primária.
- **Categoria é independente de ano**: a idade vem no CSV (não há `ano_nascimento`); `categoriaCalculada = tabela(idade)` em `src/utils/categorias.ts`. `categoriaOficial` vem do CSV e serve só para auditoria (flag `divergencia`).
- **Formato do CSV de entrada**: `nome,idade,categoria,genero,horario,professor,nivel,tempo` (tempo opcional). O PRD/prompt original mencionava `ano_nascimento` — **desatualizado**; o formato atual é o deste README.
- **Balizamento**: séries só com 3 ou 4 atletas; sobras (1, 2 ou 5 no grupo) se redistribuem com o grupo vizinho do mesmo gênero; casos impossíveis (1, 2 ou 5 atletas isolados) geram série com `aviso` — nunca quebrar o fluxo. Raias: 4→[1,2,3,4], 3→[2,3,4], nunca 5. Algoritmo + testes em `src/utils/balizamento.ts`.
- **Limites de medalha são estritos no OURO**: faixa "OURO < 28,00" significa que 28,00 exato já é PRATA; 30,00 ainda é PRATA (inclusivo); 30,01 é BRONZE. Mesma lógica nas demais faixas (`src/utils/medalhas.ts`).
- **Persistência**: Zustand `persist` na chave `festival-storage`; tema também em `festival-tema` (lido em `main.tsx` para evitar flash do dark mode).
- **Impressão**: chrome com classe `no-print`; áreas de impressão com `print-area` (+ wrapper `hidden print:block`). CSS em `src/index.css` (`@media print`).
- **Testes**: Vitest em ambiente `node` (testes só de `src/utils/**`, co-localizados `*.test.ts`); `npm test` deve passar com 0 falhas antes de qualquer commit.
- **CSV tolera BOM UTF-8**: Excel/Notepad/VS Code salvam "UTF-8 with BOM" (EF BB BF) e o BOM vira `\uFEFF` no primeiro header (`\uFEFFano`), quebrando validação de coluna obrigatória. `removerBOM()` em `src/utils/csv.ts` stripa na entrada dos dois parsers e `chave()` remove `\uFEFF` residual — **não depender do PapaParse** para isso (o fix deles só veio na 5.5.4).
- **Sinônimos de coluna CSV**: histórico aceita `atleta`→`aluno`; atletas aceita `aluno`/`atleta`→`nome` (mapas `ALIASES_*` aplicados no `transformHeader`). Arquivos reais do Excel usam `;` como delimitador (Papa auto-detecta) e podem nomear a coluna diferente do PRD — validar sempre com o arquivo real do usuário quando possível.
- **Versão exibida no app**: `__APP_VERSION__` é injetado pelo `define` do `vite.config.ts` via `git describe --tags --abbrev=0` (tag real). O hook post-commit **não** sincroniza o `package.json` — ele é só fallback (para CI/Pages sem tags) e deve ser atualizado manualmente junto com a tag.
- **Typo perigoso já acontecido**: `obrigigatoria` vs `obrigatoria` em interpolação de template string causou `ReferenceError` silencioso só no runtime dos testes — revisar identificadores com acento/typos ao revisar diffs.
- **Repo usa o kit de documentação**: hook `.githooks/post-commit` cria tags SemVer; sessões registradas via `scripts/nova-sessao.ps1`; nunca criar SESSION.md.

---

## Sessão: 10/10/2026 — Início do Projeto

### O que foi feito
- Projeto iniciado a partir do kit de documentação replicável
- Estrutura de pastas e documentação base criadas

### Decisões
- ...

### Arquivos
- `CHANGELOG.md` (v0.1.0)
- `AGENTS.md` (esta sessão)

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 10/10/2026 — SPA completo — 5 telas, Design System, balizamento e medalhas

### O que foi feito
- Docs oficiais: git init + hooksPath, init-projeto.ps1 (AGENTS/CHANGELOG/DEVELOPMENT), PRD.md renomeado, ARCHITECTURE.md criado, README do app com formatos de CSV
- Scaffold Vite + React 18 + TS + Tailwind 3.4 na raiz (paleta primary, dark mode class, shake, theme-color)
- Núcleo de domínio: categorias (idade→categoria), medalhas (tabelas fem/masc + parse/máscara de tempo), balizamento (séries 3/4, redistribuição, raias 1-4), csv (parse/export validado)
- Design System Fizapp: Button, Pill, Input, SearchInput, Card, Modal, TabelaGenerica, Toast, MedalhaBadge, Badge + TopBar e Sidebar recolhível
- Store Zustand + persist (festival-storage) com dark mode anti-flash (festival-tema)
- 5 rotas: /carregar, /lista, /balizamento, /controle, /analise com impressão (@media print)
- 41 testes Vitest passando (medalha, categoria, balizamento 1-10 atletas, CSV e exemplos do repo) + build tsc/vite OK
- CSVs de exemplo em exemplos/ validados por teste automatizado

### Decisões
- Categoria independente de ano: idade vem no CSV, categoria calculada pela tabela; categoriaOficial só para auditoria (divergencia)
- Balizamento redistribui sobras com grupo vizinho do mesmo gênero; 1/2/5 isolados viram série com aviso em vez de quebrar o fluxo
- Coluna 'cód' do PRD trocada por 'categoria' (pedido do usuário)
- Tailwind fixado em 3.4 (spec exige tailwind.config.js + darkMode class)
- README da raiz reescrito como doc do app, mantendo seção do kit de documentação

### Arquivos
- `package.json`
- `vite.config.ts`
- `tailwind.config.js`
- `src/types.ts`
- `src/utils/categorias.ts`
- `src/utils/medalhas.ts`
- `src/utils/balizamento.ts`
- `src/utils/csv.ts`
- `src/store/useAppStore.ts`
- `src/components/layout/*`
- `src/components/ui/*`
- `src/pages/*`
- `src/App.tsx`
- `src/index.css`
- `README.md`
- `ARCHITECTURE.md`
- `CHANGELOG.md`
- `AGENTS.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 10/10/2026 — Fix: upload de CSV com BOM UTF-8 falhava na validação

### O que foi feito
- `src/utils/csv.ts`: helper `removerBOM()` (`texto.replace(/^\uFEFF+/, '')`) aplicado antes do `Papa.parse` em `lerTabela()` (atletas) e `parseCSVHistorico()`; `chave()` agora remove `\uFEFF` em qualquer posição do header
- `src/utils/csv.test.ts`: 2 testes de regressão (BOM no início do CSV de atletas e do histórico) — 43 testes passando
- `CHANGELOG.md`: entrada em `[Unreleased] → Fixed`

### Decisões
- Tolerância ao BOM é responsabilidade do app, não do PapaParse (fix deles só na 5.5.4; `package.json` permite `^5.4.1`)
- `exportCSV` continua gravando BOM de propósito (compatibilidade Excel) — não remover

### Arquivos
- `src/utils/csv.ts`
- `src/utils/csv.test.ts`
- `CHANGELOG.md`
- `AGENTS.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 10/10/2026 — Fix: arquivo real ResultadoHistoricoGeral.csv (coluna `atleta` + `;`)

### O que foi feito
- Análise do arquivo real na raiz: BOM e delimitador `;` já tolerados; **único erro restante era `Coluna obrigatória ausente: "aluno"`** — o arquivo usa `atleta` no cabeçalho (`ano;atleta;tempo;medalha;categoria`)
- `src/utils/csv.ts`: mapas `ALIASES_HISTORICO` (`atleta→aluno`) e `ALIASES_ATLETAS` (`aluno`/`atleta→nome`) aplicados no `transformHeader` (normaliza `meta.fields` e os dados de uma vez); `mensagemColunaAusente()` lista os sinônimos; detecção de cabeçalho repetido agora cobre os sinônimos
- `src/utils/csv.test.ts`: +4 testes (histórico com BOM+`;`+`atleta` fiel ao arquivo real com cabeçalho repetido; atletas com `aluno`/`atleta` no lugar de `nome`; mensagens de coluna ausente com sinônimos) — 47 testes passando
- Validação e2e com o arquivo real (simulação read-only do pipeline): **97 eventos, 0 erros**
- `CHANGELOG.md` + `AGENTS.md` (Contexto Crítico e esta sessão)

### Decisões
- Aliases no `transformHeader`, não pós-parse: resolve campo obrigatório e registros simultaneamente sem lógica duplicada
- Colisão de sinônimos (`aluno` + `atleta` no mesmo arquivo) é resolvida pelo Papa (`nome_1`), sem quebra
- `ResultadoHistoricoGeral.csv` (dados de alunos) **não entra no git**

### Arquivos
- `src/utils/csv.ts`
- `src/utils/csv.test.ts`
- `CHANGELOG.md`
- `AGENTS.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 10/10/2026 — Badge de versão no TopBar (git describe → build)

### O que foi feito
- `vite.config.ts`: `define: { __APP_VERSION__ }` com `obterVersao()` — lê a tag Git real via `git describe --tags --abbrev=0` (stderr silenciado) e cai para `package.json` no catch (CI/Pages sem tags)
- `src/vite-env.d.ts` (novo): `declare const __APP_VERSION__: string` + referência `vite/client`
- `package.json`: versão alinhada para `0.3.2` (fallback correto)
- `src/components/ui/Badge.tsx`: prop opcional `className` (retrocompatível)
- `src/components/layout/TopBar.tsx`: `<span className="ml-2 align-middle text-[10px] font-normal text-gray-400 dark:text-gray-500">v{__APP_VERSION__}</span>` logo após o nome do app (texto puro, sem Badge — pedido do usuário)
- Verificação: 47 testes OK, `tsc -b` 0 erros, `npm run build` OK com `0.3.2` presente no bundle

### Decisões
- Hook post-commit não mexe em `package.json` (só cria tag) — sincronização manual documentada no Contexto Crítico
- Badge segue o DS (tom cinza de `identidade visual Fizapp.txt` §Badges), reduzido para `text-[10px]` para ficar discreto
- Prop `className` do Badge mantida (genérica, retrocompatível) mesmo após troca do TopBar por texto puro

### Arquivos
- `vite.config.ts`
- `src/vite-env.d.ts`
- `package.json`
- `src/components/ui/Badge.tsx`
- `src/components/layout/TopBar.tsx`
- `CHANGELOG.md`
- `AGENTS.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros
