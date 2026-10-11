export type Genero = 'feminino' | 'masculino';
export type GeneroOpcao = Genero | 'todos';
export type Periodo = 'manhã' | 'tarde';
export type PeriodoOpcao = Periodo | 'geral';
export type Medalha = 'OURO' | 'PRATA' | 'BRONZE' | 'Sem Tempo';
export type Categoria =
  | 'Pré-Mirim'
  | 'Mirim'
  | 'Petiz'
  | 'Infantil'
  | 'Juvenil'
  | 'Júnior'
  | 'Sênior';

export interface Atleta {
  id: string;
  nome: string;
  idade: number;
  categoriaOficial: Categoria;
  categoriaCalculada: Categoria;
  genero: Genero;
  periodo: Periodo;
  professor: string;
  nivel: string;
  tempo?: number;
  medalha?: Medalha;
}

export interface AtletaSerie {
  atleta: Atleta;
  raia: 1 | 2 | 3 | 4;
}

export interface Serie {
  numero: number;
  genero: Genero;
  categoria: Categoria;
  nivel: string;
  atletas: AtletaSerie[];
  aviso?: string;
}

export interface EventoHistorico {
  ano: number;
  aluno: string;
  tempo?: number;
  medalha: Medalha;
  categoria: Categoria;
  genero?: Genero;
}
