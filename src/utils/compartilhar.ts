import { decompressFromEncodedURIComponent } from 'lz-string';
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

/* ---------- base64url ---------- */

function bytesParaBase64Url(bytes: Uint8Array): string {
  let bin = '';
  const parte = 0x8000;
  for (let i = 0; i < bytes.length; i += parte) {
    bin += String.fromCharCode(...bytes.subarray(i, i + parte));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlParaBytes(texto: string): Uint8Array {
  const b64 = texto.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/* ---------- compressão (deflate-raw) ---------- */

async function comprimir(texto: string): Promise<string> {
  const stream = new Blob([texto]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const buffer = await new Response(stream).arrayBuffer();
  return bytesParaBase64Url(new Uint8Array(buffer));
}

async function tentarDeflate(bruto: string): Promise<string | null> {
  try {
    const bytes = base64UrlParaBytes(bruto);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const texto = await new Response(stream).text();
    return texto || null;
  } catch {
    return null;
  }
}

/* ---------- ids curtos ---------- */

/**
 * Mapeia ids originais (UUIDs, 36 chars incompressíveis) para ids curtos
 * ("0", "1", …) só dentro do payload — economiza ~4,5 KB em bases grandes.
 */
function mapearIds(dados: DadosCompartilhados): Map<string, string> {
  const mapa = new Map<string, string>();
  let contador = 0;
  for (const a of [...dados.atletas, ...dados.atletasApresentacao]) {
    if (!mapa.has(a.id)) mapa.set(a.id, String(contador++));
  }
  return mapa;
}

/* ---------- serialização ---------- */

function serializarAtleta(atleta: Atleta, mapa: Map<string, string>): AtletaSerializado {
  const { medalha: _medalha, categoriaCalculada: _calculada, id: _id, ...resto } = atleta;
  return { ...resto, id: mapa.get(atleta.id) ?? String(mapa.size) };
}

function serializarSerie(serie: Serie, mapa: Map<string, string>): SerieSerializada {
  return {
    numero: serie.numero,
    genero: serie.genero,
    categoria: serie.categoria,
    nivel: serie.nivel,
    ...(serie.aviso !== undefined && { aviso: serie.aviso }),
    atletas: serie.atletas
      .filter((a) => mapa.has(a.atleta.id))
      .map((a) => ({ atletaId: mapa.get(a.atleta.id)!, raia: a.raia })),
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

export async function serializarEstado(
  dados: DadosCompartilhados,
  max = MAX_HASH,
): Promise<string | null> {
  const mapa = mapearIds(dados);
  const payload: PayloadV2 = {
    v: 2,
    atletas: dados.atletas.map((a) => serializarAtleta(a, mapa)),
    atletasApresentacao: dados.atletasApresentacao.map((a) => serializarAtleta(a, mapa)),
    series: dados.series.map((s) => serializarSerie(s, mapa)),
    periodo: dados.periodo,
    generoBalizamento: dados.generoBalizamento,
    historico: dados.historico,
  };
  const comprimido = await comprimir(JSON.stringify(payload));
  return comprimido.length > max ? null : comprimido;
}

export async function montarLink(
  base: string,
  dados: DadosCompartilhados,
): Promise<string | null> {
  const comprimido = await serializarEstado(dados);
  if (comprimido === null) return null;
  return `${base}${PREFIXO_HASH}${comprimido}`;
}

/* ---------- validação ---------- */

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

function interpretarJson(json: string | null): DadosCompartilhados | null {
  if (!json) return null;
  try {
    const dados: unknown = JSON.parse(json);
    if (!payloadValido(dados)) return null;
    if ((dados as { v: number }).v === 2) return desserializarV2(dados as PayloadV2);
    return dados as PayloadCompartilhado;
  } catch {
    return null;
  }
}

export async function desserializarCompartilhado(
  hash: string,
): Promise<DadosCompartilhados | null> {
  try {
    const bruto = hash.startsWith(PREFIXO_HASH) ? hash.slice(PREFIXO_HASH.length) : hash;
    if (!bruto) return null;

    // Formato novo: deflate-raw + base64url
    const viaDeflate = interpretarJson(await tentarDeflate(bruto));
    if (viaDeflate) return viaDeflate;

    // Legado: lz-string (links v1/v2 antigos)
    return interpretarJson(decompressFromEncodedURIComponent(bruto));
  } catch {
    return null;
  }
}
