// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Atleta, Serie } from '../types';
import { useAppStore } from './useAppStore';

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

function serie(numero: number, atletas: Atleta[]): Serie {
  const primeiro = atletas[0];
  return {
    numero,
    genero: primeiro?.genero ?? 'feminino',
    categoria: primeiro?.categoriaOficial ?? 'Petiz',
    nivel: primeiro?.nivel ?? 'Nível 2 B',
    atletas: atletas.map((atleta, indice) => ({
      atleta,
      raia: (indice + 1) as 1 | 2 | 3 | 4,
    })),
  };
}

function nomes(serieAtual: Serie): string[] {
  return serieAtual.atletas.map((item) => item.atleta.nome);
}

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({
    atletas: [],
    atletasApresentacao: [],
    series: [],
    seriesPorFiltro: {},
    edicoesManuais: false,
    periodo: 'geral',
    generoBalizamento: 'todos',
    historico: [],
    toast: null,
  });
});

afterEach(() => {
  useAppStore.getState().esconderToast();
});

describe('snapshot das séries por filtro', () => {
  it('preserva as séries editadas ao trocar o período e voltar', () => {
    const atletas = [
      atleta(),
      atleta(),
      atleta(),
      atleta(),
    ];
    useAppStore.setState({ atletas, series: [serie(1, atletas)], periodo: 'manhã' });

    useAppStore.getState().removerAtletaDaSerie(1, atletas[0].id);
    expect(useAppStore.getState().series[0].atletas).toHaveLength(3);
    expect(useAppStore.getState().edicoesManuais).toBe(true);

    useAppStore.getState().setPeriodo('geral');
    expect(useAppStore.getState().periodo).toBe('geral');
    expect(useAppStore.getState().series[0].atletas).toHaveLength(4);

    useAppStore.getState().setPeriodo('manhã');
    expect(useAppStore.getState().series[0].atletas).toHaveLength(3);
    expect(nomes(useAppStore.getState().series[0])).not.toContain(atletas[0].nome);
  });

  it('clique no filtro já ativo é no-op (não regenera nem descarta edição)', () => {
    const atletas = [atleta(), atleta(), atleta()];
    useAppStore.setState({ atletas, series: [serie(1, atletas)], periodo: 'manhã' });
    useAppStore.getState().removerAtletaDaSerie(1, atletas[0].id);
    const antes = useAppStore.getState().series;

    useAppStore.getState().setPeriodo('manhã');

    expect(useAppStore.getState().series).toBe(antes);
    expect(useAppStore.getState().series[0].atletas).toHaveLength(2);
  });

  it('filtro de gênero tem snapshot independente do período', () => {
    const fem = [atleta({ genero: 'feminino' }), atleta({ genero: 'feminino' })];
    const masc = [atleta({ genero: 'masculino' }), atleta({ genero: 'masculino' })];
    const todos = [...fem, ...masc];
    useAppStore.setState({ atletas: todos, series: [serie(1, todos)] });

    useAppStore.getState().removerAtletaDaSerie(1, todos[0].id);

    useAppStore.getState().setGeneroBalizamento('feminino');
    expect(useAppStore.getState().series[0].atletas).toHaveLength(2);

    useAppStore.getState().setGeneroBalizamento('todos');
    expect(useAppStore.getState().series[0].atletas).toHaveLength(3);
  });
});

describe('upload de novo CSV', () => {
  it('com edições manuais, preserva as séries casando por nome (ids novos)', () => {
    const antigos = [atleta(), atleta(), atleta(), atleta()];
    const nomesAntigos = antigos.map((atleta) => atleta.nome);
    useAppStore.setState({ atletas: antigos, series: [serie(1, antigos)], periodo: 'manhã' });

    useAppStore.getState().removerAtletaDaSerie(1, antigos[0].id);

    const novos = [
      ...antigos.map((original) => atleta({ ...original, id: `novo-${original.id}` })),
      atleta({ nome: 'Novata', periodo: 'manhã' }),
    ];
    useAppStore.getState().processarAtletas(novos);

    const estado = useAppStore.getState();
    expect(estado.edicoesManuais).toBe(true);
    expect(estado.series).toHaveLength(1);
    expect(nomes(estado.series[0])).toEqual([nomesAntigos[1], nomesAntigos[2], nomesAntigos[3], 'Novata']);
    expect(estado.series[0].atletas.slice(0, 3).every((item) => item.atleta.id.startsWith('novo-'))).toBe(true);
    // a exclusão manual não volta com o upload
    expect(nomes(estado.series[0])).not.toContain(nomesAntigos[0]);
  });

  it('sem edições manuais, zera as séries e os snapshots', () => {
    const antigos = [atleta(), atleta()];
    useAppStore.setState({
      atletas: antigos,
      series: [serie(1, antigos)],
      seriesPorFiltro: { 'manhã|todos': [serie(1, antigos)] },
      edicoesManuais: false,
    });

    useAppStore.getState().processarAtletas([atleta({ nome: 'Outra' })]);

    const estado = useAppStore.getState();
    expect(estado.series).toEqual([]);
    expect(estado.seriesPorFiltro).toEqual({});
    expect(estado.edicoesManuais).toBe(false);
  });

  it('atualiza os snapshots por filtro junto com a série ao vivo', () => {
    const antigos = [atleta(), atleta()];
    useAppStore.setState({
      atletas: antigos,
      series: [serie(1, antigos)],
      seriesPorFiltro: { 'geral|feminino': [serie(1, antigos)] },
      edicoesManuais: true,
      periodo: 'manhã',
    });

    const novos = antigos.map((original) => atleta({ ...original, id: `novo-${original.id}` }));
    useAppStore.getState().processarAtletas(novos);

    const snapshots = useAppStore.getState().seriesPorFiltro;
    expect(snapshots['geral|feminino']).toHaveLength(1);
    expect(snapshots['geral|feminino'][0].atletas.every((item) => item.atleta.id.startsWith('novo-'))).toBe(true);
  });
});

describe('edições manuais', () => {
  it('removerAtletaDaSerie descarta séries que ficam vazias', () => {
    const a1 = atleta();
    const a2 = atleta();
    useAppStore.setState({
      atletas: [a1, a2],
      series: [serie(1, [a1]), serie(2, [a2])],
    });

    useAppStore.getState().removerAtletaDaSerie(1, a1.id);

    const estado = useAppStore.getState();
    expect(estado.series).toHaveLength(1);
    expect(estado.series[0].numero).toBe(2);
    expect(estado.edicoesManuais).toBe(true);
  });

  it('atualizarAtleta sincroniza as cópias nos snapshots por filtro', () => {
    const a1 = atleta();
    useAppStore.setState({
      atletas: [a1],
      series: [],
      seriesPorFiltro: { 'manhã|todos': [serie(1, [a1])] },
    });

    useAppStore.getState().atualizarAtleta(a1.id, { nome: 'Nome Alterado' });

    const snapshot = useAppStore.getState().seriesPorFiltro['manhã|todos'];
    expect(snapshot[0].atletas[0].atleta.nome).toBe('Nome Alterado');
  });

  it('limparAtletas zera séries, snapshots e a flag de edições', () => {
    const a1 = atleta();
    useAppStore.setState({
      atletas: [a1],
      series: [serie(1, [a1])],
      seriesPorFiltro: { 'geral|todos': [serie(1, [a1])] },
      edicoesManuais: true,
    });

    useAppStore.getState().limparAtletas();

    const estado = useAppStore.getState();
    expect(estado.series).toEqual([]);
    expect(estado.seriesPorFiltro).toEqual({});
    expect(estado.edicoesManuais).toBe(false);
  });
});
