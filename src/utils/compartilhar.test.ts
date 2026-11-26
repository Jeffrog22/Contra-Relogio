import { describe, expect, it } from 'vitest';
import { compressToEncodedURIComponent } from 'lz-string';
import {
  MAX_HASH,
  PREFIXO_HASH,
  desserializarCompartilhado,
  montarLink,
  serializarEstado,
} from './compartilhar';
import type { DadosCompartilhados } from './compartilhar';

function estadoExemplo(): DadosCompartilhados {
  return {
    atletas: [
      {
        id: 'a1',
        nome: 'Ana Silva',
        idade: 10,
        categoriaOficial: 'Mirim',
        categoriaCalculada: 'Mirim',
        genero: 'feminino',
        periodo: 'manhã',
        professor: 'Prof. Ana',
        nivel: 'Iniciação A',
        tipo: 'Crawl c/ prancha',
        tempo: 34.66,
        medalha: 'BRONZE',
      },
    ],
    atletasApresentacao: [
      {
        id: 'b1',
        nome: 'Bruno Luz',
        idade: 12,
        categoriaOficial: 'Petiz',
        categoriaCalculada: 'Petiz',
        genero: 'masculino',
        periodo: 'tarde',
        professor: 'Prof. Ana',
        nivel: 'Iniciação B',
        medalha: 'Sem Tempo',
      },
    ],
    series: [
      {
        numero: 1,
        genero: 'feminino',
        categoria: 'Mirim',
        nivel: 'Iniciação A',
        atletas: [
          {
            atleta: {
              id: 'a1',
              nome: 'Ana Silva',
              idade: 10,
              categoriaOficial: 'Mirim',
              categoriaCalculada: 'Mirim',
              genero: 'feminino',
              periodo: 'manhã',
              professor: 'Prof. Ana',
              nivel: 'Iniciação A',
              tipo: 'Crawl c/ prancha',
              tempo: 34.66,
              medalha: 'BRONZE',
            },
            raia: 2,
          },
        ],
      },
    ],
    periodo: 'manhã',
    generoBalizamento: 'feminino',
    historico: [
      { ano: 2024, aluno: 'Ana Silva', tempo: 34.66, medalha: 'BRONZE', categoria: 'Mirim' },
    ],
  };
}

/** Base grande p/ comparação de tamanho (UUIDs reais de 36 chars). */
function estadoGrande(): DadosCompartilhados {
  const atletas = Array.from({ length: 80 }, (_, i) => ({
    id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`,
    nome: `Atleta Numero ${i} Sobrenome Extenso`,
    idade: 10 + (i % 10),
    categoriaOficial: 'Mirim' as const,
    categoriaCalculada: 'Mirim' as const,
    genero: (i % 2 === 0 ? 'feminino' : 'masculino') as 'feminino' | 'masculino',
    periodo: 'manhã' as const,
    professor: 'Prof. Coordenador',
    nivel: 'Iniciação A',
    tempo: 30 + (i % 20),
    medalha: 'BRONZE' as const,
  }));
  const series = Array.from({ length: 20 }, (_, s) => ({
    numero: s + 1,
    genero: (s % 2 === 0 ? 'feminino' : 'masculino') as 'feminino' | 'masculino',
    categoria: 'Mirim' as const,
    nivel: 'Iniciação A',
    atletas: atletas.slice(s * 4, s * 4 + 4).map((a, raia) => ({ atleta: a, raia: (raia + 1) as 1 | 2 | 3 | 4 })),
  }));
  const historico = Array.from({ length: 99 }, (_, h) => ({
    ano: 2020 + (h % 6),
    aluno: `Atleta Numero ${h} Sobrenome Extenso`,
    tempo: 25 + (h % 30),
    medalha: 'OURO' as const,
    categoria: 'Mirim' as const,
  }));
  return {
    atletas,
    atletasApresentacao: atletas.slice(0, 25),
    series,
    periodo: 'manhã',
    generoBalizamento: 'todos',
    historico,
  };
}

describe('compartilhar — roundtrip', () => {
  it('serializa e desserializa mantendo todos os dados (deflate + ids curtos)', async () => {
    const estado = estadoExemplo();
    const link = await montarLink('https://exemplo.app/', estado);
    expect(link).not.toBeNull();
    expect(link!.startsWith('https://exemplo.app/#d=')).toBe(true);

    const recuperado = await desserializarCompartilhado(new URL(link!).hash);
    expect(recuperado).not.toBeNull();
    // ids viram curtos ("0", "1") — comparar pelo conteúdo, não pelo id original
    expect(recuperado!.atletas.map(({ id: _id, ...a }) => a)).toEqual(
      estado.atletas.map(({ id: _id, ...a }) => a),
    );
    expect(recuperado!.atletasApresentacao.map(({ id: _id, ...a }) => a)).toEqual(
      estado.atletasApresentacao.map(({ id: _id, ...a }) => a),
    );
    expect(recuperado!.periodo).toBe('manhã');
    expect(recuperado!.generoBalizamento).toBe('feminino');
    expect(recuperado!.historico).toEqual(estado.historico);
    // série reconstruída aponta para o atleta importado (mesmo id curto)
    expect(recuperado!.series).toHaveLength(1);
    expect(recuperado!.series[0].atletas).toHaveLength(1);
    expect(recuperado!.series[0].atletas[0].raia).toBe(2);
    expect(recuperado!.series[0].atletas[0].atleta.id).toBe(recuperado!.atletas[0].id);
    expect(recuperado!.series[0].atletas[0].atleta.nome).toBe('Ana Silva');
  });

  it('gera payload só com caracteres seguros para URL', async () => {
    const serializado = await serializarEstado(estadoExemplo());
    expect(serializado).not.toBeNull();
    expect(serializado!).not.toMatch(/[#\s=&?]/);
    expect(serializado!.length).toBeLessThan(MAX_HASH);
  });

  it('aceita o hash com ou sem o prefixo #d=', async () => {
    const serializado = (await serializarEstado(estadoExemplo()))!;
    expect(await desserializarCompartilhado(`${PREFIXO_HASH}${serializado}`)).not.toBeNull();
    expect(await desserializarCompartilhado(serializado)).not.toBeNull();
  });

  it('recalcula medalha e categoriaCalculada na importação', async () => {
    const serializado = (await serializarEstado(estadoExemplo()))!;
    const recuperado = await desserializarCompartilhado(serializado)!;
    expect(recuperado!.atletas[0].medalha).toBe('BRONZE');
    expect(recuperado!.atletas[0].categoriaCalculada).toBe('Mirim');
  });

  it('usa ids curtos no payload (sem UUIDs)', async () => {
    const estado = estadoExemplo();
    const serializado = (await serializarEstado(estado))!;
    // payload comprimido não expõe o UUID original
    const recuperado = await desserializarCompartilhado(serializado)!;
    expect(recuperado!.atletas[0].id).toBe('0');
    expect(recuperado!.atletasApresentacao[0].id).toBe('1');
    expect(recuperado!.atletas[0].id.length).toBeLessThan(estado.atletas[0].id.length);
  });

  it('payload deflate+ids curtos é menor que o lz-string antigo', async () => {
    const estado = estadoGrande();
    const novo = (await serializarEstado(estado))!;
    // simula o formato anterior: lz-string com ids originais embutidos
    const antigo = compressToEncodedURIComponent(
      JSON.stringify({
        v: 2,
        atletas: estado.atletas.map(({ medalha: _m, categoriaCalculada: _c, ...r }) => r),
        atletasApresentacao: estado.atletasApresentacao.map(
          ({ medalha: _m, categoriaCalculada: _c, ...r }) => r,
        ),
        series: estado.series.map((s) => ({
          ...s,
          atletas: s.atletas.map((a) => ({ atletaId: a.atleta.id, raia: a.raia })),
        })),
        periodo: estado.periodo,
        generoBalizamento: estado.generoBalizamento,
        historico: estado.historico,
      }),
    );
    expect(novo.length).toBeLessThan(antigo.length);
    expect(novo.length).toBeLessThan(antigo.length * 0.6);
  });

  it('aceita payload v1 antigo (lz-string, séries embutidas)', async () => {
    const estado = estadoExemplo();
    const v1 = compressToEncodedURIComponent(JSON.stringify({ v: 1, ...estado }));
    const recuperado = await desserializarCompartilhado(`${PREFIXO_HASH}${v1}`);
    expect(recuperado).not.toBeNull();
    expect(recuperado!.atletas).toEqual(estado.atletas);
    expect(recuperado!.series).toEqual(estado.series);
  });

  it('aceita payload v2 antigo (lz-string, séries por id com UUID)', async () => {
    const estado = estadoExemplo();
    const v2 = compressToEncodedURIComponent(
      JSON.stringify({
        v: 2,
        atletas: estado.atletas.map(({ medalha: _m, categoriaCalculada: _c, ...r }) => r),
        atletasApresentacao: estado.atletasApresentacao.map(
          ({ medalha: _m, categoriaCalculada: _c, ...r }) => r,
        ),
        series: estado.series.map((s) => ({
          ...s,
          atletas: s.atletas.map((a) => ({ atletaId: a.atleta.id, raia: a.raia })),
        })),
        periodo: estado.periodo,
        generoBalizamento: estado.generoBalizamento,
        historico: estado.historico,
      }),
    );
    const recuperado = await desserializarCompartilhado(`${PREFIXO_HASH}${v2}`);
    expect(recuperado).not.toBeNull();
    expect(recuperado!.atletas[0].nome).toBe('Ana Silva');
    expect(recuperado!.series[0].atletas[0].atleta.id).toBe('a1');
  });

  it('descarta referências de série com id inexistente sem quebrar', async () => {
    const estado = estadoExemplo();
    estado.series[0].atletas.push({
      atleta: { ...estado.atletas[0], id: 'fantasma' },
      raia: 3,
    });
    const recuperado = (await desserializarCompartilhado((await serializarEstado(estado))!))!;
    expect(recuperado.series[0].atletas).toHaveLength(1);
    expect(recuperado.series[0].atletas[0].atleta.nome).toBe('Ana Silva');
  });
});

describe('compartilhar — validação', () => {
  it('retorna null para payload corrompido ou aleatório', async () => {
    expect(await desserializarCompartilhado('#d=nao-e-comprimido!!')).toBeNull();
    expect(await desserializarCompartilhado('')).toBeNull();
    expect(await desserializarCompartilhado('#d=')).toBeNull();
  });

  it('retorna null para JSON com shape errado', async () => {
    const invalido = compressToEncodedURIComponent(JSON.stringify({ v: 2, atletas: [] }));
    expect(await desserializarCompartilhado(`${PREFIXO_HASH}${invalido}`)).toBeNull();
  });

  it('retorna null para versão desconhecida', async () => {
    const invalido = compressToEncodedURIComponent(
      JSON.stringify({
        v: 99,
        atletas: [],
        atletasApresentacao: [],
        series: [],
        periodo: 'manhã',
        generoBalizamento: 'todos',
        historico: [],
      }),
    );
    expect(await desserializarCompartilhado(`${PREFIXO_HASH}${invalido}`)).toBeNull();
  });

  it('recusa links acima do limite de tamanho', async () => {
    expect(await serializarEstado(estadoExemplo(), 10)).toBeNull();
    expect(await montarLink('https://x.app/', estadoExemplo())).not.toBeNull();
  });
});
