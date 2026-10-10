import type { Categoria } from '../types';

export const CATEGORIAS: Categoria[] = [
  'Pré-Mirim',
  'Mirim',
  'Petiz',
  'Infantil',
  'Juvenil',
  'Júnior',
  'Sênior',
];

export const FAIXAS_IDADE: Record<Categoria, string> = {
  'Pré-Mirim': 'até 8',
  Mirim: '9-10',
  Petiz: '11-12',
  Infantil: '13-14',
  Juvenil: '15-16',
  'Júnior': '17-19',
  'Sênior': '20+',
};

export function categoriaPorIdade(idade: number): Categoria {
  if (idade <= 8) return 'Pré-Mirim';
  if (idade <= 10) return 'Mirim';
  if (idade <= 12) return 'Petiz';
  if (idade <= 14) return 'Infantil';
  if (idade <= 16) return 'Juvenil';
  if (idade <= 19) return 'Júnior';
  return 'Sênior';
}

function chaveCategoria(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function normalizarCategoria(valor: string): Categoria | null {
  const limpo = chaveCategoria(valor);
  for (const cat of CATEGORIAS) {
    if (chaveCategoria(cat) === limpo) return cat;
  }
  return null;
}

export function rotuloCategoria(cat: Categoria): string {
  return `${cat} (${FAIXAS_IDADE[cat]})`;
}
