import type { Atleta, AtletaSerie, GeneroOpcao, PeriodoOpcao, Serie } from '../types';
import { reatribuirRaias } from './balizamento';

export function chaveFiltro(periodo: PeriodoOpcao, genero: GeneroOpcao): string {
  return `${periodo}|${genero}`;
}

export function separarChaveFiltro(chave: string): {
  periodo: PeriodoOpcao;
  genero: GeneroOpcao;
} {
  const [periodo, genero] = chave.split('|');
  return { periodo: periodo as PeriodoOpcao, genero: genero as GeneroOpcao };
}

export function nomeChave(nome: string): string {
  return nome.trim().toLowerCase();
}

function moverItem<T>(lista: T[], de: number, para: number): T[] {
  const copia = [...lista];
  const [item] = copia.splice(de, 1);
  copia.splice(para, 0, item);
  return copia;
}

/**
 * Move um atleta entre séries (ou reordena dentro da mesma).
 * Retorna `null` quando a operação é inválida — inclusive quando a série de
 * destino já tem 4 atletas (evita raias duplicadas na reatribuição).
 * A reatribuição de raias é responsabilidade do chamador (`reordenarSeries`).
 */
export function moverAtleta(
  series: Serie[],
  atletaId: string,
  de: number,
  para: number,
  alvoId?: string,
): Serie[] | null {
  const origem = series.find((serie) => serie.numero === de);
  const destino = series.find((serie) => serie.numero === para);
  if (!origem || !destino) return null;

  const idxOrigem = origem.atletas.findIndex((item) => item.atleta.id === atletaId);
  if (idxOrigem < 0) return null;

  if (de === para) {
    const idxAlvo = alvoId
      ? origem.atletas.findIndex((item) => item.atleta.id === alvoId)
      : -1;
    if (idxAlvo < 0 || idxAlvo === idxOrigem) return null;
    return series.map((serie) =>
      serie.numero === de
        ? { ...serie, atletas: moverItem(origem.atletas, idxOrigem, idxAlvo) }
        : serie,
    );
  }

  if (destino.atletas.length >= 4) return null;

  const movido = origem.atletas[idxOrigem];
  const restantes = origem.atletas.filter((_, indice) => indice !== idxOrigem);
  const idxAlvo = alvoId
    ? destino.atletas.findIndex((item) => item.atleta.id === alvoId)
    : -1;
  const inseridos = [...destino.atletas];
  if (idxAlvo >= 0) inseridos.splice(idxAlvo, 0, movido);
  else inseridos.push(movido);

  return series
    .map((serie) => {
      if (serie.numero === de) return { ...serie, atletas: restantes };
      if (serie.numero === para) return { ...serie, atletas: inseridos };
      return serie;
    })
    .filter((serie) => serie.atletas.length > 0);
}

/**
 * Re-mapeia as séries para uma nova base de atletas casando por nome
 * (os ids mudam a cada parse de CSV). Atletas que sumiram são removidos
 * das séries; a posição dos mantidos e as exclusões manuais são preservadas.
 */
export function remapearPorNome(series: Serie[], atletas: Atleta[]): Serie[] {
  const mapa = new Map(atletas.map((atleta) => [nomeChave(atleta.nome), atleta]));
  return series
    .map((serie) => ({
      ...serie,
      atletas: serie.atletas
        .map((item): AtletaSerie | null => {
          const atualizado = mapa.get(nomeChave(item.atleta.nome));
          return atualizado ? { ...item, atleta: atualizado } : null;
        })
        .filter((item): item is AtletaSerie => item !== null),
    }))
    .filter((serie) => serie.atletas.length > 0);
}

/**
 * Insere nos `series` apenas os atletas de `novos` que ainda não estão em
 * nenhuma série (os ausentes de propósito — exclusões manuais — não voltam).
 * Regra: mesma categoria+nível+gênero com <4 → anexa; senão mesmo gênero
 * com <4 → anexa; senão cria série nova (número = maior + 1).
 * Ao final reatribui as raias de todas as séries (idempotente em séries
 * válidas de 1 a 4 atletas).
 */
export function inserirAusentes(series: Serie[], novos: Atleta[]): Serie[] {
  const resultado = series.map((serie) => ({ ...serie, atletas: [...serie.atletas] }));
  const presentes = new Set<string>();
  for (const serie of resultado) {
    for (const item of serie.atletas) presentes.add(nomeChave(item.atleta.nome));
  }

  let proximoNumero = resultado.reduce((max, serie) => Math.max(max, serie.numero), 0) + 1;

  for (const atleta of novos) {
    const chave = nomeChave(atleta.nome);
    if (presentes.has(chave)) continue;
    presentes.add(chave);

    const alvo =
      resultado.find(
        (serie) =>
          serie.categoria === atleta.categoriaOficial &&
          serie.nivel === atleta.nivel &&
          serie.genero === atleta.genero &&
          serie.atletas.length < 4,
      ) ?? resultado.find((serie) => serie.genero === atleta.genero && serie.atletas.length < 4);

    if (alvo) {
      alvo.atletas.push({ atleta, raia: 1 });
    } else {
      resultado.push({
        numero: proximoNumero++,
        genero: atleta.genero,
        categoria: atleta.categoriaOficial,
        nivel: atleta.nivel,
        atletas: [{ atleta, raia: 1 }],
      });
    }
  }

  return resultado.filter((serie) => serie.atletas.length > 0).map((serie) => reatribuirRaias(serie));
}

/**
 * Renumera as séries de 1 a n na ordem do array, fechando lacunas
 * deixadas por séries removidas (ex.: 1, 3 → 1, 2). Retorna o mesmo
 * array quando a numeração já está contígua (evita re-render à toa).
 */
export function renumerarSeries(series: Serie[]): Serie[] {
  if (series.every((serie, indice) => serie.numero === indice + 1)) return series;
  return series.map((serie, indice) => ({ ...serie, numero: indice + 1 }));
}

/**
 * Repara dados legados/corrompidos (criados antes do teto de 4 atletas):
 * séries com mais de 4 são cortadas para os 4 primeiros com raias
 * reatribuídas (o excedente permanece na base e volta ao balizamento
 * em "Atualizar") e a numeração é refeita de 1 a n.
 * Dados válidos retornam a mesma referência.
 */
export function sanearSeries(series: Serie[]): Serie[] {
  if (!series.some((serie) => serie.atletas.length > 4)) {
    return renumerarSeries(series);
  }
  const cortadas = series.map((serie) =>
    serie.atletas.length > 4
      ? reatribuirRaias({ ...serie, atletas: serie.atletas.slice(0, 4) })
      : serie,
  );
  return renumerarSeries(cortadas);
}
