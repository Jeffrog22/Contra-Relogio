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
    expect(atletas[0].categoriaOficial).toBe('Petiz');
    expect(atletas[0].categoriaCalculada).toBe('Infantil');
    expect(atletas[0].medalha).toBe('Sem Tempo');

    expect(atletas[1].categoriaOficial).toBe('Mirim');
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

  it('tolera BOM UTF-8 (EF BB BF) no início do arquivo', () => {
    const csv = `\uFEFF${[
      CABECALHO,
      'Ana Silva,11,Petiz,feminino,manhã,J,Nível 1 A,20.10',
    ].join('\n')}`;

    const { atletas, erros } = parseCSVAtletas(csv);
    expect(erros).toEqual([]);
    expect(atletas).toHaveLength(1);
    expect(atletas[0].nome).toBe('Ana Silva');
    expect(atletas[0].periodo).toBe('manhã');
  });

  it('aceita "aluno" e "atleta" no lugar de "nome", com cabeçalho repetido', () => {
    for (const colunaNome of ['aluno', 'atleta']) {
      const csv = [
        `${colunaNome},idade,categoria,genero,horario,professor,nivel,tempo`,
        'Ana Silva,11,Petiz,feminino,manhã,J,Nível 1 A,20.10',
        `${colunaNome},idade,categoria,genero,horario,professor,nivel,tempo`,
        'Bruno Luz,12,Petiz,masculino,tarde,K,Nível 1 A,',
      ].join('\n');

      const { atletas, erros } = parseCSVAtletas(csv);
      expect(erros).toEqual([]);
      expect(atletas).toHaveLength(2);
      expect(atletas[0].nome).toBe('Ana Silva');
      expect(atletas[1].nome).toBe('Bruno Luz');
    }
  });

  it('sugere sinônimos quando falta a coluna de nome', () => {
    const { erros } = parseCSVAtletas('idade,categoria,genero,horario,professor,nivel');
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('"nome"');
    expect(erros[0]).toContain('aluno, atleta');
  });

  it('converte horários em período manhã/tarde (arquivo real)', () => {
    const csv = [
      CABECALHO,
      'Ana Silva,11,Petiz,feminino,08:45,J,Nível 1 A,20.10',
      'Bruno Luz,12,Petiz,masculino,13:45,K,Nível 1 A,',
    ].join('\n');

    const { atletas, erros } = parseCSVAtletas(csv);
    expect(erros).toEqual([]);
    expect(atletas).toHaveLength(2);
    expect(atletas[0].periodo).toBe('manhã');
    expect(atletas[1].periodo).toBe('tarde');
  });

  it('mantém a rejeição de horário inválido com a nova mensagem', () => {
    const { atletas, erros } = parseCSVAtletas(
      'nome,idade,categoria,genero,horario,professor,nivel\nAna,11,Petiz,feminino,noite,J,Nível 1 A',
    );
    expect(atletas).toHaveLength(0);
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('horário inválido');
    expect(erros[0]).toContain('ex.: 08:45');
  });

  it('normaliza subclasses de categoria (ex.: "Mirim II" → Mirim)', () => {
    const csv = [
      CABECALHO,
      'Ana Silva,10,Mirim II,feminino,08:45,J,Nível 1 A,20.10',
      'Bruno Luz,11,Petiz A,masculino,13:45,K,Nível 1 A,',
    ].join('\n');

    const { atletas, erros } = parseCSVAtletas(csv);
    expect(erros).toEqual([]);
    expect(atletas).toHaveLength(2);
    expect(atletas[0].categoriaOficial).toBe('Mirim');
    expect(atletas[1].categoriaOficial).toBe('Petiz');
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

  it('tolera BOM UTF-8 (EF BB BF) no início do arquivo', () => {
    const csv = `\uFEFF${[
      'ano,aluno,tempo,medalha,categoria,genero',
      '2024,Ana Cristina Goldberger,22.36,PRATA,Petiz,feminino',
    ].join('\n')}`;

    const { eventos, erros } = parseCSVHistorico(csv);
    expect(erros).toEqual([]);
    expect(eventos).toHaveLength(1);
    expect(eventos[0].ano).toBe(2024);
    expect(eventos[0].medalha).toBe('PRATA');
  });

  it('aceita "atleta" no lugar de "aluno" com BOM e ponto e vírgula (arquivo real)', () => {
    const csv = `\uFEFF${[
      'ano;atleta;tempo;medalha;categoria',
      '2024;Aline Barros da Silva;21.93;PRATA;Infantil',
      '2024;Davi Gabriel Estevao;0;Sem Tempo;Petiz',
      'ano;atleta;tempo;medalha;categoria',
      '2025;Sarah Barbosa da Silva;18.48;OURO;Infantil',
    ].join('\r\n')}`;

    const { eventos, erros } = parseCSVHistorico(csv);
    expect(erros).toEqual([]);
    expect(eventos).toHaveLength(3);
    expect(eventos[0].aluno).toBe('Aline Barros da Silva');
    expect(eventos[0].medalha).toBe('PRATA');
    expect(eventos[1].tempo).toBeUndefined();
    expect(eventos[1].medalha).toBe('Sem Tempo');
    expect(eventos[2].aluno).toBe('Sarah Barbosa da Silva');
  });

  it('sugere sinônimos quando falta a coluna aluno', () => {
    const { erros } = parseCSVHistorico('ano,medalha,categoria\n2024,OURO,Petiz');
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('"aluno"');
    expect(erros[0]).toContain('aluno, atleta');
  });
});
