import { describe, expect, it } from 'vitest';
import {
  calcularMedalha,
  formatTempo,
  mascaraTempo,
  parseTempo,
} from './medalhas';

describe('calcularMedalha', () => {
  it('feminino Petiz: limites exatos da tabela', () => {
    expect(calcularMedalha(20.99, 'Petiz', 'feminino')).toBe('OURO');
    expect(calcularMedalha(21, 'Petiz', 'feminino')).toBe('PRATA');
    expect(calcularMedalha(24, 'Petiz', 'feminino')).toBe('PRATA');
    expect(calcularMedalha(24.01, 'Petiz', 'feminino')).toBe('BRONZE');
    expect(calcularMedalha(45.5, 'Petiz', 'feminino')).toBe('BRONZE');
  });

  it('masculino Infantil: limites exatos da tabela', () => {
    expect(calcularMedalha(17.99, 'Infantil', 'masculino')).toBe('OURO');
    expect(calcularMedalha(18, 'Infantil', 'masculino')).toBe('PRATA');
    expect(calcularMedalha(21, 'Infantil', 'masculino')).toBe('PRATA');
    expect(calcularMedalha(21.01, 'Infantil', 'masculino')).toBe('BRONZE');
  });

  it('masculino Sênior: limites exatos da tabela', () => {
    expect(calcularMedalha(14.99, 'Sênior', 'masculino')).toBe('OURO');
    expect(calcularMedalha(15, 'Sênior', 'masculino')).toBe('PRATA');
    expect(calcularMedalha(18, 'Sênior', 'masculino')).toBe('PRATA');
    expect(calcularMedalha(18.01, 'Sênior', 'masculino')).toBe('BRONZE');
  });

  it('tempo vazio, 0 ou inválido vira Sem Tempo', () => {
    expect(calcularMedalha(undefined, 'Mirim', 'feminino')).toBe('Sem Tempo');
    expect(calcularMedalha(null, 'Mirim', 'feminino')).toBe('Sem Tempo');
    expect(calcularMedalha(0, 'Mirim', 'feminino')).toBe('Sem Tempo');
    expect(calcularMedalha(-3, 'Mirim', 'feminino')).toBe('Sem Tempo');
    expect(calcularMedalha(NaN, 'Mirim', 'feminino')).toBe('Sem Tempo');
  });
});

describe('parseTempo', () => {
  it('aceita ponto, vírgula e máscara', () => {
    expect(parseTempo('34.66')).toBe(34.66);
    expect(parseTempo('34,66')).toBe(34.66);
    expect(parseTempo("34'66")).toBe(34.66);
    expect(parseTempo(22.36)).toBe(22.36);
  });

  it('vazio, 0 ou texto inválido vira undefined (Sem Tempo)', () => {
    expect(parseTempo('')).toBeUndefined();
    expect(parseTempo('   ')).toBeUndefined();
    expect(parseTempo('abc')).toBeUndefined();
    expect(parseTempo('0')).toBeUndefined();
    expect(parseTempo('0,00')).toBeUndefined();
    expect(parseTempo(null)).toBeUndefined();
    expect(parseTempo(undefined)).toBeUndefined();
  });
});

describe('mascaraTempo', () => {
  it('formata 4 dígitos como 00\'00', () => {
    expect(mascaraTempo('3466')).toBe("34'66");
    expect(mascaraTempo('34')).toBe('34');
    expect(mascaraTempo('1845a9')).toBe("18'45");
    expect(mascaraTempo('')).toBe('');
  });

  it('roundtrip máscara → parse', () => {
    expect(parseTempo(mascaraTempo('2236'))).toBe(22.36);
  });
});

describe('formatTempo', () => {
  it('formata com vírgula decimal', () => {
    expect(formatTempo(34.66)).toBe('34,66');
    expect(formatTempo(undefined)).toBe('—');
  });
});
