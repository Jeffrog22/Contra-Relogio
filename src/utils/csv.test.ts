import { describe, expect, it } from 'vitest';
import { parseCSVAtletas, parseCSVHistorico } from './csv';

const CABECALHO = 'nome,idade,categoria,genero,horario,professor,nivel,tempo';

describe('parseCSVAtletas', () => {
  it('lê o CSV de exemplo e calcula categoria e medalha', () => {
    const csv = [
      CABECALHO,
      'Julia Barros Camargo,13,Petiz,feminino,manhã,J,Nível 2 B,',
      'Alice Marino Ribeiro,11,Mirim,feminino,manhã,J,Nível 2 B,34.66',
    ].join('\n');

    const { atletas, erros } = parseCSVAtletas(csv);
    expect(erros).toEqual([]);
    expect(atletas).toHaveLength(2);

    expect(atletas[0].nome).toBe('Julia Barros Camargo');
    expect(atletas[0].categoriaCalculada).toBe('Infantil');
    expect(atletas[0].categoriaOficial).toBe('Petiz');
    expect(atletas[0].divergencia).toBe(true);
    expect(atletas[0].medalha).toBe('Sem Tempo');

    expect(atletas[1].categoriaCalculada).toBe('Petiz');
    expect(atletas[1].divergencia).toBe(true);
    expect(atletas[1].tempo).toBe(34.66);
    expect(atletas[1].medalha).toBe('BRONZE');
    expect(atletas[1].periodo).toBe('manhã');
  });

  it('aceita acentos, caixa alta e tempo com vírgula', () => {
    const csv = [
      CABECALHO,
      'Ana Silva,10,MIRIM,feminino,MANHÃ,Prof A,Nível 1 A,"23,50"',
    ].join('\n');

    const { atletas, erros } = parseCSVAtletas(csv);
    expect(erros).toEqual([]);
    expect(atletas[0].categoriaCalculada).toBe('Mirim');
    expect(atletas[0].periodo).toBe('manhã');
    expect(atletas[0].tempo).toBe(23.5);
    expect(atletas[0].medalha).toBe('PRATA');
  });

  it('reporta gênero, horário, idade e categoria inválidos', () => {
    const csv = [
      CABECALHO,
      'A,11,Petiz,outro,manhã,J,Nível 1 A,',
      'B,11,Petiz,feminino,noite,J,Nível 1 A,',
      'C,xyz,Petiz,feminino,manhã,J,Nível 1 A,',
      'D,11,Master,feminino,manhã,J,Nível 1 A,',
    ].join('\n');

    const { atletas, erros } = parseCSVAtletas(csv);
    expect(atletas).toHaveLength(0);
    expect(erros).toHaveLength(4);
    expect(erros[0]).toContain('gênero inválido');
    expect(erros[1]).toContain('horário inválido');
    expect(erros[2]).toContain('idade inválida');
    expect(erros[3]).toContain('categoria inválida');
  });

  it('ignora linhas vazias e cabeçalho repetido', () => {
    const csv = [
      CABECALHO,
      'Ana Silva,11,Petiz,feminino,manhã,J,Nível 1 A,',
      CABECALHO,
      '',
      '   ',
      'Bruno Luz,12,Petiz,masculino,tarde,K,Nível 1 A,20.10',
    ].join('\n');

    const { atletas, erros } = parseCSVAtletas(csv);
    expect(erros).toEqual([]);
    expect(atletas).toHaveLength(2);
    expect(atletas[1].nome).toBe('Bruno Luz');
  });

  it('falha quando falta coluna obrigatória', () => {
    const { atletas, erros } = parseCSVAtletas('nome,tempo\nAna,20');
    expect(atletas).toHaveLength(0);
    expect(erros.some((e) => e.includes('"idade"'))).toBe(true);
  });
});

describe('parseCSVHistorico', () => {
  it('lê o CSV histórico de exemplo', () => {
    const csv = [
      'ano,aluno,tempo,medalha,categoria,genero',
      '2024,Ana Cristina Goldberger,22.36,PRATA,Petiz,feminino',
      '2025,Ana Cristina Goldberger,,Sem Tempo,Infantil,feminino',
    ].join('\n');

    const { eventos, erros } = parseCSVHistorico(csv);
    expect(erros).toEqual([]);
    expect(eventos).toHaveLength(2);
    expect(eventos[0]).toEqual({
      ano: 2024,
      aluno: 'Ana Cristina Goldberger',
      tempo: 22.36,
      medalha: 'PRATA',
      categoria: 'Petiz',
      genero: 'feminino',
    });
    expect(eventos[1].tempo).toBeUndefined();
    expect(eventos[1].medalha).toBe('Sem Tempo');
  });

  it('reporta medalha e ano inválidos', () => {
    const csv = [
      'ano,aluno,tempo,medalha,categoria',
      'abc,Ana,20.1,OURO,Petiz',
      '2024,Ana,20.1,DIAMANTE,Petiz',
    ].join('\n');

    const { eventos, erros } = parseCSVHistorico(csv);
    expect(eventos).toHaveLength(0);
    expect(erros).toHaveLength(2);
    expect(erros[0]).toContain('ano inválido');
    expect(erros[1]).toContain('medalha inválida');
  });
});
