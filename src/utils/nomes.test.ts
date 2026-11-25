import { describe, it, expect } from 'vitest';
import { nomeCurto } from './nomes';

describe('nomeCurto', () => {
  it('mantém os dois primeiros nomes quando não há preposição', () => {
    expect(nomeCurto('Maria Clara Silva')).toBe('Maria Clara');
    expect(nomeCurto('João Pedro Santos')).toBe('João Pedro');
  });

  it('remove preposições do texto e da contagem', () => {
    expect(nomeCurto('Maria de Paula Silva')).toBe('Maria Paula');
    expect(nomeCurto('João dos Santos Oliveira')).toBe('João Santos');
    expect(nomeCurto('Ana Clara da Conceição')).toBe('Ana Clara');
    expect(nomeCurto('Lucas das Neves Souza')).toBe('Lucas Neves');
  });

  it('é insensível à caixa', () => {
    expect(nomeCurto('Maria DE Paula')).toBe('Maria Paula');
    expect(nomeCurto('ANA da Silva')).toBe('ANA Silva');
  });

  it('mantém preposição entre os dois nomes selecionados', () => {
    expect(nomeCurto('Maria de Paula')).toBe('Maria Paula');
  });

  it('aceita nome com um único token', () => {
    expect(nomeCurto('Fedora')).toBe('Fedora');
    expect(nomeCurto('  Clara  ')).toBe('Clara');
  });

  it('fallback: se filtrar tudo, usa os dois primeiros tokens originais', () => {
    expect(nomeCurto('de da')).toBe('de da');
    expect(nomeCurto('')).toBe('');
  });
});
