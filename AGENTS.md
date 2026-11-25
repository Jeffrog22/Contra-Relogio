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
- **Formato do CSV de entrada**: `nome,idade,categoria,genero,horario,professor,nivel,tempo` (tempo opcional) + coluna opcional **`tipo`** (`Crawl c/ prancha` | `Crawl s/ prancha`, aceita caixa/variações; vazio → `undefined`, inválido → erro de linha). O PRD/prompt original mencionava `ano_nascimento` — **desatualizado**; o formato atual é o deste README.
- **Duas bases independentes no store**: `atletas` = **Festival** (única que alimenta balizamento/controle/análise) e `atletasApresentacao` = **Apresentação** (só a Lista Apresentação). Upload Festival → `processarAtletas` (zera `series`); Upload Apresentação → `processarApresentacao` (não toca em `series`). `adicionarAtleta(dados, destino)` e `limparAtletas(destino)` aceitam `'festival' | 'apresentacao'` (padrão festival; duplicado validado **por lista**); `atualizarAtleta` localiza o id em qual lista existe (cópias em `series` só se for festival). Ambas persistidas em `festival-storage`.
- **Balizamento**: séries só com 3 ou 4 atletas; sobras (1, 2 ou 5 no grupo) se redistribuem com o grupo vizinho do mesmo gênero; casos impossíveis (1, 2 ou 5 atletas isolados) geram série com `aviso` — nunca quebrar o fluxo. Raias: 4→[1,2,3,4], 3→[2,3,4], nunca 5. Algoritmo + testes em `src/utils/balizamento.ts`.
- **Balizamento roda automático**: `setPeriodo`/`setGeneroBalizamento` (store) regeneram as séries quando há atletas — **qualquer ajuste manual (drag/✕) é descartado** nesse momento; o botão "Atualizar" faz o mesmo sob demanda. `balizar(atletas, periodo, genero)` tem 3º parâmetro (`'todos'` = padão). Persistência do filtro em `generoBalizamento` (`festival-storage`).
- **Drag & drop do balizamento** (@dnd-kit): modo edição local em `BalizamentoPage`; `TabelaGenerica` aceita `renderLinha(item, celulas)` para renderizar `<tr>` com hooks (`useSortable`). Ids das linhas: `` `${serie}-${atletaId}` ``. `PointerSensor` com `activationConstraint: { distance: 8 }` (clique ≠ arraste). Reordenação dentro da série = `arrayMove`; entre séries = remove + `splice` na posição do `over`; `reordenarSeries` reatribui raias via `reatribuirRaias()`.
- **Edição inline da Lista**: duplo clique na célula → input/select → Enter/blur confirma (Esc cancela) → `atualizarAtleta(id, campos)` valida/normaliza (idade 1–99, `parseTempo`), recalcula medalha (`'tempo' in campos` — inclusive para limpar) e sincroniza as cópias embutidas em `series`. `atualizarTempoAtleta` virou wrapper de `atualizarAtleta`.
- **Ordenação da Lista**: clique no header alterna asc/desc com seta ▲/▼ (`cabecalhoOrdenavel`); tempo vazio sempre no fim; categoria ordena pela ordem oficial (`CATEGORIAS.indexOf`); chips de medalha foram removidos (ficam só Categoria e Gênero).
- **Balizamento sem aviso na UI**: coluna Aviso removida (inclusive do Controle); `serie.aviso` continua no tipo/dados/algoritmo (`balizar()`), só não é mais exibido.
- **Limites de medalha são estritos no OURO**: faixa "OURO < 28,00" significa que 28,00 exato já é PRATA; 30,00 ainda é PRATA (inclusivo); 30,01 é BRONZE. Mesma lógica nas demais faixas (`src/utils/medalhas.ts`).
- **Persistência**: Zustand `persist` na chave `festival-storage`; tema também em `festival-tema` (lido em `main.tsx` para evitar flash do dark mode).
- **Impressão**: chrome com classe `no-print`; áreas de impressão com `print-area` (+ wrapper `hidden print:block`). CSS em `src/index.css` (`@media print`).
- **Testes**: Vitest; testes de `src/utils/**` rodam em ambiente `node` (co-localizados `*.test.ts`) e testes de hook (`src/hooks/**`) usam docblock `// @vitest-environment jsdom` na linha 1 — **nunca** trocar o `environment` global para jsdom (quebra `exemplos.test.ts`, que usa `import.meta.url`/`node:fs`); testes com `renderHook` precisam de `cleanup()` no `afterEach` (sem `globals: true` o auto-cleanup do RTL não registra); `npm test` deve passar com 0 falhas antes de qualquer commit.
- **CSV tolera BOM UTF-8**: Excel/Notepad/VS Code salvam "UTF-8 with BOM" (EF BB BF) e o BOM vira `\uFEFF` no primeiro header (`\uFEFFano`), quebrando validação de coluna obrigatória. `removerBOM()` em `src/utils/csv.ts` stripa na entrada dos dois parsers e `chave()` remove `\uFEFF` residual — **não depender do PapaParse** para isso (o fix deles só veio na 5.5.4).
- **Sinônimos de coluna CSV**: histórico aceita `atleta`→`aluno`; atletas aceita `aluno`/`atleta`→`nome` (mapas `ALIASES_*` aplicados no `transformHeader`). Arquivos reais do Excel usam `;` como delimitador (Papa auto-detecta) e podem nomear a coluna diferente do PRD — validar sempre com o arquivo real do usuário quando possível.
- **Versão exibida no app**: `__APP_VERSION__` é injetado pelo `define` do `vite.config.ts` via `git describe --tags --abbrev=0` (tag real). O hook **`commit-msg`** (.githooks) atualiza o `package.json` em disco e o **`post-commit` garante que a versão entre no commit** com `git commit --amend` (guard `SEMVER_SELFCHECK` anti-recursão) **antes de criar a tag** — necessário porque o git grava o tree do commit a partir do índice em memória, carregado antes do `commit-msg` (o staging do hook fica de fora). Fonte única do bump: `.githooks/semver-bump.sh`. Assim o fallback do build no Cloudflare Pages (clone sem tags) fica sempre correto.
- **Horário do CSV vira período**: coluna `horario` aceita `manhã`/`tarde` **ou horário** (`08:45`, `13.05`, `08h45`, `HH:MM:SS`) via `periodoDoHorario()` em `src/utils/periodo.ts`; **corte às 13:00** (antes → manhã, a partir → tarde, escolhido pelo usuário); `Periodo` continua sendo só `'manhã' | 'tarde'`.
- **Categoria com subclasses**: `normalizarCategoria` aceita sufixos de turma (`Mirim II`, `Petiz A`, `Infantil Azul`) e normaliza para a categoria-base (match exato ou remoção progressiva de tokens finais, nunca substring — `Mirinho` continua inválido). A subdivisão **não é persistida**: `categoriaOficial` guarda só a base; balizamento/agrupamento usam `categoriaCalculada` (idade) — nunca a oficial.
- **Typo perigoso já acontecido**: `obrigigatoria` vs `obrigatoria` em interpolação de template string causou `ReferenceError` silencioso só no runtime dos testes — revisar identificadores com acento/typos ao revisar diffs.
- **Repo usa o kit de documentação**: hook `.githooks/post-commit` cria tags SemVer; sessões registradas via `scripts/nova-sessao.ps1`; nunca criar SESSION.md.
- **Adição manual de atleta**: `adicionarAtleta(dados)` no store retorna `boolean` (`false` = categoria inválida ou nome duplicado case-insensitive — toast emitido pelo próprio store); monta o `Atleta` completo (`gerarId`, `categoriaPorIdade`, `calcularMedalha`) e re-executa `balizar()` **só se já existirem séries** (mesmo descarte de ajustes manuais dos filtros). `Modal` (DS) teve o primeiro uso real aqui.
- **Cronômetro da Controle (reescrito)**: estado **local do hook** `useCronometro` (não na store) — `pendentes` (chegadas em sequência ordinal) + `atribuicoes` (ordem→atletaId); **clique curto no Parar** captura o tempo atual (1 clique = 1 chegada, até a série toda → para sozinho + toast "Todas as chegadas capturadas!"); **segurar Parar 3s zera** tempo e pendentes (botões com `user-select:none`, contextmenu bloqueado e `touch-callout:none`); **auto-atribuição do último chip**: com exatamente 1 chip livre e 1 pendente sem chip, atribui sozinho (2+ chips espera o arraste; devolver chip à zona `chips-livre` desatribui); **Registrar** grava via `atualizarTempoAtleta(id, Number((ms/1000).toFixed(2)))` e fecha o modal. Modal **não arrasta** (fixo centralizado rente ao topo); quem arrasta são os **botões Iniciar/Parar** (pointer events + limiar 6px, posição em `localStorage` `festival-crono-btns`); chips de raia usam `@dnd-kit` (droppable = célula Baliza `pend-{ordem}` e zona `chips-livre`).

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

---

## Sessão: 20/10/2026 — Lista Festival + Lista Apresentação

### O que foi feito
- **Renomeio**: "Lista de Atletas" → "Lista Festival" (rótulo do menu em `Sidebar.tsx:6` e `<h1>` em `ListaPage.tsx:361`)
- **Nova tela Lista Apresentação** (`src/pages/ListaApresentacaoPage.tsx`, rota `/lista-apresentacao`): mesmo layout/grid/lógica da Lista Festival, com filtros por chips — Nível (Todos | Iniciação A | Iniciação B), Gênero (Todos | feminino | masculino) e Tipo (Todos | Crawl c/ prancha | Crawl s/ prancha); filtro busca; ordenação por header; edição inline (duplo clique); export CSV (`listagem-apresentacao.csv`); modal "Adicionar atleta" com campo Tipo
- **Novo campo `tipo?`** em `Atleta` (`src/types.ts:26`): `'Crawl c/ prancha' | 'Crawl s/ prancha'`, opcional, usado apenas como filtro na Lista Apresentação (não afeta medalha nem balizamento); flui automaticamente pelo spread do store em `adicionarAtleta`/`atualizarAtleta`
- **Menu**: novo item `Lista Apresentação` com ícone SVG customizado (rosto com touca e óculos de natação, stroke `currentColor`) após Lista Festival; `icone` do `LINKS` agora aceita `ReactNode`
- **Rota**: `/lista-apresentacao` → `ListaApresentacaoPage` em `App.tsx`
- Verificação: `npx tsc -b --force` 0 erros; **61 testes, 0 falhas**; `npm run build` OK

### Decisões
- `tipo` é opcional no `Atleta` (não entra no CSV nem no balizamento); só aparece no filtro e no modal da Lista Apresentação
- A Lista Festival mantém o filtro por Categoria (não tem o filtro Tipo)
- Ícone SVG customizado usado apenas no item do menu; a Lista Apresentação usa emoji `🎤` no CardHeading (pois `CardHeading.icone` aceita `string`)

### Arquivos
- `src/types.ts`
- `src/components/layout/Sidebar.tsx`
- `src/App.tsx`
- `src/pages/ListaPage.tsx`
- `src/pages/ListaApresentacaoPage.tsx` (novo)
- `CHANGELOG.md`
- `AGENTS.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 20/10/2026 — Ícone SVG da Lista Apresentação baseado na ilustração da raiz

### O que foi feito
- Substituiu o SVG simplificado (rosto com óculos) por um ícone SVG baseado na ilustração da raiz (`swimming-svgrepo-com (1).svg`), adaptado para ícone de menu: `viewBox="0 0 24 24"`, `stroke="currentColor"` (herda cor do tema), `strokeWidth="2"`, linha de nadador com cabeça/touca e óculos
- Item de menu `Lista Apresentação` agora exibe o SVG customizado no `Sidebar.tsx`
- Verificação: `npx tsc -b --force` 0 erros; **61 testes, 0 falhas**; `npm run build` OK

### Decisões
- `CardHeading.icone` aceita apenas `string`, então a Lista Apresentação mantém o emoji `🎤` no título da página; o SVG fica só no item de menu do Sidebar
- SVG usa `stroke="currentColor"` para funcionar em light/dark mode sem cores fixas

### Arquivos
- `src/components/layout/Sidebar.tsx`
- `swimming-svgrepo-com (1).svg` (cópia na raiz do projeto)
- `AGENTS.md`
- `CHANGELOG.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 20/10/2026 — Melhora ícone SVG da Lista Apresentação (cabeça+touca+óculos, duas cores)

### O que foi feito
- Substituiu o SVG anterior por um ícone melhorado baseado na ilustração da raiz (`swimming-svgrepo-com (1).svg`), simplificado para ícone de menu:
  - **Cabeça**: círculo (`currentColor`)
  - **Touca**: arco superior em azul (`#3B82F6`) — cor adicional junto com `currentColor`
  - **Óculos**: dois círculos pequenos + ponte (`currentColor`)
  - **Sem corpo** (apenas cabeça e óculos)
  - `viewBox="0 0 24 24"`, `strokeLinecap="round"`, `strokeLinejoin="round"`, sem `fill`
- Item de menu `Lista Apresentação` exibe o SVG customizado no `Sidebar.tsx`
- Verificação: `npx tsc -b --force` 0 erros; **61 testes, 0 falhas**; `npm run build` OK

### Decisões
- Duas cores: `currentColor` (herda cor do tema light/dark) + azul `#3B82F6` na touca (tema de natação/água)
- `CardHeading.icone` aceita apenas `string`, então a Lista Apresentação mantém o emoji `🎤` no título da página; o SVG fica só no item de menu do Sidebar

### Arquivos
- `src/components/layout/Sidebar.tsx`
- `AGENTS.md`
- `CHANGELOG.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 20/10/2026 — Ícone SVG Lista Apresentação touca azul e óculos vermelho

### O que foi feito
- Substituiu o SVG anterior por um ícone baseado no vetor fornecido (`swimming-svgrepo-com (1).svg`), simplificado para ícone de menu:
  - **Cabeça**: círculo em cinza escuro (`#333333`)
  - **Touca**: arco superior em azul (`#3B82F6`)
  - **Óculos**: dois círculos pequenos + ponte em vermelho (`#EF4444`)
  - **Sem corpo** (apenas cabeça e óculos)
  - `viewBox="0 0 24 24"`, `strokeLinecap="round"`, `strokeLinejoin="round"`, sem `fill`
- Item de menu `Lista Apresentação` exibe o SVG customizado no `Sidebar.tsx`
- Verificação: `npx tsc -b --force` 0 erros; **61 testes, 0 falhas**; `npm run build` OK

### Decisões
- Duas cores fixas: azul `#3B82F6` na touca + vermelho `#EF4444` nos óculos (tema de natação)
- Cabeça em `#333333` para contraste em light/dark mode
- `CardHeading.icone` aceita apenas `string`, então a Lista Apresentação mantém o emoji `🎤` no título da página; o SVG fica só no item de menu do Sidebar

### Arquivos
- `src/components/layout/Sidebar.tsx`
- `AGENTS.md`
- `CHANGELOG.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 20/10/2026 — Ícone Lista Apresentação agora é 🤿 (menu e label)

### O que foi feito
- Substituiu o SVG customizado (cabeça+touca azul+óculos vermelho) pelo emoji `🤿` (mergulho com máscara e snorkel)
- Item de menu `Lista Apresentação` agora exibe `🤿` no `Sidebar.tsx`
- CardHeading da Lista Apresentação agora exibe `🤿` no título da página (substitui `🎤`)
- Removida a constante `ICONE_APRESENTACAO` (SVG inline) do `Sidebar.tsx`
- Verificação: `npx tsc -b --force` 0 erros; **61 testes, 0 falhas**; `npm run build` OK

### Decisões
- Emoji `🤿` funciona tanto no menu (sidebar) quanto no CardHeading (que aceita apenas `string`)
- Mais simples e consistente com os outros itens do menu que usam emoji (`📄`, `🏊`, `🏁`, `⏱️`, `📊`)

### Arquivos
- `src/components/layout/Sidebar.tsx`
- `src/pages/ListaApresentacaoPage.tsx`
- `AGENTS.md`
- `CHANGELOG.md`

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 20/10/2026 — Auto-process CSV + Upload Apresentação

### O que foi feito
- **Carregar**: label do CardHeading 'Upload do arquivo' → 'Upload Festival'; removeu o botão 'Processar'; agora o CSV é processado automaticamente quando válido (sem erros e com atletas), exibindo toast de erro se houver falhas de validação; navega para /lista após o sucesso
- **Upload Apresentação**: nova tela /upload-apresentacao (src/pages/UploadApresentacaoPage.tsx) com mesma lógica de processamento do Carregar, mas navega para /lista-apresentacao após o sucesso
- **Menu**: novo item 'Upload Apresentação' com ícone 📤, posicionado após 'Carregar' no Sidebar
- **Rota**: /upload-apresentacao → UploadApresentacaoPage em App.tsx
- Verificação: 
px tsc -b --force 0 erros; **61 testes, 0 falhas**; 
pm run build OK

### Decisões
- Auto-process sem mostrar preview: apenas exibe toast de erro se houver problemas de validação
- O preview da tabela ainda é exibido antes do processamento automático (não é removido)
- UploadApresentacaoPage é uma cópia da CarregarPage com rota de destino diferente (/lista-apresentacao)

### Arquivos
- src/pages/CarregarPage.tsx
- src/pages/UploadApresentacaoPage.tsx (novo)
- src/components/layout/Sidebar.tsx
- src/App.tsx
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 20/10/2026 — Carregar vira dropdown com Upload Festival e Upload Apresentação

### O que foi feito
- Sidebar: 'Carregar' agora é um dropdown que expande para mostrar 'Upload Festival' (/carregar) e 'Upload Apresentação' (/upload-apresentacao) como sub-itens
- Item raiz 'Upload Apresentação' removido do menu
- Ícone 📄 para Upload Festival, 📤 para Upload Apresentacao
- Verificação: 
px tsc -b --force 0 erros; **61 testes, 0 falhas**; 
pm run build OK

### Decisões
- Dropdown abre/fecha ao clicar em 'Carregar'
- Ao clicar em um sub-item, o dropdown fecha e navega para a rota correspondente
- Item pai 'Carregar' fica destacado quando qualquer sub-rota está ativa (/carregar ou /upload-apresentacao)

### Arquivos
- src/components/layout/Sidebar.tsx
- AGENTS.md
- CHANGELOG.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 20/10/2026 — Listas independentes (Festival x Apresentação), coluna Tipo e filtro Período

### O que foi feito
- **Store**: novo estado `atletasApresentacao` (persistido em `festival-storage`); nova action `processarApresentacao(atletas)` (não zera `series`); `limparAtletas(destino?)` e `adicionarAtleta(dados, destino?)` parametrizados com `'festival' | 'apresentacao'` (padrão festival; duplicado validado por lista; adicionar em apresentação não roda `balizar()`); `atualizarAtleta` localiza o atleta em qual lista existe (helper `aplicarAtualizacao` compartilhado; cópias em `series` sincronizadas só para a base festival)
- **CSV**: coluna opcional `tipo` lida em `parseCSVAtletas` via `normalizarTipo()` (aceita `Crawl c/ prancha`/`Crawl s/ prancha` com caixa e variações tipo `crawl com prancha`; vazio/ausente → `undefined`; inválido → erro de linha com sugestão) — vale para os dois uploads
- **Menu**: ordem alterada — **Lista Apresentação** antes de **Lista Festival** (LINKS do Sidebar)
- **Lista Apresentação**: lê `atletasApresentacao`; coluna **Tempo → Tipo** (select inline com as 2 opções, ordenável — `Campo` trocou `tempo` por `tipo`); novo chip filtro **Período** (Todos | manhã | tarde) entre Gênero e Tipo (entra no ↺ limpar); modal grava com `adicionarAtleta(..., 'apresentacao')`; export CSV troca `tempo` por `tipo` (mantém `medalha`); estado vazio aponta para `/upload-apresentacao`
- **Upload Apresentação**: usa `processarApresentacao`, limpa só a própria lista (`limparAtletas('apresentacao')`), total/contador da base da apresentação, descrição cita coluna `tipo` opcional, preview mostra **Tipo** no lugar de Tempo
- **Upload Festival**: descrição agora diz que alimenta a Lista Festival
- Testes: +3 em `csv.test.ts` (lê tipo válido, caixa diferente/vazio/ausente, rejeita inválido) — **64 testes, 0 falhas**; `npx tsc -b --force` 0 erros; `npm run build` OK
- Docs: CHANGELOG (Added/Changed), AGENTS.md (Contexto Crítico + esta sessão)

### Decisões
- Festival segue sendo a única base de balizamento/controle/análise (confirmado pelo usuário)
- `tipo` vem do CSV (opcional) — confirmado pelo usuário; coluna só na Lista Apresentação, não na Festival
- Filtro Período como chip (padão Nível/Gênero/Tipo) e coluna Horário continua exibindo manhã/tarde — confirmado pelo usuário
- Modal da Lista Apresentação mantém campo Tempo opcional (alimenta medalha); some da tabela/export

### Arquivos
- src/store/useAppStore.ts
- src/utils/csv.ts
- src/utils/csv.test.ts
- src/components/layout/Sidebar.tsx
- src/pages/ListaApresentacaoPage.tsx
- src/pages/UploadApresentacaoPage.tsx
- src/pages/CarregarPage.tsx
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 20/11/2026 — Fix: chip Nível dinâmico na Lista Apresentação + célula econômica da Análise

### O que foi feito
- **Lista Apresentação**: constante `NIVEIS` hardcoded (`Iniciação A | Iniciação B`) substituída por `niveisPresentes` (`useMemo` com `Set` dos valores não vazios de `atleta.nivel`, ordenado com `localeCompare('pt-BR')`) + chip `Todos` — mesmo padrão de `categoriasPresentes` da Lista Festival/Análise; filtro `nivel`/limpar ↺ inalterados
- **Análise**: célula do grid de alunos (colunas de ano) virou layout de **2 linhas** — linha 1: `formatTempo` + `MedalhaBadge` lado a lado (`flex items-center gap-1.5` → badge com largura ajustada ao conteúdo, não estica); linha 2: categoria `text-[10px]` cinza; `MedalhaBadge` intocado (demais telas sem mudança)
- Verificação: `npx tsc -b --force` 0 erros; **64 testes, 0 falhas**; `npm run build` OK
- Docs: CHANGELOG (Fixed), AGENTS.md (esta sessão)

### Decisões
- Nível vazio (`''`) não gera chip (só casa com "Todos")
- Se o nível ativo sumir da base após novo upload, o chip some mas o filtro permanece ativo — resolver com ↺ (mesmo comportamento já existente dos chips de categoria)

### Arquivos
- src/pages/ListaApresentacaoPage.tsx
- src/pages/AnalisePage.tsx
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 20/11/2026 — Link compartilhável com dados embutidos (v1.0.0)

### O que foi feito
- **Nova dependência**: `lz-string` (+ `@types/lz-string`) — compressão URL-safe para embutir estado na URL
- **`src/utils/compartilhar.ts`** (funções puras): `serializarEstado(dados, max?)` (JSON → `compressToEncodedURIComponent`, teto `MAX_HASH` = 1.500.000 → `null` se passar), `montarLink(base, dados)` (monta `base#d=...`), `desserializarCompartilhado(hash)` (com ou sem prefixo, try/catch, valida payload `v: 1` + arrays + strings dos filtros); tipos `DadosCompartilhados`/`PayloadCompartilhado`
- **Payload completo**: `atletas`, `atletasApresentacao`, `series`, `periodo`, `generoBalizamento`, `historico` (tema/sidebar ficam de fora — preferência pessoal)
- **Store**: nova action `importarCompartilhado(dados)` — `set()` substituindo os 6 campos de uma vez
- **Boot** (`src/main.tsx`): função `importarLinkNoBoot()` roda antes do render — se `location.hash` começa com `#d=`: desserializa → sucesso: importa + toast `Dados do link importados (N no Festival, N na Apresentação)` → falha: toast de link inválido → **sempre** `history.replaceState` limpa o hash (refresh não reimporta); roda fora de effect (sem dupla execução do StrictMode)
- **TopBar**: botão ghost **🔗** ao lado do tema → valida se há dados (senão toast de erro), monta link com `useAppStore.getState()`, copia via `navigator.clipboard.writeText` com fallback `textarea`+`execCommand`, toast `Link copiado com todos os dados embutidos.`; link grande demais → toast de dados grandes; border do header corrigido (classe `dark:border-r` acidental removida)
- Testes: `src/utils/compartilhar.test.ts` (6: roundtrip completo, chars URL-safe, hash com/sem prefixo, payload corrompido, shape errado, limite de tamanho) — **70 testes, 0 falhas**; `tsc` 0 erros; `npm run build` OK
- Docs: CHANGELOG (Added), AGENTS.md (esta sessão)

### Decisões
- **Substituir e avisar** ao abrir link com dados existentes (escolha do usuário); botão no **TopBar** (escolha do usuário); payload **completo** (escolha do usuário)
- Hash `#d=` convive com o routing por path do BrowserRouter sem conflito
- `serializarEstado` aceita `max` opcional p/ testar o limite de tamanho sem gerar 1,5 MB de dados
- Versão desta entrega: **v1.0.0** (pedido do usuário — commit com `feat!:` para o hook dar bump MAJOR)

### Arquivos
- src/utils/compartilhar.ts (novo)
- src/utils/compartilhar.test.ts (novo)
- src/store/useAppStore.ts
- src/main.tsx
- src/components/layout/TopBar.tsx
- package.json (+lz-string, +@types/lz-string)
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 24/11/2026 — Cronômetro de série na aba Controle (modal)

### O que foi feito
- **`src/hooks/useCronometro.ts`** (novo): hook com estado **local** (não na store) — `running`, `selectedId`, `done` (Set), `startedAt`, `tempoMestre`; ticker de 30 ms via `setInterval` + `Date.now()`; `iniciar()` marca como `done` quem já tem tempo e só começa quem não tem (se ninguém tiver, não liga); `parar(id)` grava `atualizarTempoAtleta(id, segundos)` (2 casas), emite toast `Tempo de X registrado.`, avança `selectedId` para o próximo não-concluído calculado com `novoDone` local (nunca com `done` stale), congela o tempo da raia em `tempos` e desliga o `running` quando todos concluem; `reset()` limpa tudo; `temAlguemParaCronometrar` para habilitar o botão; `ids`/`temAlguemParaCronometrar` via `useMemo`
- **`src/components/ui/CronometroSerie.tsx`** (novo): modal do DS com relógio mestre, uma linha por atleta (raia, nome, relógio `00''00`, status Pronto/Ativo/Aguardando/Concluído, botão Iniciar/Parar), contagem X/Y, botões "Iniciar série"/"Zerar"; `atletas` memoizado (`useMemo` no `serie`) para o intervalo não reiniciar a cada tick; auto-conclusão em `useEffect` + guard `useRef` (toast "Série completa!" + fecha) — **nunca** callback durante render; `fechar()` usa `window.confirm` quando `running` e chama `reset()` + `onFechar`
- **`src/pages/ControlePage.tsx`**: chips de série agora **selecionam** (guardam o **número**, não o objeto) + botão "Cronometrar série" abre; série ativa derivada por `series.find(s => s.numero === n)` (nunca obsoleta após gravar tempo); `onFechar` fecha o modal mantendo a seleção
- **Ambiente de teste**: docblock `// @vitest-environment jsdom` na linha 1 de `useCronometro.test.ts` (jsdom só ali; global continua `node` porque `exemplos.test.ts` precisa de `import.meta.url`/`node:fs`); removido `setupFiles` do `vite.config.ts` e deletado `src/test-setup.ts` (harness falso que não servia para `createRoot`); `afterEach` com `cleanup()` + `vi.useRealTimers()` + `vi.restoreAllMocks()`
- Testes: **8** em `useCronometro.test.ts` (iniciar, tick com fake timers, parar grava/avança, parar congela raia × mestre segue, parar sem iniciar, todasConcluidas, reset, formato `formatTempo`) — **78 testes, 0 falhas**; `tsc -b --force` 0 erros; `npm run build` OK
- Docs: CHANGELOG (Added), AGENTS.md (Contexto Crítico: testes agora incluem `src/hooks/**` + esta sessão)

### Decisões
- **jsdom por arquivo** (docblock), nunca global — regra registrada no Contexto Crítico
- Estado do cronômetro é local ao hook; a store só recebe o resultado final via `atualizarTempoAtleta` (sem re-render por tick de 30 ms)
- Série do modal derivada **pelo número** para sempre refletir o estado fresco da store
- Atleta com tempo pré-existente entra como `done` no `iniciar()` e não exibe botão (evita série impossível de concluir)
- Chip seleciona, botão abre (dois passos) — evita abrir o modal sem querer ao filtrar
- Fechar com timer ativo → `window.confirm` descartando; auto-conclusão fecha com toast (em vez de mostrar tela "Concluído")

### Arquivos
- src/hooks/useCronometro.ts (novo)
- src/hooks/useCronometro.test.ts (novo)
- src/components/ui/CronometroSerie.tsx (novo)
- src/pages/ControlePage.tsx
- vite.config.ts
- src/test-setup.ts (deletado)
- package.json (+@testing-library/react, +jsdom — instalados na sessão anterior)
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 25/11/2026 — Cronômetro redesenhado (crono.html + identidade visual)

### O que foi feito
- **`useCronometro.ts` reescrito**: novo modelo — `pendentes` (chegadas em sequência ordinal: `{ordem, tempoMs}`) + `atribuicoes` (ordem → atletaId); API nova: `iniciar`, `capturar` (clique curto no Parar), `zerar` (hold 3s), `atribuir`, `desatribuir`, `gravar`; derived: `chipsDisponiveis`, `todasCapturadas`, `podeRegistrar`; auto-atribuição do último chip (`aplicarAuto`: exatamente 1 chip livre + 1 pendente sem chip → atribui); `capturar` para o cronômetro sozinho ao completar a série + toast; `gravar` escreve `atualizarTempoAtleta(id, Number((ms/1000).toFixed(2)))` por pendente atribuído
- **`CronometroSerie.tsx` reescrito** (referência visual: `crono.html` na raiz, cores do DS): modal **fixo centralizado rente à borda superior** (`items-start`, sem drag do modal); **botões ▶ Iniciar (canto sup. esq.) e ■ Parar (canto sup. dir.) arrastáveis livremente** dentro do modal (pointer events + limiar 6px; posição salva em `localStorage` `festival-crono-btns`); clique curto no Parar = `capturar()`, **segurar 3s = `zerar()`** (botões com `touch-none`, `select-none` no modal, `onContextMenu` bloqueado e `WebkitTouchCallout: none`); display mestre `00'00"00` em caixa escura (`bg-gray-900 dark:bg-gray-950`) com dígitos `text-primary-400` e badge Rodando/Parado; **linha horizontal de chips `raia-nome`** abaixo do cronômetro (chip do DS `bg-blue-100 … rounded-full`), **draggable via @dnd-kit**; tabela **Registros pendentes** (Ordem | Tempo | Baliza) com célula Baliza como **droppable** (`pend-{ordem}`) e zona `chips-livre` para devolver chip (desatribui); rodapé **Registrar** (habilitado só com todos atribuídos → grava e fecha) e **Fechar** (confirm se há pendentes)
- **`useCronometro.test.ts` reescrito**: 11 testes (iniciar, tick, capturar ordinal, parada automática + toast, capturar sem iniciar, atribuição manual + auto do último chip, 3+ chips espera arraste, zerar, gravar com 2 casas, podeRegistrar, formatTempo)
- Verificação: `npx tsc -b --force` 0 erros; **81 testes, 0 falhas**; `npm run build` OK
- Docs: CHANGELOG (Added), AGENTS.md (Contexto Crítico + esta sessão)

### Decisões
- Modal não arrasta (escolha do usuário): só os botões Iniciar/Parar são posicionáveis manualmente
- Hold 3s no Parar zera tempo + pendentes (não toca nos tempos já gravados no Controle)
- Auto-atribuição **só do último chip** (1 chip livre → automático; 2+ → espera arraste manual)
- 1 clique no Parar = 1 tempo até a série toda (sem voltas extras); depois disso o cronômetro para sozinho
- Registrar grava e fecha o modal; chip atribuído some da linha horizontal (pode ser devolvido à zona de chips)
- `crono.html` fica na raiz como referência de layout (não editado)

### Arquivos
- src/hooks/useCronometro.ts (reescrito)
- src/hooks/useCronometro.test.ts (reescrito)
- src/components/ui/CronometroSerie.tsx (reescrito)
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros
