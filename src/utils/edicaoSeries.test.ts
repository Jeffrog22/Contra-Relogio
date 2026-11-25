import { describe, expect, it } from 'vitest';
import type { Atleta, Serie } from '../types';
import { reatribuirRaias } from './balizamento';
import {
  chaveFiltro,
  inserirAusentes,
  moverAtleta,
  nomeChave,
  remapearPorNome,
  renumerarSeries,
  sanearSeries,
  separarChaveFiltro,
} from './edicaoSeries';

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

function raiasUnicas(s: Serie): boolean {
  return new Set(s.atletas.map((item) => item.raia)).size === s.atletas.length;
}

describe('chaveFiltro / separarChaveFiltro', () => {
  it('monta e separa a chave de período+gênero', () => {
    const chave = chaveFiltro('manhã', 'feminino');
    expect(chave).toBe('manhã|feminino');
    expect(separarChaveFiltro(chave)).toEqual({ periodo: 'manhã', genero: 'feminino' });
    expect(separarChaveFiltro(chaveFiltro('geral', 'todos'))).toEqual({
      periodo: 'geral',
      genero: 'todos',
    });
  });
});

describe('nomeChave', () => {
  it('normaliza caixa e espaços', () => {
    expect(nomeChave('  Maria Silva ')).toBe('maria silva');
  });
});

describe('moverAtleta', () => {
  it('reordena dentro da mesma série', () => {
    const a = atleta();
    const b = atleta();
    const c = atleta();
    const series = [serie(1, [a, b, c])];

    const resultado = moverAtleta(series, a.id, 1, 1, c.id);

    expect(resultado?.[0].atletas.map((item) => item.atleta.id)).toEqual([b.id, c.id, a.id]);
  });

  it('move entre séries inserindo na posição do alvo', () => {
    const a = atleta();
    const b = atleta();
    const c = atleta();
    const d = atleta();
    const series = [serie(1, [a, b]), serie(2, [c, d])];

    const resultado = moverAtleta(series, a.id, 1, 2, d.id);

    expect(resultado).not.toBeNull();
    expect(resultado?.[0].atletas.map((item) => item.atleta.id)).toEqual([b.id]);
    expect(resultado?.[1].atletas.map((item) => item.atleta.id)).toEqual([c.id, a.id, d.id]);
  });

  it('troca com o atleta alvo quando a série destino já tem 4', () => {
    const origem = [atleta(), atleta(), atleta()];
    const destino = [atleta(), atleta(), atleta(), atleta()];
    const series = [serie(1, origem), serie(2, destino)];

    const resultado = moverAtleta(series, origem[0].id, 1, 2, destino[2].id);

    expect(resultado).not.toBeNull();
    // tamanhos preservados (origem 3, destino 4)
    expect(resultado?.[0].atletas).toHaveLength(3);
    expect(resultado?.[1].atletas).toHaveLength(4);
    // origem[0] ocupa a posição de destino[2] e vice-versa
    expect(resultado?.[0].atletas[0].atleta.id).toBe(destino[2].id);
    expect(resultado?.[1].atletas[2].atleta.id).toBe(origem[0].id);
    // demais posições intactas (origem segue com 3)
    expect(resultado?.[0].atletas.slice(1).map((item) => item.atleta.id)).toEqual([
      origem[1].id,
      origem[2].id,
    ]);
    expect(resultado?.[1].atletas.map((item) => item.atleta.id)).toEqual([
      destino[0].id,
      destino[1].id,
      origem[0].id,
      destino[3].id,
    ]);
    expect(resultado?.every((s) => raiasUnicas(reatribuirRaias(s)))).toBe(true);
  });

  it('troca 4↔4 mantendo ambas as séries completas', () => {
    const origem = [atleta(), atleta(), atleta(), atleta()];
    const destino = [atleta(), atleta(), atleta(), atleta()];
    const series = [serie(1, origem), serie(2, destino)];

    const resultado = moverAtleta(series, origem[3].id, 1, 2, destino[1].id);

    expect(resultado?.[0].atletas).toHaveLength(4);
    expect(resultado?.[1].atletas).toHaveLength(4);
    expect(resultado?.[0].atletas[3].atleta.id).toBe(destino[1].id);
    expect(resultado?.[1].atletas[1].atleta.id).toBe(origem[3].id);
    expect(resultado?.[0].atletas.slice(0, 3).map((item) => item.atleta.id)).toEqual(
      origem.slice(0, 3).map((a) => a.id),
    );
    expect(resultado?.[1].atletas.map((item) => item.atleta.id)).toEqual([
      destino[0].id,
      origem[3].id,
      destino[2].id,
      destino[3].id,
    ]);
  });

  it('recusa destino cheio sem alvo definido (raias nunca duplicam)', () => {
    const origem = [atleta(), atleta()];
    const destino = [atleta(), atleta(), atleta(), atleta()];
    const series = [serie(1, origem), serie(2, destino)];

    expect(moverAtleta(series, origem[0].id, 1, 2)).toBeNull();

    // estado intacto após a tentativa
    expect(series[0].atletas).toHaveLength(2);
    expect(series[1].atletas).toHaveLength(4);
  });

  it('remove a série de origem quando fica vazia', () => {
    const a = atleta();
    const b = atleta();
    const c = atleta();
    const series = [serie(1, [a]), serie(2, [b, c])];

    const resultado = moverAtleta(series, a.id, 1, 2, b.id);

    expect(resultado).toHaveLength(1);
    expect(resultado?.[0].numero).toBe(2);
    expect(resultado?.[0].atletas.map((item) => item.atleta.id)).toEqual([a.id, b.id, c.id]);
  });

  it('retorna null para série/alvo inexistente ou atleta fora da série', () => {
    const a = atleta();
    const series = [serie(1, [a])];

    expect(moverAtleta(series, a.id, 1, 9)).toBeNull();
    expect(moverAtleta(series, 'nao-existe', 1, 1)).toBeNull();
  });

  it('qualquer resultado válido reatribui raias únicas (sem 1 duplicado)', () => {
    const origem = [atleta(), atleta(), atleta()];
    const destino = [atleta(), atleta()];
    const series = [serie(1, origem), serie(2, destino)];

    const resultado = moverAtleta(series, origem[0].id, 1, 2, destino[0].id);
    expect(resultado).not.toBeNull();

    const reatribuidas = (resultado ?? []).map((s) => reatribuirRaias(s));
    expect(reatribuidas.every(raiasUnicas)).toBe(true);
    expect(reatribuidas.every((s) => s.atletas.length <= 4)).toBe(true);
  });
});

describe('remapearPorNome', () => {
  it('atualiza dados e ids, mantém posição e remove quem sumiu', () => {
    const a = atleta({ nome: 'Ana' });
    const b = atleta({ nome: 'Bia' });
    const c = atleta({ nome: 'Caio' });
    const series = [serie(1, [a, b, c])];

    const novaAna = atleta({ id: 'novo-id-ana', nome: 'Ana', tempo: 12.5 });
    const novoCaio = atleta({ id: 'novo-id-caio', nome: 'Caio' });
    // Bia sumiu do novo CSV; entrou uma atleta nova (Duda) que não estava nas séries
    const resultado = remapearPorNome(series, [novaAna, novoCaio, atleta({ nome: 'Duda' })]);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].atletas.map((item) => item.atleta.nome)).toEqual(['Ana', 'Caio']);
    expect(resultado[0].atletas[0].atleta.id).toBe('novo-id-ana');
    expect(resultado[0].atletas[0].atleta.tempo).toBe(12.5);
  });

  it('descarta séries que ficam vazias', () => {
    const a = atleta({ nome: 'Ana' });
    const b = atleta({ nome: 'Bia' });
    const series = [serie(1, [a]), serie(2, [b])];

    const resultado = remapearPorNome(series, [atleta({ nome: 'Outro' })]);

    expect(resultado).toHaveLength(0);
  });
});

describe('inserirAusentes', () => {
  it('não duplica quem já está em série e não ressuscita exclusões', () => {
    const a = atleta({ nome: 'Ana' });
    const b = atleta({ nome: 'Bia' });
    const series = [serie(1, [a, b])];

    const resultado = inserirAusentes(series, [atleta({ nome: 'Ana' }), atleta({ nome: 'Bia' })]);

    expect(resultado[0].atletas).toHaveLength(2);
  });

  it('anexa na série da mesma categoria+nível+gênero quando há vaga', () => {
    const a = atleta({ nome: 'Ana' });
    const series = [serie(1, [a])];
    const novo = atleta({ nome: 'Duda', categoriaOficial: 'Petiz', nivel: 'Nível 2 B' });

    const resultado = inserirAusentes(series, [novo]);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].atletas.map((item) => item.atleta.nome)).toEqual(['Ana', 'Duda']);
    expect(resultado[0].atletas.map((item) => item.raia)).toEqual([1, 2]);
  });

  it('cai para a série do mesmo gênero quando não há vaga na categoria', () => {
    const petiz = [atleta({ nome: 'P1' }), atleta({ nome: 'P2' }), atleta({ nome: 'P3' }), atleta({ nome: 'P4' })];
    const mirim = [atleta({ nome: 'M1', categoriaOficial: 'Mirim' })];
    const series = [serie(1, petiz), serie(2, mirim)];
    const novo = atleta({ nome: 'P5', categoriaOficial: 'Petiz' });

    const resultado = inserirAusentes(series, [novo]);

    expect(resultado).toHaveLength(2);
    expect(resultado[1].atletas.map((item) => item.atleta.nome)).toEqual(['M1', 'P5']);
  });

  it('cria série nova (número = maior + 1) quando todas do gênero estão cheias', () => {
    const cheia = [atleta({ nome: 'C1' }), atleta({ nome: 'C2' }), atleta({ nome: 'C3' }), atleta({ nome: 'C4' })];
    const series = [serie(3, cheia)];
    const novo = atleta({ nome: 'Novo' });

    const resultado = inserirAusentes(series, [novo]);

    expect(resultado).toHaveLength(2);
    expect(resultado[1].numero).toBe(4);
    expect(resultado[1].atletas.map((item) => item.atleta.nome)).toEqual(['Novo']);
  });

  it('mantém raias únicas e regras 3→[2,3,4] / 4→[1,2,3,4]', () => {
    const tres = [atleta({ nome: 'T1' }), atleta({ nome: 'T2' }), atleta({ nome: 'T3' })];
    const quatro = [atleta({ nome: 'Q1' }), atleta({ nome: 'Q2' }), atleta({ nome: 'Q3' }), atleta({ nome: 'Q4' })];
    const series = [serie(1, tres), serie(2, quatro)];

    const resultado = inserirAusentes(series, [atleta({ nome: 'T4', categoriaOficial: 'Petiz', nivel: 'Nível 2 B', genero: 'feminino' })]);

    expect(resultado[0].atletas).toHaveLength(4);
    expect(resultado[0].atletas.map((item) => item.raia)).toEqual([1, 2, 3, 4]);
    expect(resultado[1].atletas.map((item) => item.raia)).toEqual([1, 2, 3, 4]);
    expect(resultado.every(raiasUnicas)).toBe(true);
  });
});

describe('renumerarSeries', () => {
  it('retorna o mesmo array quando a numeração já está contígua', () => {
    const series = [serie(1, [atleta()]), serie(2, [atleta()])];

    expect(renumerarSeries(series)).toBe(series);
  });

  it('fecha lacunas preservando ordem, atletas e raias', () => {
    const a = atleta();
    const b = atleta();
    const c = atleta();
    const series = [serie(1, [a]), serie(3, [b, c])];

    const resultado = renumerarSeries(series);

    expect(resultado.map((s) => s.numero)).toEqual([1, 2]);
    expect(resultado[1].atletas.map((item) => item.atleta.id)).toEqual([b.id, c.id]);
    expect(resultado[1].atletas.map((item) => item.raia)).toEqual([1, 2]);
  });

  it('lista vazia devolve a mesma referência', () => {
    expect(renumerarSeries([])).toEqual([]);
  });
});

describe('sanearSeries', () => {
  it('corta série de 5 com baliza duplicada (dado legado) para 4 únicas', () => {
    const cinco = [atleta(), atleta(), atleta(), atleta(), atleta()];
    const base = serie(1, cinco.slice(0, 4));
    const corrompida: Serie = {
      ...base,
      atletas: [...base.atletas, { atleta: cinco[4], raia: 1 }],
    };

    const resultado = sanearSeries([corrompida, serie(3, [atleta()])]);

    expect(resultado).toHaveLength(2);
    expect(resultado[0].atletas).toHaveLength(4);
    expect(raiasUnicas(resultado[0])).toBe(true);
    expect(resultado.map((s) => s.numero)).toEqual([1, 2]);
  });

  it('série válida mantém os 4 atletas e as raias originais', () => {
    const quatro = [atleta(), atleta(), atleta(), atleta()];
    const series = [serie(1, quatro)];

    const resultado = sanearSeries(series);

    expect(resultado[0].atletas.map((item) => item.atleta.id)).toEqual(
      quatro.map((a) => a.id),
    );
    expect(resultado[0].atletas.map((item) => item.raia)).toEqual([1, 2, 3, 4]);
  });

  it('dado limpo retorna a mesma referência (no-op)', () => {
    const series = [serie(1, [atleta(), atleta()]), serie(2, [atleta()])];

    expect(sanearSeries(series)).toBe(series);
  });
});
