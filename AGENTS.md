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
- **Testes**: Vitest; testes de `src/utils/**` rodam em ambiente `node` (co-localizados `*.test.ts`) e testes de hook (`src/hooks/**`) e de store (`src/store/**`) usam docblock `// @vitest-environment jsdom` na linha 1 — **nunca** trocar o `environment` global para jsdom (quebra `exemplos.test.ts`, que usa `import.meta.url`/`node:fs`); testes com `renderHook` precisam de `cleanup()` no `afterEach` (sem `globals: true` o auto-cleanup do RTL não registra); `npm test` deve passar com 0 falhas antes de qualquer commit.
- **CSV tolera BOM UTF-8**: Excel/Notepad/VS Code salvam "UTF-8 with BOM" (EF BB BF) e o BOM vira `\uFEFF` no primeiro header (`\uFEFFano`), quebrando validação de coluna obrigatória. `removerBOM()` em `src/utils/csv.ts` stripa na entrada dos dois parsers e `chave()` remove `\uFEFF` residual — **não depender do PapaParse** para isso (o fix deles só veio na 5.5.4).
- **Sinônimos de coluna CSV**: histórico aceita `atleta`→`aluno`; atletas aceita `aluno`/`atleta`→`nome` (mapas `ALIASES_*` aplicados no `transformHeader`). Arquivos reais do Excel usam `;` como delimitador (Papa auto-detecta) e podem nomear a coluna diferente do PRD — validar sempre com o arquivo real do usuário quando possível.
- **Versão exibida no app**: `__APP_VERSION__` é injetado pelo `define` do `vite.config.ts` via `git describe --tags --abbrev=0` (tag real). O hook **`commit-msg`** (.githooks) atualiza o `package.json` em disco e o **`post-commit` garante que a versão entre no commit** com `git commit --amend` (guard `SEMVER_SELFCHECK` anti-recursão) **antes de criar a tag** — necessário porque o git grava o tree do commit a partir do índice em memória, carregado antes do `commit-msg` (o staging do hook fica de fora). Fonte única do bump: `.githooks/semver-bump.sh`. Assim o fallback do build no Cloudflare Pages (clone sem tags) fica sempre correto.
- **Horário do CSV vira período**: coluna `horario` aceita `manhã`/`tarde` **ou horário** (`08:45`, `13.05`, `08h45`, `HH:MM:SS`) via `periodoDoHorario()` em `src/utils/periodo.ts`; **corte às 13:00** (antes → manhã, a partir → tarde, escolhido pelo usuário); `Periodo` continua sendo só `'manhã' | 'tarde'`.
- **Categoria com subclasses**: `normalizarCategoria` aceita sufixos de turma (`Mirim II`, `Petiz A`, `Infantil Azul`) e normaliza para a categoria-base (match exato ou remoção progressiva de tokens finais, nunca substring — `Mirinho` continua inválido). A subdivisão **não é persistida**: `categoriaOficial` guarda só a base; balizamento/agrupamento usam `categoriaCalculada` (idade) — nunca a oficial.
- **Typo perigoso já acontecido**: `obrigigatoria` vs `obrigatoria` em interpolação de template string causou `ReferenceError` silencioso só no runtime dos testes — revisar identificadores com acento/typos ao revisar diffs.
- **Repo usa o kit de documentação**: hook `.githooks/post-commit` cria tags SemVer; sessões registradas via `scripts/nova-sessao.ps1`; nunca criar SESSION.md.
- **Adição manual de atleta**: `adicionarAtleta(dados)` no store retorna `boolean` (`false` = categoria inválida ou nome duplicado case-insensitive — toast emitido pelo próprio store); monta o `Atleta` completo (`gerarId`, `categoriaPorIdade`, `calcularMedalha`) e re-executa `balizar()` **só se já existirem séries** (mesmo descarte de ajustes manuais dos filtros). `Modal` (DS) teve o primeiro uso real aqui.
- **Cronômetro da Controle (reescrito)**: estado **local do hook** `useCronometro` (não na store) — `pendentes` (chegadas em sequência ordinal) + `atribuicoes` (ordem→atletaId); **clique curto no Parar** captura o tempo atual (1 clique = 1 chegada, até a série toda → para sozinho + toast "Todas as chegadas capturadas!"); **segurar Parar 3s zera** tempo e pendentes (botões com `user-select:none`, contextmenu bloqueado e `touch-callout:none`); **auto-atribuição do último chip**: com exatamente 1 chip livre e 1 pendente sem chip, atribui sozinho (2+ chips espera o arraste; devolver chip à zona `chips-livre` desatribui); **Registrar** grava via `atualizarTempoAtleta(id, Number((ms/1000).toFixed(2)))` e fecha o modal. Modal **não arrasta** (fixo centralizado rente ao topo); quem arrasta são os **botões Iniciar/Parar** (pointer events + limiar 6px, posição em `localStorage` `festival-crono-btns`); chips de raia usam `@dnd-kit` (droppable = célula Baliza `pend-{ordem}` e zona `chips-livre`).
- **Drag & drop em touch**: todo elemento **arrastável** do `@dnd-kit` (`useDraggable`/`useSortable`) precisa da classe **`touch-none`** (`touch-action: none`) — sem ela o Chrome mobile rola a página e dispara `pointercancel` antes do `PointerSensor` ativar (desktop nunca é afetado). Padrão já usado nos botões Iniciar/Parar, chips (`ChipRaia`) e linhas da edição (`LinhaSorteavel`); droppables não precisam.
- **Snapshot por filtro + flag de edição**: store tem `seriesPorFiltro: Record<string, Serie[]>` (chave `chaveFiltro(periodo, genero)` = `` `${periodo}|${genero}` ``) e `edicoesManuais: boolean` (ambos no `partialize` de `festival-storage`, com `merge` custom que default `{} / false` para localStorage antigo). `setPeriodo`/`setGeneroBalizamento` **salvam as séries atuais na chave atual e restauram a do destino** (na falta, `balizar()`); o snapshot do destino é apagado ao restaurar (invariante: a chave atual nunca fica no mapa) e clicar no chip já ativo é **no-op**. `edicoesManuais` sobe em `removerAtletaDaSerie`/`reordenarSeries` e só desce em `limparAtletas('festival')`, `processarAtletas` sem edições e `importarCompartilhado` (que liga `true` se o link traz séries); `executarBalizamento` (Atualizar) regenera sob demanda e **não** mexe na flag. `atualizarAtleta` sincroniza as cópias também nos snapshots.
- **Upload com edições preserva por nome**: `preservarSeries()` (helper da store) roda em `processarAtletas` (só com `edicoesManuais`) e em `adicionarAtleta` — `remapearPorNome` casa por `nomeChave()` = `nome.trim().toLowerCase()` (**os ids mudam a cada `gerarId()`**, por isso é por nome) e `inserirAusentes` insere **apenas quem é realmente novo** (nome ausente da base anterior — exclusões manuais **não voltam**); regra de encaixe: mesma `categoriaOficial+nivel+genero` com <4 → mesma série; senão mesmo `genero` com <4 → anexa; senão cria série (`numero = max+1`); snapshots por filtro atualizados com o filtro de cada um. Helpers puros em `src/utils/edicaoSeries.ts`.
- **Drag com teto de 4 → troca**: `moverAtleta(series, atletaId, de, para, alvoId?)` em `edicaoSeries.ts` — série destino **<4** → move normalmente (filtra séries vazias); série destino **=4 com `alvoId`** → **troca** os dois (cada um assume a posição do outro, tamanhos preservados — as duas seguem cheias se ambas tinham 4); destino =4 **sem `alvoId`** → `null` (sem alvo não há com quem trocar). A página não bloqueia mais o drag: em troca mostra toast `X trocado com Y (série N).` Série com 5+ faria `reatribuirRaias` repetir raia 1 (`raias[i] ?? 1`). `removerAtletaDaSerie` filtra vazias. Raias de série ≤4 são sempre únicas (`raiasDaSerie`: 4→[1,2,3,4], 3→[2,3,4], 2→[1,2], 1→[1]).
- **Contraste de séries na UI**: `classeLinhaSerie(indice, primeira)` exportada de `TabelaGenerica` — tinta alternada por **índice no array** (não por `numero`, por causa das lacunas de numeração), `border-b` fino + `border-t-2 border-t-primary-300` na **primeira linha de cada série**; a prop `classeLinha(item)` do `TabelaGenerica` substitui as classes padrão da `<tr>` (autocontida, sem conflito). `BalizamentoPage`/`ControlePage` adicionam `indiceSerie`/`primeira` às linhas e `LinhaSorteavel` recebe a mesma classe; **área de impressão intocada**.
- **Numeração contígua + saneamento de dados legados**: invariante — `series` e `seriesPorFiltro` ficam sempre numeradas **1..n**. `renumerarSeries(series)` (em `edicaoSeries.ts`) fecha lacunas nas mutações que podem esvaziar série (`reordenarSeries`, `removerAtletaDaSerie`, `preservarSeries`; retorna o **mesmo array** se já contíguo). `sanearSeries(series)` (série >4 → corta para os 4 primeiros + `reatribuirRaias` + renumera; dado válido → mesma referência) roda no **`merge` do persist** (séries e snapshots) e no **`importarCompartilhado`** — é o que **repara sozinho séries corrompidas criadas antes do teto de 4** (sintoma: balizas duplicadas *dentro da mesma série* vindas do `localStorage`; o excedente permanece na base e volta em "Atualizar"). As utils puras (`moverAtleta`, `remapearPorNome`, `inserirAusentes`) **não** renumeram — a invariante é da store.
- **Export `.xlsx` + auto-sync do histórico**: `exportXlsx(nome, campos, linhas)` em `src/utils/xlsx.ts` (SheetJS `xlsx`, **import dinâmico** — chunk separado no build, só carrega no clique) espelha a assinatura de `exportCSV`; usada só na Balizamento (`balizamento.xlsx`) e Controle (`controle-resultados.xlsx`). **`atualizarTempoAtleta` faz upsert em `historico`** com `ano = new Date().getFullYear()` (hoje 2026) casando por `nomeChave()` (trim+lowercase) — mesmo aluno+ano **substitui**, senão append; **`tempo === undefined` não mexe** no histórico (não apaga linha vinda de CSV — o input limpa durante a digitação); escopo é só a base **Festival** (edição de tempo na Lista via `atualizarAtleta` **não** sincroniza). Na Análise, `anos` = anos do histórico **∪ ano atual** (chip e coluna 2026 sempre existem, células vazias com "—") e o label "edição(ões)" usa `anosComDados` (só anos com registros).
- **Link compartilhado payload v2 + retrocompat v1**: `serializarEstado` grava `v: 2` — séries com atletas **por id** (`{atletaId, raia}`) e atletas **sem** `medalha`/`categoriaCalculada` (recalculados na importação: `calcularMedalha`, `categoriaPorIdade`); `desserializarCompartilhado` aceita `v: 1` (forma antiga embutida) e `v: 2`; referência a id ausente é descartada. `importarLinkNoBoot` em `main.tsx` tem `try/catch/finally` — o React **sempre** monta (o bug da "sidebar sumiu" era exceção no boot antes do `createRoot`); `importarCompartilhado` força `sidebarAberta: true`. Share: `navigator.share()` quando existe (mobile/WhatsApp), fallback copy.
- **Zoom de acessibilidade**: `src/utils/zoom.ts` — `NIVEIS_ZOOM = [0.9, 1.0, 1.1, 1.25, 1.5]`, `zoomVizinho(atual, direcao)` com clamp, `aplicarZoom` seta `document.documentElement.style.zoom` (escala px+rem), persistido em `localStorage` **`festival-zoom`** (aplicado em `main.tsx` antes do render, anti-flash). Botões **A−/A+** na TopBar (`disabled` nas extremidades via `disabled:opacity-40 disabled:pointer-events-none` no Button ghost).
- **PWA**: `vite-plugin-pwa` (Workbox) no `vite.config.ts` — `registerType: 'autoUpdate'`, `injectRegister: 'auto'` (sem import no main.tsx), manifest **`display: 'fullscreen'`**/`#2563eb` (era `standalone`; trocado em v2.1.3 para **esconder a status bar do Android** — o Chrome estável não estende a viewport do PWA por baixo das barras do sistema nem com `viewport-fit=cover`; contra: relógio/bateria não aparecem no app; iOS ignora fullscreen), `navigateFallback: 'index.html'`, precache de `**/*.{js,css,html,ico,png,svg,webmanifest}`. Ícones PNG gerados via PowerShell `System.Drawing` em `public/` (192, 512, maskable, apple-touch 180). **`public/_headers`**: `Cache-Control: no-cache` em `/sw.js`, `/manifest.webmanifest`, **`/`** e **`/index.html`** (Cloudflare Pages — evita HTML velho no PWA). Cuidado no PowerShell: **`$path` é variável automática** — nunca usá-la como nome de variável local (colide com parâmetro `-Path` e quebra `GraphicsPath`).
- **Layout mobile = drawer**: causa raiz do "menu some no mobile" era **falta de responsividade** (flex fixo + sem `min-w-0` + TopBar sem truncate → scroll horizontal empurrava a sidebar para fora em retrato; paisagem >768px funcionava). Solução: `overflow-x-clip` no flex do `Layout` + `min-w-0` no main; **`< 768px` a sidebar é drawer** (`max-md:fixed` + `translate-x` off-screen quando fechada, backdrop `z-30 md:hidden`, fecha no `useEffect` de `location.pathname`); **☰** no TopBar (`md:hidden`) alterna o mesmo `sidebarAberta`; `≥ 768px` = w-56/w-14 estático como antes. `importarCompartilhado` só força `sidebarAberta: true` em desktop (`matchMedia('(min-width: 768px)')`; **fallback `true` sem `matchMedia`** preserva testes jsdom) — mobile abre o drawer fechado.
- **Link compartilhado deflate + ids curtos (API assíncrona)**: `serializarEstado`/`montarLink`/`desserializarCompartilhado` viraram **`Promise`** — compressão com `CompressionStream('deflate-raw')` + base64url (nativa, ~74% menor que lz-string na mesma base) e **ids remapeados para `"0"`,`"1"`,…** no payload (UUIDs de 36 chars eram incompressíveis); desserialização **tenta deflate e cai para lz-string** (`interpretarJson` valida shape p/ cada tentativa — deflate pode "sucessar" com lixo em dados lz); `main.tsx` roda `importarLinkNoBoot().finally(createRoot)` (React sempre monta). **lz-string continua como dependência** (só de decompressão p/ links antigos).

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

---

## Sessão: 25/11/2026 — Cronômetro: descrição da série, chip de 2 nomes e fix do input do Controle

### O que foi feito
- **Descrição da série** no modal do cronômetro: removidos categoria e nível — agora exibe só `Série {n} - {gênero}` (ex.: `Série 1 - feminino`)
- **Chip de raia**: exibe apenas o **1º e 2º nome** do aluno (`nome.trim().split(/\s+/).slice(0, 2).join(' ')`) para melhor disposição visual; `title` no chip mantém o nome completo no hover — vale para a linha horizontal e a célula Baliza (mesmo componente `ChipRaia`)
- **Fix — registro do cronômetro não aparecia no input do Controle**: `TempoInput` (`ControlePage.tsx`) guardava o valor em `useState` inicializado só na montagem; quando `gravar()` atualizava a store, a linha re-renderizava com o novo `tempo` mas o input mantinha o estado local obsoleto. Adicionado `useEffect` que sincroniza quando `parseTempo(valor) !== tempo` (não interfere na digitação, pois digitar também atualiza a store e os valores coincidem)
- Verificação: `npx tsc -b --force` 0 erros; **81 testes, 0 falhas**; `npm run build` OK
- Docs: CHANGELOG (Fixed + Added), AGENTS.md (esta sessão)

### Decisões
- Formato da descrição `Série {n} - {gênero}` conforme pedido do usuário (sem categoria/nível)
- Corte de nomes por espaço (1º + 2º token), sem exceção para preposições
- Sincronização do input por comparação `parseTempo(valor) !== tempo` (e não remount/key), para não perder foco nem engolir a máscara enquanto o usuário digita

### Arquivos
- src/components/ui/CronometroSerie.tsx
- src/pages/ControlePage.tsx
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 25/11/2026 — Chip de raia desconsidera preposições na contagem

### O que foi feito
- **`src/utils/nomes.ts`** (novo): função pura `nomeCurto(nome)` — separa por espaços, remove preposições/contrações (`de, do, da, dos, das, no, na, nos, nas, em, com, por, para, a, o`, caixa-insensível) **do texto e da contagem**, pega os 2 primeiros restantes; fallback: se a filtragem zerar os tokens, usa os 2 primeiros originais
- **`CronometroSerie.tsx`**: `ChipRaia` passa a usar `nomeCurto(nome)` (linha horizontal e célula Baliza); `title` segue exibindo o nome completo no hover
- **`src/utils/nomes.test.ts`** (novo): 6 testes (sem preposição, com preposição/contração, caixa mista, preposição entre os 2 nomes, nome único/espaços, fallback)
- Verificação: `npx tsc -b --force` 0 erros; **87 testes, 0 falhas**; `npm run build` OK
- Docs: CHANGELOG (Changed), AGENTS.md (esta sessão)

### Decisões
- Preposição é removida do texto também (escolha do usuário — chip mais curto)
- Lista de preposições + contrações comuns do português (escolha do usuário)
- Filtro em módulo utilitário puro (testável em node, sem render de componente)

### Arquivos
- src/utils/nomes.ts (novo)
- src/utils/nomes.test.ts (novo)
- src/components/ui/CronometroSerie.tsx
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 25/11/2026 — Contraste de séries + snapshot por filtro + teto de 4 no drag

### O que foi feito
- **Contraste visual entre séries** (Balizamento + Controle): `TabelaGenerica` ganhou a prop opcional `classeLinha(item)` (substitui as classes padrão da `<tr>` quando fornecida) e o export `classeLinhaSerie(indice, primeira)` — função autocontida com `border-b border-b-gray-100 dark:border-b-gray-800`, tinta alternada **por índice no array** (par: `bg-primary-50/70 hover:bg-primary-100/70 dark:bg-primary-900/25 dark:hover:bg-primary-900/40`; ímpar: hover neutro padrão) e `border-t-2 border-t-primary-300 dark:border-t-primary-700` na primeira linha de cada série; `BalizamentoPage`/`ControlePage` passam `indiceSerie`/`primeira` nas linhas e `LinhaSorteavel` recebe a mesma classe via prop `classe` (removido o `LINHA_CLASSE` fixo; a classe de drag em arraste ficou só `opacity-60 relative z-10` para não brigar com o fundo alternado). Área de impressão (`print-area`) intocada
- **Fix raias duplicadas**: novo `src/utils/edicaoSeries.ts` com `moverAtleta(series, atletaId, de, para, alvoId?)` — retorna `null` (não mexe em nada) se a série destino tem 4 atletas ou se algo não existe; filtra séries que ficam vazias; `aoTerminarDrag` da `BalizamentoPage` virou checagem de teto + toast **`Série {n} já está completa (4 atletas).`** + chamada única de `moverAtleta` (removido o `arrayMove` inline e o mapa/filter duplicado); `removerAtletaDaSerie` da store agora filtra séries vazias (antes só o caminho do drag filtrava)
- **Snapshot por filtro**: store ganhou `seriesPorFiltro: Record<string, Serie[]>` (chave `` `${periodo}|${genero}` ``) e `edicoesManuais: boolean`; `setPeriodo`/`setGeneroBalizamento` salvam as séries atuais na chave atual, apagam a do destino do mapa e restauram (na falta, `balizar()`); clique no chip já ativo virou no-op; `atualizarAtleta` sincroniza cópias nos snapshots; `limparAtletas('festival')`/`importarCompartilhado` limpam snapshots; `partialize` + `merge` custom (default `{} / false` para localStorage antigo); `filtrarAtletas()` exportado de `balizamento.ts`
- **Upload com edições preserva por nome**: `preservarSeries()` roda em `processarAtletas` (só com `edicoesManuais`) e em `adicionarAtleta` — `remapearPorNome` casa por `nomeChave()` (ids mudam a cada `gerarId()`), `inserirAusentes` insere **só realmente novos** (exclusões manuais não voltam) com regra de encaixe categoria+nível+gênero → gênero → série nova, e reatribui raias; snapshots atualizados com o filtro de cada um; sem flag, upload zera tudo (comportamento antigo); `importarCompartilhado` liga a flag se o link traz séries
- Testes: **`src/utils/edicaoSeries.test.ts`** (15: chave/nomeChave, moverAtleta com teto/vazia/reordenação/raias únicas, remapearPorNome, inserirAusentes com as 3 regras de encaixe) + **`src/store/useAppStore.test.ts`** (9, docblock jsdom: snapshot por filtro, no-op no chip ativo, gênero independente do período, upload com/sem flag, sync de snapshots, série vazia, flag, limpar) — **111 testes, 0 falhas**; `npx tsc -b --force` 0 erros; `npm run build` OK (CSSs `bg-primary-50/70`, `border-t-primary-300` etc. confirmados no bundle)
- Docs: CHANGELOG (Added/Fixed/Changed), AGENTS.md (Contexto Crítico + esta sessão)

### Decisões
- Contraste em Balizamento **e** Controle, **sem** mexer na área de impressão (escolha do usuário)
- Snapshot por filtro **sem confirmação** e **"Atualizar" continua regenerando** sob demanda sem resetar `edicoesManuais` (escolha do usuário)
- Upload com edições **preserva por nome**; sem edições **zera** (escolha do usuário)
- Alternância de cor por **índice no array** (não por `numero`) para duas séries vizinhas nunca ficarem com a mesma cor após lacunas de numeração
- Teto de 4 **antes** de mover (toast + aborta) em vez de redistribuir para outra série
- `importarCompartilhado` liga `edicoesManuais` quando traz séries (séries recebidas são potencialmente editadas à mão) — refinamento sobre o plano original (que zerava a flag)
- Clique no chip de filtro já ativo é no-op (melhoria colateral do snapshot)

### Arquivos
- src/utils/edicaoSeries.ts (novo)
- src/utils/edicaoSeries.test.ts (novo)
- src/store/useAppStore.test.ts (novo)
- src/store/useAppStore.ts
- src/utils/balizamento.ts
- src/components/ui/TabelaGenerica.tsx
- src/pages/BalizamentoPage.tsx
- src/pages/ControlePage.tsx
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 25/11/2026 — Reparo de séries corrompidas + numeração contígua

### O que foi feito
- **Diagnóstico** (relato do usuário testando o **site publicado**): balizas duplicadas **dentro da mesma série** + numeração pulando (5 → 7). Causas: série com 5+ atletas salva no `localStorage` (criada com o build antigo, antes do teto de 4 — o fix v1.3.0 impedia corrupção nova mas **não reparava as salvas**) e lacunas de numeração ao filtrar séries vazias (drag/✕/upload)
- **`src/utils/edicaoSeries.ts`**: novos helpers puros `renumerarSeries(series)` (`numero = índice + 1`; retorna o **mesmo array** se já contíguo) e `sanearSeries(series)` (série >4 → corta para os 4 primeiros + `reatribuirRaias` + renumera; dado válido → mesma referência)
- **`src/store/useAppStore.ts`** — aplicação nos pontos de escrita: **`merge` do persist** saneia `series` **e** cada snapshot de `seriesPorFiltro` (caminho do `localStorage` — o bug relatado); `importarCompartilhado` saneia `dados.series`; `reordenarSeries` (drag) e `removerAtletaDaSerie` (✕) renumeram após filtrar vazias; `preservarSeries` renumera a série ao vivo e cada snapshot no upload. `balizar()`, `setPeriodo`/`setGeneroBalizamento` e `atualizarAtleta` não precisaram mudar (saída já saneada)
- Testes: **+11** — `edicaoSeries.test.ts` 15→21 (`renumerarSeries`: identidade/lacuna/vazia; `sanearSeries`: 5→4 com raias únicas, série válida intacta, no-op) e `useAppStore.test.ts` 9→14 (expect `numero` 2→1 no teste de série vazia; série do meio removida renumera `[1,3]`→`[1,2]`; `reordenarSeries` com lacuna; upload fecha lacuna; import corrompido; **rehydrate do persist** com JSON corrompido no `localStorage`) — **122 testes, 0 falhas**; `npx tsc -b --force` 0 erros; `npm run build` OK
- Docs: CHANGELOG (Fixed), AGENTS.md (Contexto Crítico + esta sessão)

### Decisões
- **Cortar para 4** (escolha do usuário): o excedente permanece na base e volta ao balizamento em "Atualizar" — em vez de realocar na hora (podia misturar categorias) ou regenerar tudo na abertura (perdia todas as edições manuais)
- **Sem edição livre de baliza por duplo clique** (escolha do usuário): o conserto automático + renumeração bastam para o relatado
- Renumerar **só na store** (a invariante 1..n é da store); as utils puras (`moverAtleta`, `remapearPorNome`, `inserirAusentes`) seguem sem renumeração — os testes de comportamento delas não mudam
- `sanearSeries` é no-op em dado limpo (mesma referência) → zero churn no carregamento normal
- Publicação: após o push é preciso **Ctrl+F5** no site (bundle novo) — o `localStorage` corrompido é reparado sozinho na primeira abertura; até o deploy chegar, o build antigo continua criando corrupção nova

### Arquivos
- src/utils/edicaoSeries.ts
- src/utils/edicaoSeries.test.ts
- src/store/useAppStore.ts
- src/store/useAppStore.test.ts
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 25/11/2026 — Export .xlsx (Balizamento/Controle) + auto-sync do histórico na Análise

### O que foi feito
- **Export .xlsx**: dependência `xlsx` (SheetJS 0.18.5) + nova util `src/utils/xlsx.ts` com `exportXlsx(nome, campos, linhas)` (import dinâmico — chunk `xlsx-*.js` separado no build, só carrega no clique); **BalizamentoPage** ganhou botão "⬇️ Exportar XLSX" ao lado de Atualizar (`balizamento.xlsx`: Série, Baliza, Professor, Nome, Tempo, Medalha, Categoria, Nível) e **ControlePage** ao lado de Imprimir (`controle-resultados.xlsx`: sem Professor); guard com toast "Nada a exportar." quando vazio
- **Auto-sync do histórico**: `atualizarTempoAtleta` (store) agora faz upsert em `historico` após gravar o tempo — `ano = new Date().getFullYear()` (2026), casando por `nomeChave()` (trim+lowercase): mesmo aluno+ano substitui, senão append; campos `aluno, tempo, medalha (medalha ?? 'Sem Tempo'), categoria: categoriaOficial, genero`; **`tempo === undefined` não mexe** no histórico; escopo só a base Festival (edição na Lista via `atualizarAtleta` não sincroniza); cobre `TempoInput` e o `gravar()` do cronômetro
- **Análise — filtro 2026 sempre visível**: `anos` virou união dos anos do histórico **+ ano atual** (`useMemo`) — chip e coluna 2026 existem mesmo sem registros (células com "—"); label "N edição(ões)" passou a usar `anosComDados` (só anos com dados, sem inflar a contagem)
- Testes: **+4** em `useAppStore.test.ts` (insere no histórico com ano atual/medalha/categoria/gênero, substitui mesmo aluno+ano sem duplicar, casa por nome com caixa/espaços diferentes, `tempo undefined` não altera) — **126 testes, 0 falhas**; `npx tsc -b --force` 0 erros; `npm run build` OK (xlsx em chunk separado de 429 kB)

### Decisões
- Sync **automático a cada tempo** e **substituição** por aluno+ano (escolhas do usuário)
- Ano usa `new Date().getFullYear()` (dinâmico — vale 2026 hoje e vira 2027 sozinho)
- Limpar o input de tempo **não apaga** a linha do histórico (evita perder linha vinda de CSV durante a digitação)
- Import dinâmico do SheetJS para não pesar o bundle inicial

### Arquivos
- package.json (+xlsx)
- src/utils/xlsx.ts (novo)
- src/pages/BalizamentoPage.tsx
- src/pages/ControlePage.tsx
- src/store/useAppStore.ts
- src/pages/AnalisePage.tsx
- src/store/useAppStore.test.ts
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros


---

## Sessão: 25/11/2026 — Troca de atleta entre séries completas (drag)

### O que foi feito
- **`src/utils/edicaoSeries.ts`** — `moverAtleta()`: série destino **=4 com `alvoId`** agora faz **troca** em vez de `return null` — o atleta movido assume a posição/raia do alvo e o alvo assume a posição do movido na série de origem (tamanhos preservados, ambas seguem cheias); destino =4 **sem `alvoId`** continua `null`; destino <4 segue movendo normalmente (filtra séries vazias)
- **`src/pages/BalizamentoPage.tsx`** — removido o bloqueio prévio do `aoTerminarDrag` (toast de erro "Série N já está completa"); agora chama `moverAtleta` direto e, quando a operação foi troca, emite toast de sucesso `X trocado com Y (série N).`
- Testes: `edicaoSeries.test.ts` — teste antigo de recusa virou recusa **sem alvo** + 2 novos (troca 3↔4 com posições verificadas, troca 4↔4 mantendo completas e raias únicas) — **128 testes, 0 falhas**; `npx tsc -b --force` 0 erros; `npm run build` OK
- Docs: CHANGELOG (Changed + Fixed ajustado), AGENTS.md (Contexto Crítico + esta sessão)

### Decisões
- **Troca com o atleta sob o cursor** (drag direto, sem modal) — escolha do usuário
- Série destino cheia **sem** alvo definido mantém `null` (defensivo; o `closestCenter` do dnd-kit sempre aponta uma linha, então na prática sempre há alvo)
- Tamanhos preservados na troca (origem 3 + destino 4 continua 3+4) — o teto de 4 jamais é violado

### Arquivos
- src/utils/edicaoSeries.ts
- src/pages/BalizamentoPage.tsx
- src/utils/edicaoSeries.test.ts
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 25/11/2026 — PWA + zoom acessibilidade + link compartilhado otimizado (v2.0.0)

### O que foi feito
- **Link compartilhado — sidebar sumia ao abrir**: `importarLinkNoBoot()` (`main.tsx`) envolvido em `try/catch/finally` — exceção no boot (antes do `createRoot`) derrubava a página inteira; agora o React **sempre** monta e o `history.replaceState` roda no `finally`; `importarCompartilhado` força `sidebarAberta: true` (destinatário sempre vê o menu)
- **Link muito menor (payload `v: 2`)**: `compartilhar.ts` serializa séries com atletas **por id** (elimina duplicação dos objetos embutidos) e stripa `medalha`/`categoriaCalculada` (recalculados na importação); `desserializarCompartilhado` aceita `v: 1` (retrocompat) e `v: 2`; referência a id inexistente é descartada; teste comprova payload v2 < v1 antigo
- **Share nativo**: botão 🔗 usa `navigator.share()` quando disponível (mobile/WhatsApp), fallback copy
- **Zoom de acessibilidade**: `src/utils/zoom.ts` (`NIVEIS_ZOOM` 0.9/1.0/1.1/1.25/1.5, clamp, CSS `zoom` no `<html>`, chave `festival-zoom`); botões **A−/A+** na TopBar com `disabled` nas extremidades; aplicado em `main.tsx` anti-flash; Button ghost ganhou `disabled:opacity-40 disabled:pointer-events-none`
- **PWA**: `vite-plugin-pwa` (Workbox) — manifest standalone `#2563eb`, `registerType: 'autoUpdate'`, `injectRegister: 'auto'`, `navigateFallback: 'index.html'`, precache 54 entradas; ícones PNG gerados via PowerShell `System.Drawing` (192, 512, maskable, apple-touch 180) em `public/`; `public/_headers` (no-cache em `/sw.js` e `/manifest.webmanifest`); meta description + apple-touch-icon no `index.html`
- Testes: `compartilhar.test.ts` reescrito (11: roundtrip v2, v1 retrocompat, v2<v1, recálculo, id fantasma, validação) + `zoom.test.ts` (8) + store (sidebar) — **142 testes, 0 falhas**; `tsc -b --force` 0 erros; `npm run build` OK (PWA gerado)
- Docs: CHANGELOG (Added/Changed/Fixed), AGENTS.md (Contexto Crítico + esta sessão)

### Decisões
- **Ordem**: compartilhar (bug) → zoom → PWA por último (SW cacheia o build e atrapalaria testes anteriores)
- **Commit único `feat!:`** para o hook gerar **MAJOR → v2.0.0** de uma vez (pedido do usuário: versionamento major)
- Zoom via CSS `zoom` no documentElement (escala px e rem, suportado em todos os browsers modernos) em vez de root font-size (só rem)
- PWA com `autoUpdate` (sem botão "atualizar app"); `injectRegister: 'auto'` (sem mexer no main.tsx)
- PowerShell dos ícones: renomear `$path` → `$clip`/`$OutFile` (variável automática `$path` colidia com o parâmetro)

### Arquivos
- src/main.tsx
- src/utils/compartilhar.ts
- src/utils/compartilhar.test.ts
- src/utils/zoom.ts (novo)
- src/utils/zoom.test.ts (novo)
- src/components/layout/TopBar.tsx
- src/components/ui/Button.tsx
- src/store/useAppStore.ts
- src/store/useAppStore.test.ts
- vite.config.ts
- index.html
- public/_headers (novo)
- public/icon-192.png, icon-512.png, icon-maskable.png, apple-touch-icon.png (novos)
- package.json (+vite-plugin-pwa)
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 26/11/2026 — Fix: menu lateral some no mobile (drawer responsivo)

### O que foi feito
- **Diagnóstico** (relato: menu aparecia na paisagem, sumia/suprimia em retrato, sumia ao clicar em Balizamento, PWA instalado): causa raiz = **falta de responsividade** — `flex` fixo sem `min-w-0`, TopBar sem `truncate`, sidebar sempre no fluxo; em ~375px o conteúdo empurrava scroll horizontal e a sidebar saía da tela; paisagem (~844px ≥ 768px) não transbordava
- **`Layout.tsx`**: `min-w-0` no `<main>` + `overflow-x-clip` no flex (mata o scroll lateral)
- **`Sidebar.tsx`**: **`< 768px` vira drawer** — `max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40` com `max-md:-translate-x-full` quando fechada; backdrop `fixed inset-0 bg-black/40 z-30 md:hidden` fecha ao toque; `useEffect` em `location.pathname` fecha o drawer ao navegar (só quando `ehMobile()` via `matchMedia`); **`≥ 768px` = w-56/w-14 estático inalterado** (sem backdrop/translate)
- **`TopBar.tsx`**: botão **☰** (`md:hidden`) no início do header que alterna o mesmo `sidebarAberta`; título ganhou wrapper `min-w-0` + `truncate`; grupo de botões `shrink-0`
- **`useAppStore.ts`**: `importarCompartilhado` força `sidebarAberta: true` **só em desktop** (`matchMedia('(min-width: 768px)')`); **fallback `true` quando não há `matchMedia`** (jsdom dos testes preserva o comportamento); mobile fica com o drawer fechado (conteúdo limpo + toast)
- Verificação: **142 testes, 0 falhas**; `npx tsc -b --force` 0 erros; `npm run build` OK (PWA regenerado)
- Docs: CHANGELOG (Fixed), AGENTS.md (Contexto Crítico: Layout mobile = drawer + esta sessão)

### Decisões
- Drawer **< 768px** (Tailwind `md`) — landscape de celular cai no desktop estático (já funcionava); retrato de celular e tablets pequenos usam drawer
- Fecha ao navegar via `useEffect` no `location.pathname` (não em cada NavLink — cobre rotas novas automaticamente)
- `importarCompartilhado` não abre o drawer no mobile (evita gaveta por cima do conteúdo logo após importar o link)
- **2 commits** nesta entrega: este `fix:` (patch) + `feat:` do link deflate (minor) — escolha do usuário

### Arquivos
- src/components/layout/Layout.tsx
- src/components/layout/Sidebar.tsx
- src/components/layout/TopBar.tsx
- src/store/useAppStore.ts
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 26/11/2026 — Link compartilhado com deflate e ids curtos (v2.1.0)

### O que foi feito
- **Diagnóstico** (relato: "link ainda grande" — o link real do usuário media **16.214 chars**): payload v2 válido (79+25 atletas, 99 histórico, 7 séries) = JSON 35,7 KB comprimido p/ 16,2 KB com lz-string; dois defeitos: **lz-string é fraco p/ JSON** e **UUIDs de 36 chars são incompressíveis** (~4,7 KB do payload)
- **`src/utils/compartilhar.ts` reescrito (API assíncrona)**:
  - **Compressão**: `CompressionStream('deflate-raw')` + base64url (nativa, sem dependência) no lugar de `lz-string` na serialização
  - **Ids curtos**: `mapearIds()` remapeia UUIDs → `"0"`, `"1"`, … no payload; séries referenciam os mesmos ids curtos; na importação os ids curtos ficam no store (opacos — o app não depende do formato do UUID)
  - **Desserialização com fallback**: tenta deflate primeiro (`interpretarJson` valida shape) → se falhar, lz-string (**links v1/v2 antigos continuam abrindo**, inclusive o de 16 KB do usuário); lz-string virou só dependência de decompressão
  - Payload segue `v: 1 | 2` — sem versão nova
- **`src/main.tsx`**: `importarLinkNoBoot()` async; `createRoot` no `.finally()` — React **sempre** monta (garantia preservada)
- **`TopBar.tsx`**: `await montarLink(...)`
- **Resultado medido** (escala do link real: 79+25 atletas UUID + 99 histórico): **9.615 → 2.543 chars = −74%**
- Testes: `compartilhar.test.ts` reescrito — 13 testes (roundtrip deflate+ids curtos, URL-safe, prefixo opcional, recálculo de derivados, **ids curtos sem UUID**, **payload novo < lz antigo em 60%**, fixture legada v1 lz, fixture legada v2 lz com UUID, id fantasma, validação/limite) — **144 testes, 0 falhas**; `tsc -b --force` 0 erros; `npm run build` OK
- Docs: CHANGELOG (Changed), AGENTS.md (Contexto Crítico + esta sessão)

### Decisões
- **deflate-raw + base64url** em vez de gzip/zlib (sem header extra — menor) e em vez de manter lz-string (fraco p/ JSON repetitivo)
- **Ids curtos sem mapear de volta** — o destinatário recebe ids `"0"`,`"1"` no store; é opaco e economiza ~4,5 KB de dados incompressíveis
- **Fallback lz-string** mantido só na desserialização (links compartilhados antes desta versão continuam válidos)
- **API assíncrona** (CompressionStream é async): boot com `.finally(createRoot)` para a página nunca ficar em branco
- Ordem dos commits: drawer primeiro (fix/patch), link depois (feat/minor) — escolha do usuário

### Arquivos
- src/utils/compartilhar.ts
- src/utils/compartilhar.test.ts
- src/main.tsx
- src/components/layout/TopBar.tsx
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 26/11/2026 — Fix: modal do cronometro na borda superior + 4px mais largo

### O que foi feito
- **Diagnóstico** (relato: "modal mais próximo da borda acima" com gap visível): o código já usava `fixed inset-0` + `items-start` (y=0 do viewport) sem `mt`/`pt` — a causa era **safe-area**: o viewport não ia até a borda física do dispositivo (status bar/notch acima do `inset-0`), então o modal encostava no topo do *layout*, não da *tela*
- **`index.html`**: meta viewport ganhou **`viewport-fit=cover`** — `inset-0` passa a alcançar a borda física
- **`CronometroSerie.tsx`**: header do modal `pt-6` → **`pt-[calc(1.5rem+env(safe-area-inset-top))]`** (handle/relógio não ficam sob o notch); modal **`mx-4` → `mx-3`** (+4px de largura por lado)
- **`TopBar.tsx`** (colateral do viewport-fit): altura `h-[57px]` → **`h-[calc(57px+env(safe-area-inset-top))]`** + `pt-[env(safe-area-inset-top)]`
- **`Layout.tsx` / `Sidebar.tsx`**: `min-h-[calc(100vh-57px)]` → **`min-h-[calc(100vh-57px-env(safe-area-inset-top))]`** (casar com a nova altura do TopBar)
- Verificação: **144 testes, 0 falhas**; `npx tsc -b --force` 0 erros; `npm run build` OK
- Docs: CHANGELOG (Fixed), AGENTS.md (esta sessão)

### Decisões
- **`viewport-fit=cover` + `env()`** em vez de só empurrar o modal com margem negativa — resolve a borda física para o app inteiro (TopBar/Sidebar incluídos)
- Compensação de safe-area via **Tailwind arbitrary values** com `env()` (sem CSS extra)
- Desktop inalterado: `env(safe-area-inset-top)` = 0 fora de dispositivos com notch
- Commit único `fix:` → patch (**v2.1.1**)

### Arquivos
- index.html
- src/components/ui/CronometroSerie.tsx
- src/components/layout/TopBar.tsx
- src/components/layout/Layout.tsx
- src/components/layout/Sidebar.tsx
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 26/11/2026 — Fix: gap interno do modal do cronômetro + 0,5cm/lado de largura (v2.1.2)

### O que foi feito
- **Diagnóstico** (relato: "gap de 0,5cm do topo mesmo com as correções" + "+0,5 pra esquerda e +0,5 pra direita" = tamanho do modal; testado no **PWA instalado no celular**): eram **dois gaps** — (1) faixa acima do modal (escolhido testar cache e aceitar se persistir; se for status bar do Android com `theme-color`, conteúdo web não pinta por cima em standalone) e (2) ~24px (`pt-6`) de espaço em branco **dentro** do modal entre a borda superior e o relógio
- **`CronometroSerie.tsx`**: header `pt-[calc(1.5rem+env(...))]` → **`pt-[calc(0.5rem+env(...))]`** (24px → 8px; `env()` mantido p/ notch/edge-to-edge); handle reposicionado **`top-1.5` → `top-0.5`** (não invadir a caixa do relógio com o padding menor); modal **`max-w-lg` (512px) → `max-w-[550px]`** (+19px/lado ≈ 0,5cm exatos no desktop) e **`mx-3` removido** (no celular `<550px` o modal vai colado às bordas, ganhando o máximo possível ~0,32cm/lado)
- **`public/_headers`**: `Cache-Control: no-cache` em **`/`** e **`/index.html`** (Cloudflare Pages) — evita HTML velho no cache/service worker; complementa o `no-cache` já existente em `/sw.js` e `/manifest.webmanifest`
- Verificação: `npx tsc -b --force` 0 erros; **144 testes, 0 falhas**; `npm run build` OK (PWA 61 entradas) + sanity no `dist/`: `viewport-fit=cover` no HTML, `max-width:550px` e `safe-area-inset-top` no CSS
- Docs: CHANGELOG (Fixed), AGENTS.md (esta sessão)

### Decisões
- **Faixa acima do modal**: usuário optou por **testar cache e aceitar** — após deploy, fechar o PWA de vez (limpar recentes) e reabrir; se persistir, é a status bar do Android (faixa em branco/azul sem ícones) e fica aceita (alternativa futura seria `manifest.display: 'fullscreen'`, que esconde a status bar — não implementada)
- Gap interno resolvido reduzindo o `pt` do header (não `env()`) — `env()` segue compensando notch quando o viewport é edge-to-edge
- Largura: `max-w-[550px]` escolhido para dar exatamente +0,5cm por lado (512 + 2×19px); margem lateral zerada no celular em vez de negativa (não sai da tela)
- Handle mantido (é decorativo; o modal não arrasta) e reposicionado no lugar do padding removido
- Commit único `fix:` → patch (**v2.1.2**)

### Arquivos
- src/components/ui/CronometroSerie.tsx
- public/_headers
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 26/11/2026 — Fix: manifest fullscreen (some a status bar do PWA) (v2.1.3)

### O que foi feito
- **Diagnóstico com print** (`printcrono.jpeg` na raiz): faixa azul de ~0,5cm no topo do PWA instalado **ainda presente** após o v2.1.2 — a faixa é a **status bar do Android** (relógio 02:41, bateria 81%, ícones) pintada com o `theme-color`, **fora da viewport web**; verificação via `webfetch` do site publicado confirmou `viewport-fit=cover` + bundle `index-Akvqa29X.css` no ar (deploy ok) — ou seja, o Chrome estável **não estende a viewport do PWA standalone por baixo das barras do sistema** com `viewport-fit=cover` (comportamento atrás de flag/version-dependent). Nenhum CSS pinta por cima da status bar
- **`vite.config.ts`**: manifest do PWA `display: 'standalone'` → **`display: 'fullscreen'`** — some a status bar **e** a barra de navegação inferior, e o modal encosta no topo físico da tela
- Verificação: `npx tsc -b --force` 0 erros; **144 testes, 0 falhas**; `npm run build` OK (PWA 62 entradas) + sanity: `dist/manifest.webmanifest` com `"display":"fullscreen"`
- Docs: CHANGELOG (Fixed), AGENTS.md (esta sessão)

### Decisões
- **Fullscreen é a única forma de remover a faixa** em Chrome estável (as alternativas avaliadas: `theme-color` na cor do fundo — só some o contraste, e aceitar — usuário escolheu fullscreen)
- Contra aceito: **relógio/bateria não ficam visíveis** durante o uso (dá pra puxar a notificação); barra de navegação inferior também some (mais altura útil)
- `theme_color`/`background_color` no manifest mantidos (splash de abertura continua azul da marca); `env(safe-area-inset-top)` no TopBar/modal segue útil p/ notch em fullscreen
- iOS não suporta `display: fullscreen` em PWA (cai para standalone) — sem efeito colateral no iPhone
- Pós-deploy: pode ser preciso **remover o ícone e reinstalar o PWA** se o Chrome não atualizar o display mode sozinho
- Commit único `fix:` → patch (**v2.1.3**)

### Arquivos
- vite.config.ts
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros

---

## Sessão: 26/11/2026 — Fix: drag & drop dos chips/linhas não funcionava no toque (mobile)

### O que foi feito
- **Diagnóstico** (relato: "drag and drop dos chips de alunos não funcionou no mobile", logo após o fullscreen confirmado): `ChipRaia` (modal do cronômetro) e `LinhaSorteavel` (linhas da edição do balizamento) estavam **sem `touch-none`** — no Chrome mobile, sem `touch-action: none` o navegador reivindica o gesto para **rolar** e dispara `pointercancel` antes de o `PointerSensor` (`distance: 8`) ativar; o drag nunca começa. Prova: os botões ▶ Iniciar/■ Parar já tinham `touch-none` e arrastavam normalmente; desktop (mouse) nunca foi afetado
- **`CronometroSerie.tsx`**: `touch-none` adicionado à classe do `ChipRaia`
- **`BalizamentoPage.tsx`**: `touch-none` adicionado à `<tr>` do `LinhaSorteavel` (mesmo defeito latente; a linha só é renderizada no modo edição, então a rolagem por toque só perde o gesto quando o usuário está editando — exatamente a hora de arrastar)
- Verificação: `npx tsc -b --force` 0 erros; **144 testes, 0 falhas**; `npm run build` OK + sanity: string `cursor-grab active:cursor-grabbing touch-none` no bundle atual (`index-Dqjrts9b.js`) e `.touch-none{touch-action:none}` no CSS
- Docs: CHANGELOG (Fixed), AGENTS.md (esta sessão)

### Decisões
- **`touch-none` no elemento arrastável** é a regra do dnd-kit em touch (`touch-action: none` no `useDraggable`/`useSortable`); sem CSS extra nem dependência nova
- Trade-off aceito: toque iniciado num chip não rola a página (chips ficam no header fixo do modal — sem perda); no balizamento, só no modo edição
- Limiar `distance: 8` mantido (funciona igual no toque)
- **Nota de ambiente**: o `dist/` local **acumula builds antigos** (15 CSS de 10/10 a hoje; `emptyOutFile` não limpa) — inofensivo para o deploy (Cloudflare Pages builda em clone limpo), mas o precache local contém entradas órfãs; não confiar no hash do bundle local sem checar o `LastWriteTime`
- Commit único `fix:` → patch (**v2.1.4**)

### Arquivos
- src/components/ui/CronometroSerie.tsx
- src/pages/BalizamentoPage.tsx
- CHANGELOG.md
- AGENTS.md

### Typecheck
- Frontend: 0 erros
- Backend: 0 erros
