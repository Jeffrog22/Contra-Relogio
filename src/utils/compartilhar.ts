import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Atleta, EventoHistorico, GeneroOpcao, PeriodoOpcao, Serie } from '../types';

export const PREFIXO_HASH = '#d=';

/** Teto do hash na URL (~2 MB é o limite prático dos navegadores; margem p/ base/UI). */
export const MAX_HASH = 1_500_000;

export interface DadosCompartilhados {
  atletas: Atleta[];
  atletasApresentacao: Atleta[];
  series: Serie[];
  periodo: PeriodoOpcao;
  generoBalizamento: GeneroOpcao;
  historico: EventoHistorico[];
}

export interface PayloadCompartilhado extends DadosCompartilhados {
  v: 1;
}

export function serializarEstado(dados: DadosCompartilhados, max = MAX_HASH): string | null {
  const payload: PayloadCompartilhado = { v: 1, ...dados };
  const comprimido = compressToEncodedURIComponent(JSON.stringify(payload));
  return comprimido.length > max ? null : comprimido;
}

export function montarLink(base: string, dados: DadosCompartilhados): string | null {
  const comprimido = serializarEstado(dados);
  if (comprimido === null) return null;
  return `${base}${PREFIXO_HASH}${comprimido}`;
}

function payloadValido(dados: unknown): dados is PayloadCompartilhado {
  if (!dados || typeof dados !== 'object') return false;
  const p = dados as Partial<PayloadCompartilhado>;
  return (
    p.v === 1 &&
    Array.isArray(p.atletas) &&
    Array.isArray(p.atletasApresentacao) &&
    Array.isArray(p.series) &&
    Array.isArray(p.historico) &&
    typeof p.periodo === 'string' &&
    typeof p.generoBalizamento === 'string'
  );
}

export function desserializarCompartilhado(hash: string): PayloadCompartilhado | null {
  try {
    const bruto = hash.startsWith(PREFIXO_HASH) ? hash.slice(PREFIXO_HASH.length) : hash;
    if (!bruto) return null;
    const json = decompressFromEncodedURIComponent(bruto);
    if (!json) return null;
    const dados: unknown = JSON.parse(json);
    return payloadValido(dados) ? dados : null;
  } catch {
    return null;
  }
}
