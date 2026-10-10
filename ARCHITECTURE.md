# ARCHITECTURE — Festival Interno PPt

> Arquitetura do SPA. Toda implementação deve seguir esta estrutura (ver `DEVELOPMENT.md` §6).

## Visão Geral

SPA React 18 + TypeScript (Vite), **sem backend**. Estado global em Zustand com persistência em `localStorage`. CSVs são processados inteiramente no navegador (PapaParse).

```
Usuário → Página (src/pages) → Store (src/store) → Utilitários de domínio (src/utils)
                ↓                                        ↓
        Componentes (src/components)              types.ts (contratos)
```

Regra de ouro: **regras de negócio vivem em `src/utils/`** (puras, testáveis, sem React). Componentes só orquestram UI e chamam a store.

## Camadas

| Camada | Pasta | Responsabilidade |
|---|---|---|
| Páginas | `src/pages/` | Uma por rota (RF01–RF05); composição de UI + chamadas à store |
| Componentes | `src/components/` | `ui/` = Design System reutilizável; `layout/` = TopBar, Sidebar, Layout |
| Estado | `src/store/useAppStore.ts` | Zustand + `persist`; ações (processar, balizar, editar tempo, tema, toast) |
| Domínio | `src/utils/` | `categorias`, `medalhas`, `balizamento`, `csv` — funções puras + testes co-localizados |
| Contratos | `src/types.ts` | `Atleta`, `Serie`, `EventoHistorico`, unions (`Genero`, `Periodo`, `Medalha`, `Categoria`) |

## Rotas

| Rota | Página | Fluxo |
|---|---|---|
| `/carregar` | `CarregarPage` | Upload CSV → validação → preview → Processar |
| `/lista` | `ListaPage` | Busca, categoria recalculada, export CSV |
| `/balizamento` | `BalizamentoPage` | Pills de período → Executar → tabela de séries |
| `/controle` | `ControlePage` | Edição inline de tempo (máscara `00'00`) → medalha ao vivo → impressão |
| `/analise` | `AnalisePage` | Upload histórico → filtros → panorama por ano → impressão |

`/` e rotas desconhecidas redirecionam para `/lista`.

## Convenções

- **Design System**: seguir `identidade visual Fizapp.txt` à risca. Nenhuma cor fora da paleta `primary` + semânticas. Sempre variantes `dark:`. Nunca usar `bg-blue-600` para ação primária (usar `bg-primary-600`).
- **Componentes**: `PascalCase` em arquivos `.tsx`; variantes via props (`variante`, `tom`, `ativo`).
- **Estado**: mutações passam pelas ações da store; páginas nunca escrevem direto no `localStorage` (exceto o bootstrap do tema em `main.tsx`).
- **Domínio puro**: `src/utils/**` não importa React nem store — só `types.ts`. Testes Vitest co-localizados (`*.test.ts`), ambiente `node`.
- **Impressão**: elementos de chrome (TopBar/Sidebar/botões) recebem `no-print`; áreas de impressão, `print-area` (+ wrapper `hidden print:block` quando necessário).
- **Persistência**: chave `festival-storage` (Zustand) + `festival-tema` (bootstrap anti-flash do dark mode).

## Decisões Técnicas

1. **Tailwind 3.4 fixado** — o Design System exige `tailwind.config.js` com `darkMode: 'class'`, padrão do Tailwind 3 (Tailwind 4 usa CSS-first).
2. **Categoria independente de ano** — a categoria vem da idade (coluna do CSV) + tabela por gênero; não existe "ano do festival" no código. `categoriaOficial` (CSV) vs `categoriaCalculada` (tabela) → flag `divergencia` para auditoria.
3. **Balizamento com redistribuição** — preferem-se séries por grupo (`categoria + nível`); só quando há sobras (1, 2 ou 5 no grupo) os atletas se misturam ao grupo vizinho do mesmo gênero. Séries impossíveis (1, 2 ou 5 atletas isolados) emitem aviso na tabela em vez de quebrar o fluxo.
4. **Sem backend** — multiusuário/servidor estão fora do escopo v1 (PRD §2.2).
