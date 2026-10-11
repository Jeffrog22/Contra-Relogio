import { describe, expect, it } from 'vitest';
import type { Atleta, Serie } from '../types';
import { balizar, melhorSplit, reatribuirRaias } from './balizamento';

let sequencia = 0;

function atleta(overrides: Partial<Atleta> = {}): Atleta {
  sequencia += 1;
  return {
    id: `a${sequencia}`,
    nome: `Atleta ${sequencia}`,
    idade: 11,
    categoriaOficial: 'Petiz',
    categoriaCalculada: 'Petiz',
    genero: 'feminino',
    periodo: 'manhã',
    professor: 'Prof',
    nivel: 'Nível 2 B',
    ...overrides,
  };
}

function montar(total: number, overrides: Partial<Atleta> = {}): Atleta[] {
  return Array.from({ length: total }, () => atleta(overrides));
}

function tamanhos(series: Serie[]): number[] {
  return series.map((s) => s.atletas.length);
}

function todasRaiasValidas(series: Serie[]): boolean {
  return series.every((s) =>
    s.atletas.every(({ raia }) => [1, 2, 3, 4].includes(raia)),
  );
}

describe('melhorSplit', () => {
  it('só devolve blocos de 3 ou 4', () => {
    for (let n = 0; n <= 30; n += 1) {
      const { blocos, sobra } = melhorSplit(n);
      const validos = blocos.every((b) => b === 3 || b === 4);
      const soma = blocos.reduce((s, b) => s + b, 0) + sobra;
      expect(validos).toBe(true);
      expect(soma).toBe(n);
      expect([0, 1, 2]).toContain(sobra);
    }
  });
});

describe('balizar — uma única série por grupo', () => {
  it('4 atletas → uma série de 4 com raias 1,2,3,4', () => {
    const series = balizar(montar(4), 'manhã');
    expect(tamanhos(series)).toEqual([4]);
    expect(series[0].atletas.map((a) => a.raia)).toEqual([1, 2, 3, 4]);
    expect(series[0].aviso).toBeUndefined();
  });

  it('3 atletas → uma série de 3 com raias 2,3,4 (nunca raia 1 nem 5)', () => {
    const series = balizar(montar(3), 'manhã');
    expect(tamanhos(series)).toEqual([3]);
    expect(series[0].atletas.map((a) => a.raia)).toEqual([2, 3, 4]);
    expect(series[0].aviso).toBeUndefined();
  });

  it('7 atletas → 4 + 3', () => {
    expect(tamanhos(balizar(montar(7), 'manhã'))).toEqual([4, 3]);
  });

  it('8 atletas → 4 + 4', () => {
    expect(tamanhos(balizar(montar(8), 'manhã'))).toEqual([4, 4]);
  });

  it('9 atletas → 3 + 3 + 3', () => {
    expect(tamanhos(balizar(montar(9), 'manhã'))).toEqual([3, 3, 3]);
  });
});

describe('balizar — sobras redistribuídas com grupos vizinhos', () => {
  it('6 atletas → 3 + 3 (nunca série de 2)', () => {
    expect(tamanhos(balizar(montar(6), 'manhã'))).toEqual([3, 3]);
  });

  it('10 atletas → 4 + 3 + 3', () => {
    expect(tamanhos(balizar(montar(10), 'manhã'))).toEqual([4, 3, 3]);
  });

  it('grupos 5 + 3 → 4 + 4 (sobra se funde ao grupo vizinho)', () => {
    const atletas = [
      ...montar(3, { nivel: 'Nível 1 A' }),
      ...montar(2, { nivel: 'Nível 1 A' }),
      ...montar(3, { nivel: 'Nível 2 B' }),
    ];
    const series = balizar(atletas, 'manhã');
    expect(tamanhos(series)).toEqual([4, 4]);
    expect(series.every((s) => !s.aviso?.includes('incompleta'))).toBe(true);
    expect(series.some((s) => s.aviso === 'redistribuída com grupo vizinho')).toBe(true);
  });

  it('grupos 2 + 2 → uma série de 4', () => {
    const atletas = [
      ...montar(2, { nivel: 'Nível 1 A' }),
      ...montar(2, { nivel: 'Nível 2 B' }),
    ];
    expect(tamanhos(balizar(atletas, 'manhã'))).toEqual([4]);
  });

  it('grupos 1 + 1 + 1 → uma série de 3', () => {
    const atletas = [
      ...montar(1, { nivel: 'Nível 1 A' }),
      ...montar(1, { nivel: 'Nível 2 B' }),
      ...montar(1, { nivel: 'Nível 3 C' }),
    ];
    expect(tamanhos(balizar(atletas, 'manhã'))).toEqual([3]);
  });
});

describe('balizar — casos impossíveis (1, 2 e 5 atletas isolados)', () => {
  it('1 atleta → série incompleta com aviso', () => {
    const series = balizar(montar(1), 'manhã');
    expect(tamanhos(series)).toEqual([1]);
    expect(series[0].aviso).toContain('incompleta');
  });

  it('2 atletas → série incompleta com aviso', () => {
    const series = balizar(montar(2), 'manhã');
    expect(tamanhos(series)).toEqual([2]);
    expect(series[0].aviso).toContain('incompleta');
  });

  it('5 atletas isolados → 4 + 1 incompleta com aviso', () => {
    const series = balizar(montar(5), 'manhã');
    expect(tamanhos(series)).toEqual([4, 1]);
    expect(series[1].aviso).toContain('incompleta');
  });
});

describe('balizar — ordem e filtros', () => {
  it('feminino sempre antes do masculino', () => {
    const atletas = [
      ...montar(3, { genero: 'masculino' }),
      ...montar(4, { genero: 'feminino' }),
    ];
    const series = balizar(atletas, 'geral');
    expect(series.map((s) => s.genero)).toEqual(['feminino', 'masculino']);
    expect(series.map((s) => s.numero)).toEqual([1, 2]);
  });

  it('filtra por período manhã/tarde e aceita geral', () => {
    const atletas = [
      ...montar(3, { periodo: 'manhã' }),
      ...montar(4, { periodo: 'tarde' }),
    ];
    expect(tamanhos(balizar(atletas, 'manhã'))).toEqual([3]);
    expect(tamanhos(balizar(atletas, 'tarde'))).toEqual([4]);
    expect(tamanhos(balizar(atletas, 'geral')).sort()).toEqual([3, 4]);
  });

  it('mantém categorias separadas quando não há sobra (ordem da tabela)', () => {
    const atletas = [
      ...montar(4, { categoriaOficial: 'Petiz' }),
      ...montar(3, { categoriaOficial: 'Mirim' }),
    ];
    const series = balizar(atletas, 'manhã');
    expect(tamanhos(series)).toEqual([3, 4]);
    expect(series.map((s) => s.categoria)).toEqual(['Mirim', 'Petiz']);
    expect(series.every((s) => s.aviso === undefined)).toBe(true);
  });

  it('nunca usa raia 5 e todas as séries têm 3/4 atletas ou aviso', () => {
    const atletas = [
      ...montar(9),
      ...montar(5, { nivel: 'Nível 1 A' }),
      ...montar(7, { genero: 'masculino' }),
      ...montar(2, { genero: 'masculino', nivel: 'Nível 1 A' }),
    ];
    const series = balizar(atletas, 'geral');
    expect(todasRaiasValidas(series)).toBe(true);
    for (const serie of series) {
      const ok = [3, 4].includes(serie.atletas.length) || serie.aviso?.includes('incompleta');
      expect(ok).toBe(true);
    }
  });
});

describe('balizar — filtro por gênero', () => {
  it("gênero 'todos' (padrão) mantém feminino e masculino", () => {
    const atletas = [
      ...montar(3, { genero: 'feminino' }),
      ...montar(4, { genero: 'masculino' }),
    ];
    const series = balizar(atletas, 'geral', 'todos');
    expect(series.map((s) => s.genero)).toEqual(['feminino', 'masculino']);
  });

  it("gênero 'feminino' descarta masculinos e renumera séries", () => {
    const atletas = [
      ...montar(3, { genero: 'feminino' }),
      ...montar(4, { genero: 'masculino' }),
    ];
    const series = balizar(atletas, 'geral', 'feminino');
    expect(tamanhos(series)).toEqual([3]);
    expect(series.every((s) => s.genero === 'feminino')).toBe(true);
    expect(series.map((s) => s.numero)).toEqual([1]);
  });

  it("gênero 'masculino' + período em cascata", () => {
    const atletas = [
      ...montar(4, { genero: 'masculino', periodo: 'manhã' }),
      ...montar(3, { genero: 'masculino', periodo: 'tarde' }),
      ...montar(4, { genero: 'feminino', periodo: 'manhã' }),
    ];
    const series = balizar(atletas, 'manhã', 'masculino');
    expect(tamanhos(series)).toEqual([4]);
    expect(series[0].genero).toBe('masculino');
    expect(series[0].atletas.every((i) => i.atleta.periodo === 'manhã')).toBe(true);
  });
});

describe('reatribuirRaias', () => {
  it('série de 4 vira raias 1,2,3,4', () => {
    const serie = balizar(montar(4), 'manhã')[0];
    const corrigida = reatribuirRaias({
      ...serie,
      atletas: [...serie.atletas].reverse().map((item) => ({ ...item, raia: 1 as const })),
    });
    expect(corrigida.atletas.map((i) => i.raia)).toEqual([1, 2, 3, 4]);
  });

  it('série de 3 vira raias 2,3,4', () => {
    const serie = balizar(montar(3), 'manhã')[0];
    const corrigida = reatribuirRaias(serie);
    expect(corrigida.atletas.map((i) => i.raia)).toEqual([2, 3, 4]);
  });

  it('série incompleta de 2 usa 1,2', () => {
    const serie = balizar(montar(2), 'manhã')[0];
    const corrigida = reatribuirRaias(serie);
    expect(corrigida.atletas.map((i) => i.raia)).toEqual([1, 2]);
  });
});
