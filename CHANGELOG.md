# Changelog - Festival Interno PPt

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]
### Added
- (novas funcionalidades)

### Changed
- (mudanças em funcionalidades existentes)

### Fixed
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
