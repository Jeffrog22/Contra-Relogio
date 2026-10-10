import type { Periodo } from '../types';

function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Converte o valor da coluna `horario` em período.
 * - Palavras: `manhã`/`manha`/`tarde` (caixa e acento tolerados) → retornam direto.
 * - Horário: `08:45`, `8:45`, `12.59`, `08h45`, `14:30:00` → corte às 13:00
 *   (antes das 13:00 → manhã; a partir das 13:00 → tarde).
 * - Inválido (fora de faixa, texto, vazio) → null.
 */
export function periodoDoHorario(valor: string): Periodo | null {
  const v = normalizarTexto(valor);
  if (v === 'manha') return 'manhã';
  if (v === 'tarde') return 'tarde';

  const horario = v.match(/^(\d{1,2})[:.h](\d{2})(?::\d{2})?$/);
  if (horario) {
    const hora = Number(horario[1]);
    const minuto = Number(horario[2]);
    if (hora > 23 || minuto > 59) return null;
    return hora < 13 ? 'manhã' : 'tarde';
  }

  return null;
}
