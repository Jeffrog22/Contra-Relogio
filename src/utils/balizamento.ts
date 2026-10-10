import type { Atleta, Categoria, Genero, PeriodoOpcao, Serie } from '../types';
import { CATEGORIAS } from './categorias';

interface Grupo {
  chave: string;
  categoria: Categoria;
  nivel: string;
  atletas: Atleta[];
}

interface Bloco {
  atletas: Atleta[];
  chaves: string[];
  incompleta?: boolean;
}

/**
 * Divide um total em blocos válidos (apenas 3 ou 4).
 * Retorna também a sobra (0, 1 ou 2) que precisa de redistribuição
 * com grupos vizinhos — só acontece quando o total é 1, 2 ou 5.
 */
export function melhorSplit(n: number): { blocos: number[]; sobra: number } {
  if (n <= 0) return { blocos: [], sobra: 0 };
  const r = n % 4;

  if (r === 0) return { blocos: Array(n / 4).fill(4), sobra: 0 };
  if (r === 3) return { blocos: Array((n - 3) / 4).fill(4).concat(3), sobra: 0 };

  if (r === 2) {
    if (n === 2) return { blocos: [], sobra: 2 };
    const quatro = (n - 6) / 4;
    return { blocos: [...Array(quatro).fill(4), 3, 3], sobra: 0 };
  }

  if (n === 1) return { blocos: [], sobra: 1 };
  if (n === 5) return { blocos: [4], sobra: 1 };
  const quatro = (n - 9) / 4;
  return { blocos: [...Array(quatro).fill(4), 3, 3, 3], sobra: 0 };
}

function agrupar(atletas: Atleta[]): Grupo[] {
  const mapa = new Map<string, Grupo>();
  for (const atleta of atletas) {
    const chave = `${atleta.categoriaOficial}|${atleta.nivel}`;
    const grupo = mapa.get(chave);
    if (grupo) {
      grupo.atletas.push(atleta);
    } else {
      mapa.set(chave, {
        chave,
        categoria: atleta.categoriaOficial,
        nivel: atleta.nivel,
        atletas: [atleta],
      });
    }
  }

  return [...mapa.values()].sort((a, b) => {
    const ordemCat = CATEGORIAS.indexOf(a.categoria) - CATEGORIAS.indexOf(b.categoria);
    if (ordemCat !== 0) return ordemCat;
    return a.nivel.localeCompare(b.nivel, 'pt-BR');
  });
}

function fatiar(ordem: Atleta[], chaves: string[], tamanhos: number[]): Bloco[] {
  const blocos: Bloco[] = [];
  let inicio = 0;
  for (const tamanho of tamanhos) {
    const atletas = ordem.slice(inicio, inicio + tamanho);
    const chavesBloco = [...new Set(chaves.slice(inicio, inicio + tamanho))];
    blocos.push({
      atletas,
      chaves: chavesBloco,
      incompleta: tamanho !== 3 && tamanho !== 4,
    });
    inicio += tamanho;
  }
  return blocos;
}

function montarBlocos(grupos: Grupo[]): Bloco[] {
  const ordem: Atleta[] = [];
  const chaves: string[] = [];
  const blocos: Bloco[] = [];
  const sobras: { atleta: Atleta; chave: string }[] = [];

  for (const grupo of grupos) {
    const { blocos: tamanhos } = melhorSplit(grupo.atletas.length);
    const usados = tamanhos.reduce((soma, t) => soma + t, 0);

    let inicio = 0;
    for (const tamanho of tamanhos) {
      const fatia = grupo.atletas.slice(inicio, inicio + tamanho);
      blocos.push({ atletas: fatia, chaves: [grupo.chave] });
      inicio += tamanho;
    }
    for (const atleta of grupo.atletas.slice(usados)) {
      sobras.push({ atleta, chave: grupo.chave });
    }

    ordem.push(...grupo.atletas);
    chaves.push(...grupo.atletas.map(() => grupo.chave));
  }

  if (sobras.length === 0) return blocos;

  // Redistribui as sobras com os grupos vizinhos do mesmo gênero
  const total = ordem.length;
  const plano = melhorSplit(total);
  if (plano.sobra === 0) {
    return fatiar(ordem, chaves, plano.blocos);
  }

  // Total impossível de repartir em 3/4 (1, 2 ou 5 atletas no gênero inteiro):
  // mantém as séries válidas e emite as sobras como série incompleta com aviso.
  const sobrasPorChave = new Map<string, Atleta[]>();
  for (const { atleta, chave } of sobras) {
    const lista = sobrasPorChave.get(chave);
    if (lista) lista.push(atleta);
    else sobrasPorChave.set(chave, [atleta]);
  }
  for (const [chave, lista] of sobrasPorChave) {
    blocos.push({ atletas: lista, chaves: [chave], incompleta: true });
  }
  return blocos;
}

function raiasDaSerie(tamanho: number, incompleta: boolean): (1 | 2 | 3 | 4)[] {
  const todas: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
  if (tamanho === 4) return todas;
  if (tamanho === 3) return [2, 3, 4];
  if (incompleta) return todas.slice(0, Math.min(tamanho, 4));
  return todas.slice(0, tamanho);
}

export function balizar(atletas: Atleta[], periodo: PeriodoOpcao): Serie[] {
  const filtrados =
    periodo === 'geral' ? atletas : atletas.filter((a) => a.periodo === periodo);

  const resultado: Serie[] = [];
  let numero = 1;

  for (const genero of ['feminino', 'masculino'] as Genero[]) {
    const doGenero = filtrados.filter((a) => a.genero === genero);
    if (doGenero.length === 0) continue;

    const grupos = agrupar(doGenero);
    const blocos = montarBlocos(grupos);

    for (const bloco of blocos) {
      const raias = raiasDaSerie(bloco.atletas.length, bloco.incompleta === true);
      const misto = bloco.chaves.length > 1;
      let aviso: string | undefined;
      if (bloco.incompleta) {
        aviso = `série incompleta (${bloco.atletas.length} atleta${
          bloco.atletas.length > 1 ? 's' : ''
        })`;
      } else if (misto) {
        aviso = 'redistribuída com grupo vizinho';
      }

      resultado.push({
        numero: numero++,
        genero,
        categoria: bloco.atletas[0].categoriaOficial,
        nivel: bloco.atletas[0].nivel,
        atletas: bloco.atletas.map((atleta, i) => ({ atleta, raia: raias[i] })),
        aviso,
      });
    }
  }

  return resultado;
}
