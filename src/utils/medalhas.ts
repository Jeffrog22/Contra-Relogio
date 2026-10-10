import type { Categoria, Genero, Medalha } from '../types';

export interface FaixaMedalha {
  ouroMax: number;
  prataMax: number;
}

/** OURO: tempo < ouroMax | PRATA: ouroMax <= tempo <= prataMax | BRONZE: tempo > prataMax */
export const TABELAS: Record<Genero, Record<Categoria, FaixaMedalha>> = {
  feminino: {
    'Pré-Mirim': { ouroMax: 28, prataMax: 30 },
    Mirim: { ouroMax: 22, prataMax: 27 },
    Petiz: { ouroMax: 21, prataMax: 24 },
    Infantil: { ouroMax: 19, prataMax: 22 },
    Juvenil: { ouroMax: 18, prataMax: 21 },
    'Júnior': { ouroMax: 17, prataMax: 20 },
    Sênior: { ouroMax: 16, prataMax: 19 },
  },
  masculino: {
    'Pré-Mirim': { ouroMax: 28, prataMax: 30 },
    Mirim: { ouroMax: 22, prataMax: 27 },
    Petiz: { ouroMax: 21, prataMax: 24 },
    Infantil: { ouroMax: 18, prataMax: 21 },
    Juvenil: { ouroMax: 17, prataMax: 20 },
    'Júnior': { ouroMax: 16, prataMax: 19 },
    Sênior: { ouroMax: 15, prataMax: 18 },
  },
};

export function calcularMedalha(
  tempo: number | undefined | null,
  categoria: Categoria,
  genero: Genero,
): Medalha {
  if (tempo === undefined || tempo === null || !Number.isFinite(tempo) || tempo <= 0) {
    return 'Sem Tempo';
  }
  const faixa = TABELAS[genero][categoria];
  if (tempo < faixa.ouroMax) return 'OURO';
  if (tempo <= faixa.prataMax) return 'PRATA';
  return 'BRONZE';
}

/** Aceita "34.66", "34,66", "34'66", número ou vazio. 0/vazio/não numérico → undefined (Sem Tempo). */
export function parseTempo(valor: string | number | null | undefined): number | undefined {
  if (valor === null || valor === undefined) return undefined;
  if (typeof valor === 'number') {
    return Number.isFinite(valor) && valor > 0 ? Number(valor.toFixed(2)) : undefined;
  }
  const texto = valor.trim();
  if (!texto) return undefined;

  const mascarado = texto.match(/^(\d{1,2})\s*['′]\s*(\d{1,2})$/);
  if (mascarado) {
    const segundos = Number(mascarado[1]);
    const centesimos = Number(mascarado[2]);
    const total = segundos + centesimos / 100;
    return total > 0 ? Number(total.toFixed(2)) : undefined;
  }

  const numero = Number(texto.replace(',', '.'));
  if (!Number.isFinite(numero) || numero <= 0) return undefined;
  return Number(numero.toFixed(2));
}

export function formatTempo(tempo: number | undefined): string {
  if (tempo === undefined || tempo <= 0) return '—';
  return tempo.toFixed(2).replace('.', ',');
}

/** Máscara de digitação: "3466" → "34'66" (máx. 4 dígitos). */
export function mascaraTempo(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}'${digitos.slice(2)}`;
}
