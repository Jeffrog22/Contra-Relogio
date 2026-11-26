import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type {
  Atleta,
  AtletaSerie,
  EventoHistorico,
  Genero,
  GeneroOpcao,
  Categoria,
  PeriodoOpcao,
  Serie,
} from '../types';
import { categoriaPorIdade } from './categorias';
import { calcularMedalha } from './medalhas';

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

/** Atleta sem campos derivados (medalha e categoriaCalculada são recalculados na importação). */
type AtletaSerializado = Omit<Atleta, 'categoriaCalculada' | 'medalha'>;

/** Série com atletas referenciados por id — elimina a duplicação dos objetos completos. */
interface SerieSerializada {
  numero: number;
  genero: Genero;
  categoria: Categoria;
  nivel: string;
  aviso?: string;
  atletas: { atletaId: string; raia: 1 | 2 | 3 | 4 }[];
}

export interface PayloadCompartilhado extends DadosCompartilhados {
  v: 1;
}

interface PayloadV2 {
  v: 2;
  atletas: AtletaSerializado[];
  atletasApresentacao: AtletaSerializado[];
  series: SerieSerializada[];
  periodo: PeriodoOpcao;
  generoBalizamento: GeneroOpcao;
  historico: EventoHistorico[];
}

function serializarAtleta(atleta: Atleta): AtletaSerializado {
  const { medalha: _medalha, categoriaCalculada: _calculada, ...resto } = atleta;
  return resto;
}

function serializarSerie(serie: Serie): SerieSerializada {
  return {
    numero: serie.numero,
    genero: serie.genero,
    categoria: serie.categoria,
    nivel: serie.nivel,
    ...(serie.aviso !== undefined && { aviso: serie.aviso }),
    atletas: serie.atletas.map((a) => ({ atletaId: a.atleta.id, raia: a.raia })),
  };
}

function reanimarAtleta(atleta: AtletaSerializado): Atleta {
  return {
    ...atleta,
    categoriaCalculada: categoriaPorIdade(atleta.idade),
    medalha: calcularMedalha(atleta.tempo, atleta.categoriaOficial, atleta.genero),
  };
}

function reconstruirSeries(series: SerieSerializada[], atletas: Atleta[]): Serie[] {
  const porId = new Map(atletas.map((a) => [a.id, a]));
  const resultado: Serie[] = [];
  for (const s of series) {
    const membros: AtletaSerie[] = [];
    for (const ref of s.atletas) {
      const atleta = porId.get(ref.atletaId);
      if (atleta) membros.push({ atleta, raia: ref.raia });
    }
    resultado.push({
      numero: s.numero,
      genero: s.genero,
      categoria: s.categoria,
      nivel: s.nivel,
      atletas: membros,
      ...(s.aviso !== undefined && { aviso: s.aviso }),
    });
  }
  return resultado;
}

function desserializarV2(p: PayloadV2): DadosCompartilhados {
  const atletas = p.atletas.map(reanimarAtleta);
  const atletasApresentacao = p.atletasApresentacao.map(reanimarAtleta);
  return {
    atletas,
    atletasApresentacao,
    series: reconstruirSeries(p.series, atletas),
    periodo: p.periodo,
    generoBalizamento: p.generoBalizamento,
    historico: p.historico,
  };
}

export function serializarEstado(dados: DadosCompartilhados, max = MAX_HASH): string | null {
  const payload: PayloadV2 = {
    v: 2,
    atletas: dados.atletas.map(serializarAtleta),
    atletasApresentacao: dados.atletasApresentacao.map(serializarAtleta),
    series: dados.series.map(serializarSerie),
    periodo: dados.periodo,
    generoBalizamento: dados.generoBalizamento,
    historico: dados.historico,
  };
  const comprimido = compressToEncodedURIComponent(JSON.stringify(payload));
  return comprimido.length > max ? null : comprimido;
}

export function montarLink(base: string, dados: DadosCompartilhados): string | null {
  const comprimido = serializarEstado(dados);
  if (comprimido === null) return null;
  return `${base}${PREFIXO_HASH}${comprimido}`;
}

function camposComunsValidos(p: Record<string, unknown>): boolean {
  return (
    Array.isArray(p.atletas) &&
    Array.isArray(p.atletasApresentacao) &&
    Array.isArray(p.series) &&
    typeof p.periodo === 'string' &&
    typeof p.generoBalizamento === 'string' &&
    Array.isArray(p.historico)
  );
}

function payloadValido(dados: unknown): dados is PayloadCompartilhado | PayloadV2 {
  if (!dados || typeof dados !== 'object') return false;
  const p = dados as Record<string, unknown>;
  if (p.v === 1) return camposComunsValidos(p);
  if (p.v === 2) {
    if (!camposComunsValidos(p)) return false;
    return (p.series as unknown[]).every(
      (s) => s !== null && typeof s === 'object' && Array.isArray((s as { atletas?: unknown }).atletas),
    );
  }
  return false;
}

export function desserializarCompartilhado(hash: string): DadosCompartilhados | null {
  try {
    const bruto = hash.startsWith(PREFIXO_HASH) ? hash.slice(PREFIXO_HASH.length) : hash;
    if (!bruto) return null;
    const json = decompressFromEncodedURIComponent(bruto);
    if (!json) return null;
    const dados: unknown = JSON.parse(json);
    if (!payloadValido(dados)) return null;
    if ((dados as { v: number }).v === 2) return desserializarV2(dados as PayloadV2);
    return dados as PayloadCompartilhado;
  } catch {
    return null;
  }
}
