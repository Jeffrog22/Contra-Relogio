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
- **Nome:** Festival Interno
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
- **Categoria do CSV governa tudo**: `categoriaOficial` (coluna `categoria`) rege medalha, balizamento, séries e telas — a regra real do festival é o **ano de nascimento**, que não vem no CSV, então a idade não decide. `categoriaCalculada` (tabela por idade em `categorias.ts`) ficou só como referência interna (não governa nada; o selo de divergência foi removido).
- **Formato do CSV de entrada**: `nome,idade,categoria,genero,horario,professor,nivel,tempo` (tempo opcional). O PRD/prompt original mencionava `ano_nascimento` — **desatualizado**; o formato atual é o deste README.
- **Balizamento**: séries só com 3 ou 4 atletas; sobras (1, 2 ou 5 no grupo) se redistribuem com o grupo vizinho do mesmo gênero; casos impossíveis (1, 2 ou 5 atletas isolados) geram série com `aviso` — nunca quebrar o fluxo. Raias: 4→[1,2,3,4], 3→[2,3,4], nunca 5. Algoritmo + testes em `src/utils/balizamento.ts`.
- **Balizamento roda automático**: `setPeriodo`/`setGeneroBalizamento` (store) regeneram as séries quando há atletas — **qualquer ajuste manual (drag/✕) é descartado** nesse momento; o botão "Atualizar" faz o mesmo sob demanda. `balizar(atletas, periodo, genero)` tem 3º parâmetro (`'todos'` = padão). Persistência do filtro em `generoBalizamento` (`festival-storage`).
- **Drag & drop do balizamento** (@dnd-kit): modo edição local em `BalizamentoPage`; `TabelaGenerica` aceita `renderLinha(item, celulas)` para renderizar `<tr>` com hooks (`useSortable`). Ids das linhas: `` `${serie}-${atletaId}` ``. `PointerSensor` com `activationConstraint: { distance: 8 }` (clique ≠ arraste). Reordenação dentro da série = `arrayMove`; entre séries = remove + `splice` na posição do `over`; `reordenarSeries` reatribui raias via `reatribuirRaias()`.
- **Edição inline da Lista**: duplo clique na célula → input/select → Enter/blur confirma (Esc cancela) → `atualizarAtleta(id, campos)` valida/normaliza (idade 1–99, `parseTempo`), recalcula medalha (`'tempo' in campos` — inclusive para limpar) e sincroniza as cópias embutidas em `series`. `atualizarTempoAtleta` virou wrapper de `atualizarAtleta`.
- **Ordenação da Lista**: clique no header alterna asc/desc com seta ▲/▼ (`cabecalhoOrdenavel`); tempo vazio sempre no fim; categoria ordena pela ordem oficial (`CATEGORIAS.indexOf`); chips de medalha foram removidos (ficam só Categoria e Gênero).
- **Balizamento sem aviso na UI**: coluna Aviso removida (inclusive do Controle); `serie.aviso` continua no tipo/dados/algoritmo (`balizar()`), só não é mais exibido.
- **Limites de medalha são estritos no OURO**: faixa "OURO < 28,00" significa que 28,00 exato já é PRATA; 30,00 ainda é PRATA (inclusivo); 30,01 é BRONZE. Mesma lógica nas demais faixas (`src/utils/medalhas.ts`).
- **Persistência**: Zustand `persist` na chave `festival-storage`; tema também em `festival-tema` (lido em `main.tsx` para evitar flash do dark mode).
- **Impressão**: chrome com classe `no-print`; áreas de impressão com `print-area` (+ wrapper `hidden print:block`). CSS em `src/index.css` (`@media print`).
- **Testes**: Vitest em ambiente `node` (testes só de `src/utils/**`, co-localizados `*.test.ts`); `npm test` deve passar com 0 falhas antes de qualquer commit.
- **CSV tolera BOM UTF-8**: Excel/Notepad/VS Code salvam "UTF-8 with BOM" (EF BB BF) e o BOM vira `\uFEFF` no primeiro header (`\uFEFFano`), quebrando validação de coluna obrigatória. `removerBOM()` em `src/utils/csv.ts` stripa na entrada dos dois parsers e `chave()` remove `\uFEFF` residual — **não depender do PapaParse** para isso (o fix deles só veio na 5.5.4).
- **Sinônimos de coluna CSV**: histórico aceita `atleta`→`aluno`; atletas aceita `aluno`/`atleta`→`nome` (mapas `ALIASES_*` aplicados no `transformHeader`). Arquivos reais do Excel usam `;` como delimitador (Papa auto-detecta) e podem nomear a coluna diferente do PRD — validar sempre com o arquivo real do usuário quando possível.
- **Versão exibida no app**: `__APP_VERSION__` é injetado pelo `define` do `vite.config.ts` via `git describe --tags --abbrev=0` (tag real). O hook **`commit-msg`** (.githooks) atualiza o `package.json` em disco e o **`post-commit` garante que a versão entre no commit** com `git commit --amend` (guard `SEMVER_SELFCHECK` anti-recursão) **antes de criar a tag** — necessário porque o git grava o tree do commit a partir do índice em memória, carregado antes do `commit-msg` (o staging do hook fica de fora). Fonte única do bump: `.githooks/semver-bump.sh`. Assim o fallback do build no Cloudflare Pages (clone sem tags) fica sempre correto.
- **Horário do CSV vira período**: coluna `horario` aceita `manhã`/`tarde` **ou horário** (`08:45`, `13.05`, `08h45`, `HH:MM:SS`) via `periodoDoHorario()` em `src/utils/periodo.ts`; **corte às 13:00** (antes → manhã, a partir → tarde, escolhido pelo usuário); `Periodo` continua sendo só `'manhã' | 'tarde'`.
- **Categoria com subclasses**: `normalizarCategoria` aceita sufixos de turma (`Mirim II`, `Petiz A`, `Infantil Azul`) e normaliza para a categoria-base (match exato ou remoção progressiva de tokens finais, nunca substring — `Mirinho` continua inválido). A subdivisão **não é persistida**: `categoriaOficial` guarda só a base; balizamento/agrupamento usam `categoriaCalculada` (idade) — nunca a oficial.
- **Typo perigoso já acontecido**: `obrigigatoria` vs `obrigatoria` em interpolação de template string causou `ReferenceError` silencioso só no runtime dos testes — revisar identificadores com acento/typos ao revisar diffs.
- **Repo usa o kit de documentação**: hook `.githooks/post-commit` cria tags SemVer; sessões registradas via `scripts/nova-sessao.ps1`; nunca criar SESSION.md.
- **Adição manual de atleta**: `adicionarAtleta(dados)` no store retorna `boolean` (`false` = categoria inválida ou nome duplicado case-insensitive — toast emitido pelo próprio store); monta o `Atleta` completo (`gerarId`, `categoriaPorIdade`, `calcularMedalha`) e re-executa `balizar()` **só se já existirem séries** (mesmo descarte de ajustes manuais dos filtros). `Modal` (DS) teve o primeiro uso real aqui.

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

---

## Sessão: 10/10/2026 — Horário do CSV convertido em período (corte 13:00)

### O que foi feito
- Bug: arquivo real de atletas com `horario` como horário (`08:45`, `13:45`) reprovava em `normalizarPeriodo`, que só aceitava as palavras `manhã`/`tarde`
- `src/utils/periodo.ts` (novo): função pura `periodoDoHorario(valor)` — aceita palavras (caixa/acento tolerados) ou horário (`08:45`, `8:45`, `13.05`, `08h45`, `14:30:00`); valida faixa (hora ≤ 23, min ≤ 59); **corte às 13:00** (antes → manhã, a partir → tarde, decisão do usuário); inválido → `null`
- `src/utils/csv.ts`: `normalizarPeriodo` removida — `parseCSVAtletas` usa `periodoDoHorario` direto; mensagem de erro agora sugere `use manhã, tarde ou um horário (ex.: 08:45)`
- `src/pages/CarregarPage.tsx`: instrução de upload atualizada com o formato de horário e a regra do corte
- Testes: `src/utils/periodo.test.ts` (4) + 2 em `csv.test.ts` (horários reais `08:45`/`13:45` e rejeição com nova mensagem) — **53 testes passando**
- Verificação: `tsc -b` 0 erros, `npm run build` OK
- `CHANGELOG.md` + `AGENTS.md` (Contexto Crítico e esta sessão)

### Decisões
- Corte 13:00 escolhido pelo usuário (12:59 ainda é manhã)
- Função em módulo próprio (`periodo.ts`), reutilizável além do CSV
- `Periodo` continua `'manhã' | 'tarde'` — o horário original não é persistido, só o período derivado

### Arquivos
- `src/utils/periodo.ts`
- `src/utils/periodo.test.ts`
- `src/utils/csv.ts`
- `src/utils/csv.test.ts`
- `src/pages/CarregarPage.tsx`
- `CHANGELOG.md`
- `AGENTS.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 10/10/2026 — Fix: categoria "Mirim II" normalizada para a base

### O que foi feito
- Bug: CSV real com subclasses de turma (`Mirim II`) reprovava em `normalizarCategoria` (match exato → `mirimii`)
- `src/utils/categorias.ts`: fallback em `normalizarCategoria` — sem match exato, remove o último token e tenta de novo (`Mirim II`→`Mirim`, `Pré-Mirim II`→`Pré-Mirim`, `Petiz A`→`Petiz`, `Infantil Azul`→`Infantil`); match por token, nunca substring (`Mirinho`/`Master` continuam inválidos)
- Testes: `categorias.test.ts` +3 blocos/afirmações (subclasses e mantém `master`/`mirinho`→null) + caso real em `csv.test.ts` — **55 testes passando**
- UI/docs: `CarregarPage` lista as categorias e a regra de subclass; README (regra de categoria); CHANGELOG; AGENTS.md (Contexto Crítico + sessão)

### Decisões
- Subdivisão **não é persistida**: `categoriaOficial` guarda a base — balizamento/medalha/telas usam `categoriaCalculada` (idade), então zero mudança de tipo ou UI
- Mesma função cobre atletas e histórico automaticamente

### Arquivos
- `src/utils/categorias.ts`
- `src/utils/categorias.test.ts`
- `src/utils/csv.test.ts`
- `src/pages/CarregarPage.tsx`
- `README.md`
- `CHANGELOG.md`
- `AGENTS.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 10/10/2026 — Categoria do CSV governa + badge de versão corrigido + botão Limpar carregamento

### O que foi feito
- **Categoria**: driver trocado de `categoriaCalculada` → `categoriaOficial` em todo o app — `csv.ts` (medalha no parse), `balizamento.ts` (agrupamento + título da série), `store` (recálculo de medalha no Controle) e telas (`CarregarPage`, `ListaPage`, `BalizamentoPage`, `ControlePage`). Motivo: a regra real é o **ano de nascimento**, que não vem no CSV — a idade não decide
- **Selo de divergência removido**: campo `divergencia` saiu de `types.ts` e do parse; badge amarela removida das telas; export de `/lista` virou coluna `categoria` única (a oficial, sem `categoria_oficial`)
- **Badge de versão travado em 0.3.2**: causa raiz = Cloudflare Pages sem tags git → fallback `package.json` congelado. Solução: `.githooks/semver-bump.sh` (fonte única do bump SemVer, testado: fix→patch, feat→minor, `!:`/BREAKING CHANGE→major) + hook `commit-msg` que atualiza `package.json` no disco + **`post-commit` com auto-reparo** — descoberta em campo: o `git add` do `commit-msg` **não entra no commit** (o git grava o tree a partir do índice em memória, carregado antes do hook; comprovado no commit `fcd6ba5`, que saiu com 0.5.1 e as mudanças staged). O `post-commit` agora detecta `HEAD:package.json` ≠ tag e faz `git commit --amend --no-edit --no-verify` com guard `SEMVER_SELFCHECK` **antes** de tagar. `package.json` realinhado `0.3.2`→`0.5.1`→`0.6.0`
- **Botão "Limpar carregamento"** no CarregarPage: chama `limparAtletas()` (limpa atletas + séries), limpa também o preview local, desabilitado sem atletas carregados, com toast; histórico da Análise intocado
- Fix colateral: `CardHeading` de "Pré-visualização" estava sem a prop obrigatória `icone` (erro de tipo latente) — corrigido com `icone="👁️"`
- Testes: fixtures/asserções de `csv.test.ts` e `balizamento.test.ts` atualizadas (oficial como driver) — **55 testes, 0 falhas**; `tsc -b` 0 erros; `npm run build` OK; simulação dos hooks com bash confirmou os 4 bumps

### Decisões
- `categoriaCalculada` continua calculada (1 linha, já persistida no localStorage — sem migração), mas **não governa nada**
- Bump SemVer extraído para `.githooks/semver-bump.sh` — commit-msg e post-commit compartilham a mesma lógica (determinística: mesmas entradas → mesma tag)
- Stage dentro de `commit-msg` é ilusório nesse git: quem fecha a versão do commit é o `post-commit` (amend antes da tag); testar sempre um commit `fix:` vazio antes de confiar em mudanças de hook
- PRD 5.4 ("concatenar pela idade") atualizado para a nova regra

### Arquivos
- `src/types.ts`
- `src/utils/csv.ts`
- `src/utils/balizamento.ts`
- `src/store/useAppStore.ts`
- `src/pages/CarregarPage.tsx`
- `src/pages/ListaPage.tsx`
- `src/pages/BalizamentoPage.tsx`
- `src/pages/ControlePage.tsx`
- `src/utils/csv.test.ts`
- `src/utils/balizamento.test.ts`
- `.githooks/semver-bump.sh` (novo)
- `.githooks/commit-msg` (novo)
- `.githooks/post-commit`
- `package.json`
- `README.md`
- `PRD.md`
- `CHANGELOG.md`
- `AGENTS.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 10/10/2026 — Rename: "Festival Interno PPt" → "Festival Interno"

### O que foi feito
- Renomeação propagada: `index.html` (aba), `PRD.md`, `DEVELOPMENT.md`, `CHANGELOG.md`, `ARCHITECTURE.md`, heading de `/controle` (`ControlePage`) e identidade no `AGENTS.md` — **"PPt" removido do nome em todo o repo** (usuário iniciou a troca em 3 docs; o restante foi completado por nós)
- `CarregarPage`: ícone do card "Pré-visualização" removido (`icone=""` — pedido do usuário; `CardHeading` aceita string vazia)
- Espaço órfão no título do `ARCHITECTURE.md` corrigido
- `npx tsc -b --force`: 0 erros; 55 testes OK

### Decisões
- Nome do pacote npm (`festival-interno`) já estava sem o "PPt" — só os textos visíveis precisavam de update

### Arquivos
- `index.html`
- `PRD.md`
- `DEVELOPMENT.md`
- `ARCHITECTURE.md`
- `CHANGELOG.md`
- `AGENTS.md`
- `src/pages/ControlePage.tsx`
- `src/pages/CarregarPage.tsx`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 10/10/2026 — Carregar/Lista/Balizamento: filtros em chips, edição inline e modo edição com drag&drop

### O que foi feito
- **Menu**: sidebar `Carregar CSV`→`Carregar`, `Listagem`→`Lista de Atletas`; H1s alinhados
- **Carregar**: botão **"Processar"** movido para o card principal (habilitado só com preview válido); removido o duplicado do card de pré-visualização
- **Lista de Atletas**: chips de filtro no padrão da Análise (**Medalha**, **Categoria** presentes, **Gênero**) + ícone **↺ limpar filtros** (aparece quando ≥1 filtro ativo); **edição por duplo clique** em qualquer coluna — input/select por campo (nome texto, idade 1–99, categoria select das 7, gênero/horário selects, professor/nível texto, tempo via `parseTempo` com aceitação `.`/`,`/`'`), Enter/blur confirma, Esc cancela, erros via toast
- **Balizamento**: filtro **Gênero** (Todos/Fem/Masc) em cascata com Período; **execução automática** nos setters do store + no mount (só se `series` vazio); botão virou **"Atualizar"**; coluna **Aviso** extraída (fica ao lado de Série, com Badge); **✏️ modo edição** (canto direito do grid): drag&drop de linhas (dnd-kit) dentro e entre séries com raias reatribuídas, **✕** por linha exclui o atleta que faltou (some da série, reaparece ao atualizar)
- **Store**: `generoBalizamento` (persistido), `atualizarAtleta` (valida/normaliza, recalcula medalha com `'tempo' in campos`, sincroniza cópias em `series`), `removerAtletaDaSerie`, `reordenarSeries`, `executarBalizamento(silencioso)`; `atualizarTempoAtleta` virou wrapper
- **`balizar()`**: 3º parâmetro `GeneroOpcao` (padrão `'todos'`); novo `reatribuirRaias()` (4→1-4, 3→2-4, outros→1..n)
- **`TabelaGenerica`**: prop opcional `renderLinha(item, celulas)` — habilita `<tr>` com hooks sem duplicar a tabela
- Deps novas: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers` (v9: o modifier correto é `restrictToVerticalAxis`, não `restrictToVerticalElement`)
- Testes: +6 (3 gênero em cascata, 3 `reatribuirRaias`) → **61 testes, 0 falhas**; `tsc -b` 0 erros; `npm run build` OK
- Docs: CHANGELOG (Added/Changed), PRD RF01–RF03, README (fluxo), ARCHITECTURE (tabela de rotas)

### Decisões
- Regeneração automática **descarta ajustes manuais** (drag/✕) a cada mudança de filtro — aceito pelo usuário; "Atualizar" faz o mesmo sob demanda
- `removerAtletaDaSerie` remove só da série (atleta permanece na base e no Controle); série que fica vazia é filtrada (numeração pode ficar com lacuna — estável para o dia do evento)
- Filtros da Lista idênticos aos da Análise, exceto **Ano** (não existe em atletas)
- DnD: `PointerSensor` com `distance: 8` (clique não inicia arraste) — ✕ e clique simples continuam funcionando na linha

### Arquivos
- `src/components/layout/Sidebar.tsx`
- `src/components/ui/TabelaGenerica.tsx`
- `src/pages/CarregarPage.tsx`
- `src/pages/ListaPage.tsx`
- `src/pages/BalizamentoPage.tsx`
- `src/store/useAppStore.ts`
- `src/types.ts`
- `src/utils/balizamento.ts`
- `src/utils/balizamento.test.ts`
- `package.json` (+@dnd-kit)
- `README.md`
- `PRD.md`
- `ARCHITECTURE.md`
- `CHANGELOG.md`
- `AGENTS.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 11/10/2026 — Ajustes: chips Medalha removidos, ordenação por header, sem coluna Aviso

### O que foi feito
- **Lista de Atletas**: chips de **Medalha** removidos (linha inteira, state e filtro); ficam só **Categoria**, **Gênero** e busca
- **Ordenação por clique no header** em todas as colunas: `cabecalhoOrdenavel()` renderiza `<button>` no `th` com seta ▲/▼ (tom primary) quando ativa; 1º clique → asc, 2º → desc, coluna nova → asc; comparadores: nome/professor/nível `localeCompare('pt-BR')`, idade numérico, categoria por índice em `CATEGORIAS`, gênero/horário por ordem fixa, **tempo com vazio sempre no fim** (asc ou desc); `TabelaGenerica.titulo` alargado para `ReactNode`
- **Balizamento**: coluna **Aviso** removida por completo (import de `Badge`, campo `aviso` da `LinhaTabela`, mapeamento e a coluna); mesma limpeza no `ControlePage` (campo `aviso` das linhas removido); o tipo `Serie.aviso` e o algoritmo `balizar()` seguem intactos — só saiu da UI
- Docs: CHANGELOG (Changed), AGENTS.md (Contexto + sessão)

### Decisões
- Chips de medalha removidos a pedido do usuário — medalha já é coluna da tabela e editável; filtro por medalha continua na Análise (histórico)
- Ordenação é local à página (não no `TabelaGenerica`); `titulo: ReactNode` foi a mudança mínima para customizar o header
- `serie.aviso` permanece no dado (testes e debug) — decisão explícita do usuário: nenhum aviso na UI

### Arquivos
- `src/components/ui/TabelaGenerica.tsx`
- `src/pages/ListaPage.tsx`
- `src/pages/BalizamentoPage.tsx`
- `src/pages/ControlePage.tsx`
- `CHANGELOG.md`
- `AGENTS.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 16/10/2026 — Add Atleta manual na Lista de Atletas

### O que foi feito
- **Store**: novo action `adicionarAtleta(dados: Omit<Atleta, 'id'|'categoriaCalculada'|'medalha'>): boolean` — valida `normalizarCategoria`, **bloqueia nome duplicado** (trim + case-insensitive, toast de erro e retorna `false`), monta o `Atleta` (`gerarId()`, `categoriaPorIdade`, `calcularMedalha`) e **regenera séries via `balizar()` somente se já existirem** (usa `periodo`/`generoBalizamento` atuais); com séries vazias mantém `series: []`
- **Lista de Atletas**: botão **"+ Adicionar Atleta"** (primary) na toolbar antes de "Exportar CSV" → abre **`Modal`** (primeiro uso real do componente) com formulário grid 2 colunas: Nome (full), Idade (number 1–99), Categoria (select 7), Gênero, Horário (manhã/tarde), Professor, Nível, Tempo (opcional, full); footer Cancelar/Adicionar; labels com `htmlFor` + classe uppercase do DS; selects com `SELECT_CLASSE` local espelhando o `Input`
- Validação no submit (mesmas regras da edição inline): nome não vazio, idade inteira 1–99, tempo via `parseTempo` (não-vazio inválido → erro); erros de duplicado/categoria (retornados pelo store) mantêm o modal aberto; sucesso fecha, reseta form (`FORM_VAZIO`) e toast `Atleta "X" adicionado.`
- Verificação: `npx tsc -b --force` 0 erros; **61 testes, 0 falhas**; `npm run build` OK
- Docs: CHANGELOG (Added), AGENTS.md (Contexto Crítico + esta sessão)

### Decisões
- **Bloquear duplicado** (decisão do usuário): mesmo nome (ignorando caixa/espaços) → erro, não adiciona; checagem vive no store (única fonte da base)
- **Regenerar séries automático** (decisão do usuário): consistente com os filtros período/gênero — descarta ajustes manuais (drag/✕) já existentes, mesmo trade-off já aceito
- `tempo` é opcional no form (mesmo CSV); vazio → `undefined` → medalha `Sem Tempo`
- Form começa com defaults `categoria: 'Mirim'`, `genero: 'feminino'`, `periodo: 'manhã'`

### Arquivos
- `src/store/useAppStore.ts`
- `src/pages/ListaPage.tsx`
- `CHANGELOG.md`
- `AGENTS.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros
