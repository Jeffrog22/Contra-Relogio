# Changelog - Festival Interno

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]
### Added
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

### Changed
- **Lista de Atletas**: chips de medalha removidos (ficam só Categoria e Gênero); **ordenação por clique no header** — clique simples alterna asc/desc com seta ▲/▼ (tempo vazio sempre no fim; categoria segue a ordem oficial Pré-Mirim→Sênior)
- **Balizamento**: coluna **Aviso** removida (nenhum aviso exibido na tabela); o campo `aviso` continua nos dados/algoritmo (`serie.aviso`) sem impacto na UI; mesma limpeza no Controle
- **Menu/sidebar**: "Carregar CSV" → **"Carregar"**; "Listagem" → **"Lista de Atletas"**; H1s atualizados; botão **"Processar"** movido para o card principal de upload (acesso facilitado, desabilitado sem preview)
- **Nome do app**: "Festival Interno PPt" → **"Festival Interno"** (títulos dos docs, aba do navegador e heading da tela de Controle); ícone do card "Pré-visualização" removido
- **Categoria do CSV passou a governar tudo**: medalha, balizamento, séries e telas usam a `categoriaOficial` (a regra real é o ano de nascimento, que não vem no CSV — a idade não decide). `categoriaCalculada` fica só como referência interna; exportação de `/lista` agora tem coluna `categoria` única (a oficial); selo de divergência removido

### Fixed
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
