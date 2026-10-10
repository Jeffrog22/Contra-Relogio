import { describe, expect, it } from 'vitest';
import { periodoDoHorario } from './periodo';

describe('periodoDoHorario', () => {
  it('aceita as palavras manhã e tarde (caixa e acento tolerados)', () => {
    expect(periodoDoHorario('manhã')).toBe('manhã');
    expect(periodoDoHorario('MANHÃ')).toBe('manhã');
    expect(periodoDoHorario('manha')).toBe('manhã');
    expect(periodoDoHorario('Manhã')).toBe('manhã');
    expect(periodoDoHorario('tarde')).toBe('tarde');
    expect(periodoDoHorario('TARDE')).toBe('tarde');
  });

  it('converte horários com corte às 13:00', () => {
    expect(periodoDoHorario('00:00')).toBe('manhã');
    expect(periodoDoHorario('08:45')).toBe('manhã');
    expect(periodoDoHorario('11:59')).toBe('manhã');
    expect(periodoDoHorario('12:59')).toBe('manhã');
    expect(periodoDoHorario('13:00')).toBe('tarde');
    expect(periodoDoHorario('13:45')).toBe('tarde');
    expect(periodoDoHorario('23:59')).toBe('tarde');
  });

  it('aceita hora sem zero à esquerda, separadores . e h, e HH:MM:SS', () => {
    expect(periodoDoHorario('8:45')).toBe('manhã');
    expect(periodoDoHorario('13.05')).toBe('tarde');
    expect(periodoDoHorario('08h45')).toBe('manhã');
    expect(periodoDoHorario('14:30:00')).toBe('tarde');
  });

  it('rejeita horários fora de faixa, textos e vazio', () => {
    expect(periodoDoHorario('24:00')).toBeNull();
    expect(periodoDoHorario('25:99')).toBeNull();
    expect(periodoDoHorario('13:60')).toBeNull();
    expect(periodoDoHorario('noite')).toBeNull();
    expect(periodoDoHorario('13')).toBeNull();
    expect(periodoDoHorario('')).toBeNull();
    expect(periodoDoHorario('   ')).toBeNull();
  });
});
