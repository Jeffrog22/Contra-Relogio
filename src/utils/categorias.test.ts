import { describe, expect, it } from 'vitest';
import { categoriaPorIdade, normalizarCategoria, rotuloCategoria } from './categorias';

describe('categoriaPorIdade (tabela oficial)', () => {
  it('marca as fronteiras exatas entre categorias', () => {
    expect(categoriaPorIdade(8)).toBe('Pré-Mirim');
    expect(categoriaPorIdade(9)).toBe('Mirim');
    expect(categoriaPorIdade(10)).toBe('Mirim');
    expect(categoriaPorIdade(11)).toBe('Petiz');
    expect(categoriaPorIdade(12)).toBe('Petiz');
    expect(categoriaPorIdade(13)).toBe('Infantil');
    expect(categoriaPorIdade(14)).toBe('Infantil');
    expect(categoriaPorIdade(15)).toBe('Juvenil');
    expect(categoriaPorIdade(16)).toBe('Juvenil');
    expect(categoriaPorIdade(17)).toBe('Júnior');
    expect(categoriaPorIdade(19)).toBe('Júnior');
    expect(categoriaPorIdade(20)).toBe('Sênior');
    expect(categoriaPorIdade(45)).toBe('Sênior');
  });

  it('é independente do ano (usada para qualquer edição)', () => {
    expect(categoriaPorIdade(7)).toBe('Pré-Mirim');
    expect(categoriaPorIdade(18)).toBe('Júnior');
  });
});

describe('normalizarCategoria', () => {
  it('aceita caixa e acentos diferentes', () => {
    expect(normalizarCategoria('pré-mirim')).toBe('Pré-Mirim');
    expect(normalizarCategoria('PRE MIRIM')).toBe('Pré-Mirim');
    expect(normalizarCategoria('júnior')).toBe('Júnior');
    expect(normalizarCategoria('junior')).toBe('Júnior');
    expect(normalizarCategoria('  senior ')).toBe('Sênior');
  });

  it('retorna null para categoria desconhecida', () => {
    expect(normalizarCategoria('master')).toBeNull();
    expect(normalizarCategoria('')).toBeNull();
  });
});

describe('rotuloCategoria', () => {
  it('concatena a faixa etária (estilo planilha)', () => {
    expect(rotuloCategoria('Petiz')).toBe('Petiz (11-12)');
    expect(rotuloCategoria('Sênior')).toBe('Sênior (20+)');
    expect(rotuloCategoria('Pré-Mirim')).toBe('Pré-Mirim (até 8)');
  });
});
