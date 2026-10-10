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
