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
        idade: 11,
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
      },
    ],
    series: [
      {
        numero: 1,
        genero: 'feminino',
        categoria: 'Mirim',
        nivel: 'Iniciação A',
        atletas: [],
      },
    ],
    periodo: 'manhã',
    generoBalizamento: 'feminino',
    historico: [
      { ano: 2024, aluno: 'Ana Silva', tempo: 34.66, medalha: 'BRONZE', categoria: 'Mirim' },
    ],
  };
}

describe('compartilhar — roundtrip', () => {
  it('serializa e desserializa mantendo todos os dados', () => {
    const estado = estadoExemplo();
    const link = montarLink('https://exemplo.app/', estado);
    expect(link).not.toBeNull();
    expect(link!.startsWith('https://exemplo.app/#d=')).toBe(true);

    const recuperado = desserializarCompartilhado(new URL(link!).hash);
    expect(recuperado).not.toBeNull();
    expect(recuperado!.v).toBe(1);
    expect(recuperado!.atletas).toEqual(estado.atletas);
    expect(recuperado!.atletasApresentacao).toEqual(estado.atletasApresentacao);
    expect(recuperado!.series).toEqual(estado.series);
    expect(recuperado!.periodo).toBe('manhã');
    expect(recuperado!.generoBalizamento).toBe('feminino');
    expect(recuperado!.historico).toEqual(estado.historico);
  });

  it('gera payload só com caracteres seguros para URL', () => {
    const serializado = serializarEstado(estadoExemplo());
    expect(serializado).not.toBeNull();
    expect(serializado!).not.toMatch(/[#\s=&?]/);
    expect(serializado!.length).toBeLessThan(MAX_HASH);
  });

  it('aceita o hash com ou sem o prefixo #d=', () => {
    const serializado = serializarEstado(estadoExemplo())!;
    expect(desserializarCompartilhado(`${PREFIXO_HASH}${serializado}`)).not.toBeNull();
    expect(desserializarCompartilhado(serializado)).not.toBeNull();
  });
});

describe('compartilhar — validação', () => {
  it('retorna null para payload corrompido ou aleatório', () => {
    expect(desserializarCompartilhado('#d=nao-e-comprimido!!')).toBeNull();
    expect(desserializarCompartilhado('')).toBeNull();
    expect(desserializarCompartilhado('#d=')).toBeNull();
  });

  it('retorna null para JSON com shape errado', () => {
    const invalido = compressToEncodedURIComponent(JSON.stringify({ v: 2, atletas: [] }));
    expect(desserializarCompartilhado(`${PREFIXO_HASH}${invalido}`)).toBeNull();
  });

  it('recusa links acima do limite de tamanho', () => {
    expect(serializarEstado(estadoExemplo(), 10)).toBeNull();
    expect(montarLink('https://x.app/', estadoExemplo())).not.toBeNull();
  });
});
