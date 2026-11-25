# Changelog - Festival Interno

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]
### Fixed
- **Controle**: campo de tempo não refletia o valor gravado pelo cronômetro da série — `TempoInput` mantinha estado local inicializado só na montagem; agora sincroniza com a prop `tempo` quando o valor da store diverge do digitado (`parseTempo(valor) !== tempo`), sem interferir na digitação

### Added
- **Cronômetro da série redesenhado (referência `crono.html`, cores do DS)**: modal **centralizado rente à borda superior** (não arrasta); botões **▶ Iniciar** (canto sup. esquerdo) e **■ Parar** (canto sup. direito) **arrastáveis livremente** dentro do modal com posição persistida em `localStorage` (`festival-crono-btns`); clique curto no Parar **captura a chegada** em sequência ordinal (1 clique = 1 tempo, até a série toda — depois o cronômetro para sozinho com toast); **segurar Parar 3s zera** tempo e registros pendentes (com `user-select:none`, bloqueio de menu de contexto e `touch-callout:none` — sem seleção/copiar/traduzir do navegador); **linha horizontal de chips `raia-nome` abaixo do cronômetro** com **drag & drop** (@dnd-kit) para os **tempos pendentes** (tabela Ordem/Tempo/Baliza); chip atribuído **some da linha** e o **último chip restante é atribuído automaticamente** (com 2+ chips, espera o arraste); devolver o chip à zona de chips desatribui; botão **Registrar** grava todos os tempos atribuídos via `atualizarTempoAtleta` (2 casas) e **fecha o modal**
- `src/hooks/useCronometro.ts` reescrito (estado: `pendentes` + `atribuicoes` + auto-último-chip; API: `iniciar`/`capturar`/`zerar`/`atribuir`/`desatribuir`/`gravar`) + 11 testes reescritos em `useCronometro.test.ts`
- `src/components/ui/CronometroSerie.tsx` reescrito: display mestre `00'00"00` com badge Rodando/Parado, caixa escura do crono com acento `primary-400`, chips estilo chip do DS (`bg-blue-100 … rounded-full`), botões Primary/Danger do DS; descrição da série reduzida para `Série {n} - {gênero}` (sem categoria/nível) e chip de raia exibe só o **1º e 2º nome** do aluno (`title` mantém o nome completo no hover)
- Testes de hook: `useCronometro.test.ts` usa docblock `// @vitest-environment jsdom` (jsdom só nesse arquivo; os demais seguem em node)
- **Link compartilhável com dados embutidos**: botão 🔗 no TopBar copia uma URL com todos os dados (Festival, Apresentação, séries, filtros de balizamento e histórico da Análise) comprimidos via `lz-string` no hash `#d=`; ao abrir o link o app importa tudo (substituindo o que houver no navegador do destinatário), avisa por toast e limpa o hash (refresh não reimporta); payload versionado (`v: 1`) com validação de shape; guarda de tamanho (~1,5 M de caracteres) com toast de erro; nova action `importarCompartilhado(dados)` no store; sem backend
- `src/utils/compartilhar.ts` + 6 testes de roundtrip/validação/tamanho
- **Lista de Atletas**: botão **"+ Adicionar Atleta"** — modal com formulário manual (nome, idade, categoria, gênero, horário, professor, nível e tempo opcional) que insere na base sem CSV; bloqueia nome duplicado (case-insensitive), calcula `categoriaCalculada`/medalha e regenera as séries automaticamente quando já existem; primeiro uso real do componente `Modal`
- Store: `adicionarAtleta` (retorna `false` em categoria inválida ou duplicado; gera id, recalcula medalha e re-executa `balizar` se houver séries)
- **Lista de Atletas**: filtros em chips replicando o padrão da Análise (medalha, categoria, gênero) com ícone **↺ limpar filtros**; **edição por duplo clique** em qualquer coluna — altera o registro-base (raiz), recalcula medalha e sincroniza as séries (nome, idade, categoria via select, gênero, horário, professor, nível e tempo)
- **Balizamento**: filtro de **gênero** (Todos/Feminino/Masculino) em cascata com o período e **execução automática** ao trocar filtros (botão renomeado para **"Atualizar"**)
- **Balizamento**: coluna **Aviso** dedicada (ex.: `redistribuída com grupo vizinho`) — sai do interior da coluna Série
- **Balizamento**: ✏️ **modo edição** no topo do grid (canto direito) com **drag & drop** (@dnd-kit) para reordenar linhas e mover atletas entre séries (raias reatribuídas automaticamente) e botão **✕** por linha para excluir do balizamento o atleta que faltou (reaparece ao atualizar)
- Dependências: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`
- `TabelaGenerica` ganhou a prop opcional `renderLinha` (linhas customizadas com hooks, ex.: `useSortable`)
- Store: `atualizarAtleta`, `removerAtletaDaSerie`, `reordenarSeries`, `generoBalizamento` (persistido) e `executarBalizamento(silencioso)`; `balizar()` aceita 3º parâmetro de gênero + helper `reatribuirRaias()` (com testes)
- Indicador discreto da versão no TopBar (logo após o nome do app): texto cinza `text-[10px]` sem fundo (`v{versão}`); versão injetada em build via `define` do Vite a partir da tag Git (`git describe`, fallback `package.json`)
- `periodoDoHorario()` (`src/utils/periodo.ts`): converte a coluna `horario` em período — aceita `manhã`/`tarde` **ou horário** (`08:45`, `13.05`, `08h45`); corte às 13:00 (antes → manhã, a partir → tarde); instrução na tela de upload atualizada
- Subclasses/turmas de categoria no CSV (`Mirim II`, `Pré-Mirim II`, `Petiz A`) são normalizadas para a categoria-base em `normalizarCategoria` (match exato ou por remoção de tokens finais; `Master` continua inválido)
- Botão **"Limpar carregamento"** no CarregarPage: limpa atletas e séries do app (histórico da Análise fica intocado)
- **Bases independentes Festival × Apresentação**: store ganhou `atletasApresentacao` (persistido em `festival-storage`) — Upload Festival alimenta a Lista Festival (`processarAtletas`) e Upload Apresentação alimenta a Lista Apresentação (`processarApresentacao`); um upload não sobrescreve mais o outro nem zera as séries indevidamente
- Coluna opcional **`tipo`** no CSV de atletas (aceita `Crawl c/ prancha` / `Crawl s/ prancha` com caixa e variações toleradas; vazio/ausente → `undefined`, inválido → erro de linha) — lida pelos dois uploads
- **Lista Apresentação**: chip filtro **Período** (Todos | manhã | tarde), junto aos filtros de Nível, Gênero e Tipo

### Added
- **Lista Apresentação** (nova tela `/lista-apresentacao`): mesmo layout/grid/lógica da Lista Festival, com filtros por chips — Nível (Todos | Iniciação A | Iniciação B), Gênero (Todos | feminino | masculino) e Tipo (Todos | Crawl c/ prancha | Crawl s/ prancha); busca, ordenação por header, edição inline (duplo clique) e export CSV (`listagem-apresentacao.csv`); modal "Adicionar atleta" com campo Tipo
- Campo opcional `tipo` (`'Crawl c/ prancha' | 'Crawl s/ prancha'`) no `Atleta` — usado apenas como filtro na Lista Apresentação (não afeta medalha nem balizamento)
- Ícone emoji `🤿` (mergulho com máscara e snorkel) no item de menu e no CardHeading da Lista Apresentação
- **Upload Apresentação** (nova tela `/upload-apresentacao`): mesma lógica de upload do Carregar, processa CSV automaticamente e navega para `/lista-apresentacao` após o sucesso
- Menu: 'Carregar' vira dropdown com 'Upload Festival' (/carregar) e 'Upload Apresentação' (/upload-apresentacao) como sub-itens

### Changed
- **Carregar**: CardHeading 'Upload do arquivo' → 'Upload Festival'; removeu o botão 'Processar'; CSV processado automaticamente quando válido (sem erros e com atletas), exibindo toast de erro se houver falhas de validação; navega para /lista após o sucesso
- **Menu**: ordem alterada — **Lista Apresentação** antes de **Lista Festival**
- **Lista Apresentação**: coluna **Tempo** substituída por **Tipo** (select inline com as duas opções; exportação passa a ter `tipo` no lugar de `tempo`, mantendo `medalha`); estado vazio agora aponta para `/upload-apresentacao`
- Store: `adicionarAtleta(dados, destino)` e `limparAtletas(destino)` parametrizados (padrão `festival`) — duplicado validado por lista, modal da Lista Apresentação grava na base da Apresentação; `atualizarAtleta` localiza o atleta na lista correta (cópias em `series` só quando é da base Festival)

### Changed
- **Lista de Atletas**: chips de medalha removidos (ficam só Categoria e Gênero); **ordenação por clique no header** — clique simples alterna asc/desc com seta ▲/▼ (tempo vazio sempre no fim; categoria segue a ordem oficial Pré-Mirim→Sênior)
- **Balizamento**: coluna **Aviso** removida (nenhum aviso exibido na tabela); o campo `aviso` continua nos dados/algoritmo (`serie.aviso`) sem impacto na UI; mesma limpeza no Controle
- **Menu/sidebar**: "Carregar CSV" → **"Carregar"**; "Listagem" → **"Lista de Atletas"**; H1s atualizados; botão **"Processar"** movido para o card principal de upload (acesso facilitado, desabilitado sem preview)
- **Nome do app**: "Festival Interno PPt" → **"Festival Interno"** (títulos dos docs, aba do navegador e heading da tela de Controle); ícone do card "Pré-visualização" removido
- **Categoria do CSV passou a governar tudo**: medalha, balizamento, séries e telas usam a `categoriaOficial` (a regra real é o ano de nascimento, que não vem no CSV — a idade não decide). `categoriaCalculada` fica só como referência interna; exportação de `/lista` agora tem coluna `categoria` única (a oficial); selo de divergência removido
- **Menu/sidebar**: "Lista de Atletas" → **"Lista Festival"** (rótulo e H1); novo item **"Lista Apresentação"** com rota `/lista-apresentacao`

### Fixed
- **Lista Apresentação**: chip de filtro **Nível** lê os valores reais da coluna `nivel` do CSV (dinâmico, como os chips de categoria) — estava hardcoded com "Iniciação A/B" (valores antigos)
- **Análise**: célula do grid de alunos no layout econômico de 2 linhas — linha 1: tempo + badge da medalha lado a lado (badge com largura ajustada ao conteúdo), linha 2: categoria menor em cinza
- Badge da versão travado em `0.3.2` no deploy: a sincronização `package.json`↔tag virou ciclo fechado — `.githooks/semver-bump.sh` (fonte única do bump, usada por `commit-msg` e `post-commit`) + **`post-commit` com auto-reparo**: como o git grava o tree a partir do índice em memória, o staging do `commit-msg` ficava fora do commit; o `post-commit` detecta a divergência e faz `git commit --amend` (com guard anti-recursão) **antes** de criar a tag. O fallback do build no Cloudflare Pages (clone sem tags) fica sempre correto
- Upload de CSV com BOM UTF-8 (EF BB BF) não falha mais na validação de colunas obrigatórias (`parseCSVAtletas` e `parseCSVHistorico` removem o BOM antes do parsing; `chave()` ignora `\uFEFF` residual)
- Sinônimos de coluna: histórico aceita `atleta` no lugar de `aluno`; atletas aceita `aluno`/`atleta` no lugar de `nome` (cabeçalho repetido com sinônimo também é ignorado); mensagem de coluna ausente agora lista os sinônimos aceitos. Validado com `ResultadoHistoricoGeral.csv` real (BOM + `;` + `atleta`): 97 eventos, 0 erros

### Removed
- (funcionalidades removidas)

## [v0.2.0] - 10/10/2026
### Added
- SPA React 18 + TypeScript + Vite com Tailwind (darkMode class) e Design System Fizapp
- 5 rotas: `/carregar`, `/lista`, `/balizamento`, `/controle`, `/analise`
- Upload/validação de CSV de atletas com preview e Toast (RF01)
- Listagem geral com categoria recalculada da idade, busca e export CSV (RF02)
- Balizamento automático por período (manhã/tarde/geral): séries de 3/4 atletas, raias 1–4, redistribuição de sobras com grupos vizinhos (RF03)
- Controle de tempos com máscara `00'00`, recálculo de medalha ao vivo e impressão por série (RF04)
- Análise comparativa: upload de históricos, filtros (atleta/medalha/ano/categoria/gênero) e panorama por ano com impressão (RF05)
- Cálculo de medalha pelas tabelas de índices feminino/masculino (25 m)
- Dark mode persistido, Sidebar recolhível, Toast e `@media print`
- Testes Vitest (39): medalha, categoria, balizamento (1–10 atletas, redistribuição) e CSV
- `ARCHITECTURE.md` e README do app com formatos de CSV

### Changed
- `PRD.md.md` renomeado para `PRD.md`
- Docs do kit (AGENTS/DEVELOPMENT) ajustados para a stack real (SPA sem backend)

## [v0.1.0] - 10/10/2026
### Added
- Estrutura inicial do projeto (kit de documentação)
- Documentação base (AGENTS.md, CHANGELOG.md, DEVELOPMENT.md, README.md)
- Hook SemVer automático (.githooks/post-commit)
