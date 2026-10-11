# PRD — Festival Interno

> Aplicativo web para gestão do **Festival de Natação Contra-Relógio** (provas de 25 m contra o relógio). Cobre cadastro de atletas, balizamento automático, cálculo de medalhas por tabela de índices, controle de resultados e análise comparativa entre edições.

---

## 1. Objetivo

Criar um SPA que:
- Elimine erros manuais de balizamento e cálculo de medalhas
- Padronize a categorização por ano de nascimento (com atualização automática para o ano corrente)
- Permita análise histórica comparativa entre edições
- Ofereça impressão limpa de resultados e balizamento

---

## 2. Escopo

### 2.1 Dentro do escopo
- Upload de CSV de atletas
- Listagem geral com categoria recalculada para 2026
- Balizamento automático (manhã / tarde / geral)
- Controle de tempos e cálculo de medalhas
- Análise comparativa com eventos anteriores (upload de CSVs)
- Impressão de resultados e balizamento
- Tema claro/escuro (dark mode)

### 2.2 Fora do escopo (v1)
- Backend / autenticação / multiusuário
- Banco de dados remoto (usar `localStorage`)
- Cronometragem em tempo real
- PWA offline (apenas meta `theme-color`)

---

## 3. Stack Técnica

| Camada | Tecnologia |
|---|---|
| Build | Vite |
| UI | React 18 + TypeScript |
| Estilo | Tailwind CSS (`darkMode: 'class'`) |
| Roteamento | React Router v6 |
| Estado global | Zustand |
| CSV | PapaParse |
| Testes | Vitest |
| Fonte | Inter (via CSS, sem Google Fonts) |

---

## 4. Identidade Visual

Replicar **fielmente** o Design System "Fizapp":

- **Fonte**: `Inter, system-ui, Avenir, Helvetica, Arial, sans-serif` + `-webkit-font-smoothing: antialiased`
- **Cor primária**: `primary-600 = #2563eb` (botões, links, `theme-color`)
- **Paleta primary completa** (50→900) em `tailwind.config.js`
- **Dark mode**: prefixo `dark:` no mesmo elemento, classe `dark` no `<html>`, persistência em `localStorage`
- **Sem design tokens CSS** — tudo via classes Tailwind
- **NÃO** usar `bg-blue-600` direto para ações primárias — usar `bg-primary-600`
- **Radii**: `rounded-md` (inputs/botões), `rounded-xl` (cards), `rounded-full` (pills/badges), `rounded-lg` (modais)
- **Transições**: `transition-colors` (botões), `transition-all duration-300 ease-in-out` (sidebar)
- **Focus**: `focus:outline-none focus:ring-2 focus:ring-primary-500`
- **Meta PWA**: `<meta name="theme-color" content="#2563eb" />`

> Referência completa de componentes (botões, inputs, cards, modais, tabelas, sidebar, toasts, badges, chips, banners, animações) disponível no arquivo `identidade visual Fizapp.txt` — deve ser seguida como fonte da verdade.

### 4.1 Cores semânticas de medalha

| Medalha | Light | Dark |
|---|---|---|
| OURO | `bg-yellow-100 text-yellow-800` | `dark:bg-yellow-900/30 dark:text-yellow-400` |
| PRATA | `bg-gray-200 text-gray-700` | `dark:bg-gray-700 dark:text-gray-300` |
| BRONZE | `bg-orange-100 text-orange-800` | `dark:bg-orange-900/30 dark:text-orange-400` |
| Sem Tempo | `bg-gray-100 text-gray-500` | `dark:bg-gray-800 dark:text-gray-400` |

---

## 5. Regras de Negócio

### 5.1 Tabela de Índices — Feminino (25 m)

| Categoria | Nasc. | Idade | OURO | PRATA | BRONZE |
|---|---|---|---|---|---|
| Pré-Mirim | até 8 | < 28,00 | 28,00–30,00 | > 30,00 |
| Mirim | 9-10 | < 22,00 | 22,00–27,00 | > 27,00 |
| Petiz | 11-12 | < 21,00 | 21,00–24,00 | > 24,00 |
| Infantil |13-14 | < 19,00 | 19,00–22,00 | > 22,00 |
| Juvenil | 15-16 | < 18,00 | 18,00–21,00 | > 21,00 |
| Júnior | 17-19 | < 17,00 | 17,00–20,00 | > 20,00 |
| Sênior | 20+ | < 16,00 | 16,00–19,00 | > 19,00 |

### 5.2 Tabela de Índices — Masculino (25 m)

| Categoria | Nasc. | Idade | OURO | PRATA | BRONZE |
|---|---|---|---|---|---|
| Pré-Mirim | até 8 | < 28,00 | 28,00–30,00 | > 30,00 |
| Mirim | 9-10 | < 22,00 | 22,00–27,00 | > 27,00 |
| Petiz | 11-12 | < 21,00 | 21,00–24,00 | > 24,00 |
| Infantil |13-14 | < 18,00 | 18,00–21,00 | > 21,00 |
| Juvenil | 15-16 | < 17,00 | 17,00–20,00 | > 20,00 |
| Júnior | 17-19 | < 16,00 | 16,00–19,00 | > 19,00 |
| Sênior | 20+ | < 15,00 | 15,00–18,00 | > 18,00 |

### 5.3 Cálculo de medalha
- `tempo` vazio, `0` ou não numérico → **"Sem Tempo"**
- Comparar `tempo` com a faixa da **categoria do atleta + gênero**
- Aceitar separador decimal `.` ou `,`

### 5.4 Categorias
- A categoria válida é a **informada no CSV** (`categoria`): ela rege medalha, balizamento e telas
- Motivo: a categoria oficial é definida pelo **ano de nascimento**, que não consta no arquivo — a idade sozinha erra nas fronteiras do ano
- Subclasses/turmas (`Mirim II`, `Petiz A`) são normalizadas para a categoria-base

### 5.5 Balizamento
- Filtro de período: **manhã** / **tarde** / **geral**
- Ordem obrigatória: **feminino primeiro, depois masculino**
- Agrupar por `categorias` + `nível`
- Tamanho da série: máximo **4**; composição válida **4 ou 3**; **nunca 2**; **nunca 1**
  - Estratégia: blocos de 4; resto 3 → série de 3; resto 2 → redistribuir com série adjacente (ex.: 3+3); resto 1 → redistribuir (ex.: 4+3 ou 3+3+3)
- Raias:
  - Série de **4** → raias **1, 2, 3, 4**
  - Série de **3** → raias **2, 3, 4**
  - **Nunca usar raia 5**

---

## 6. Requisitos Funcionais

### RF01 — Tela de Carregamento de CSV (`/carregar`)
- Upload de CSV com colunas: `nome, ano_nascimento, genero, horario, professor, nivel, tempo`
- Preview em tabela (mesmo estilo do Design System)
- Validações: campos obrigatórios; `genero ∈ {feminino, masculino}`; `horario ∈ {manhã, tarde}` ou horário (`08:45` — corte 13h)
- Feedback via **Toast** (sucesso verde / erro vermelho)
- Botão "Processar" (Primary) persiste em Zustand + `localStorage`
- Ignorar linhas vazias ou cabeçalho repetido

### RF02 — Lista de Atletas (`/lista`)
- Card com heading (ícone 🏊 + título)
- Tabela com **categoria oficial do CSV**
- Colunas: `nome | idade | categoria | gênero | horário | professor | nível | tempo`
- **SearchInput** com lupa para busca por nome
- **Filtros em chips** (padrão RF05): categoria, gênero + ícone **↺ limpar filtros**
- **Ordenação por clique no header** de qualquer coluna (asc/desc, seta ▲/▼; tempo vazio sempre no fim)
- **Edição por duplo clique** em qualquer coluna: altera o registro-base do atleta (raiz), recalcula medalha quando tempo/categoria/gênero mudam e sincroniza as séries
- Botão "Exportar CSV" (Secondary)

### RF03 — Balizamento (`/balizamento`)
- Controles: **Pills** `Manhã | Tarde | Geral` + **Pills** `Todos | Feminino | Masculino` (filtro em cascata)
- **Execução automática** ao trocar filtros; botão Primary **"Atualizar"** regenera sob demanda (descarta ajustes manuais)
- Coluna Aviso: **removida da UI** — nenhum aviso exibido na tabela (o campo `aviso` permanece nos dados do algoritmo, sem impacto visual)
- **Modo edição** (✏️ no topo, canto direito do grid): **drag & drop** (dnd-kit) reordena linhas e move atletas entre séries (raias reatribuídas); botão **✕** exclui do balizamento o atleta que faltou (reaparece ao atualizar)
- Resultado em tabela: `série | baliza | professor | nome | tempo | medalha | categoria | nível`
- Algoritmo conforme §5.5

### RF04 — Controle (`/controle`)
- Lista do balizamento com colunas: `tempo | medalha | categoria | nível`
- Edição inline do tempo (input padrão) → **recalcula medalha em tempo real**
- Botão Primary "Imprimir Resultados" → layout `nome | tempo | medalha | categoria`
- Usar `window.print()` com `@media print` ocultando TopBar/Sidebar

### RF05 — Análise Comparativa (`/analise`)
- Upload de CSVs históricos (`ano, aluno, tempo, medalha, categoria, genero`)
- Filtros: atleta (SearchInput), medalha, ano, categoria, gênero
- Panorama consolidado: uma coluna por ano (`tempo / medalha / categoria`)
- Botão Primary "Imprimir Resultados Filtrados"

---

## 7. Modelo de Dados

```ts
type Genero = 'feminino' | 'masculino';
type Periodo = 'manhã' | 'tarde';
type Medalha = 'OURO' | 'PRATA' | 'BRONZE' | 'Sem Tempo';
type Categoria =
  | 'Pré-Mirim' | 'Mirim' | 'Petiz' | 'Infantil'
  | 'Juvenil' | 'Júnior' | 'Sênior';

interface Atleta {
  id: string;
  nome: string;
  anoNascimento: number;
  idade: number;
  categoriaOriginal: Categoria;
  categoria2026: Categoria;
  genero: Genero;
  periodo: Periodo;
  professor: string;
  nivel: string;
  tempo?: number;
  medalha?: Medalha;
}

interface Serie {
  numero: number;
  genero: Genero;
  categoria: Categoria;
  nivel: string;
  atletas: { atleta: Atleta; raia: 1 | 2 | 3 | 4 }[];
}

interface EventoHistorico {
  ano: number;
  aluno: string;
  tempo?: number;
  medalha: Medalha;
  categoria: Categoria;
  genero?: Genero;
}