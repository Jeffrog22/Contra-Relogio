import Papa from 'papaparse';
import type { Atleta, EventoHistorico, Genero, Medalha } from '../types';
import { calcularMedalha, parseTempo } from './medalhas';
import { categoriaPorIdade, normalizarCategoria } from './categorias';
import { periodoDoHorario } from './periodo';

export interface ResultadoCSV {
  atletas: Atleta[];
  erros: string[];
}

export interface ResultadoHistorico {
  eventos: EventoHistorico[];
  erros: string[];
}

function removerBOM(texto: string): string {
  return texto.replace(/^\uFEFF+/, '');
}

function chave(valor: string): string {
  return valor
    .replace(/\uFEFF/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
}

function normalizarGenero(valor: string): Genero | null {
  const v = chave(valor);
  if (v === 'feminino') return 'feminino';
  if (v === 'masculino') return 'masculino';
  return null;
}

function normalizarMedalha(valor: string): Medalha | null {
  const v = chave(valor);
  if (v === 'ouro') return 'OURO';
  if (v === 'prata') return 'PRATA';
  if (v === 'bronze') return 'BRONZE';
  if (v === 'sem_tempo' || v === 'semtempo') return 'Sem Tempo';
  return null;
}

export function gerarId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const COLUNAS_OBRIGATORIAS = [
  'nome',
  'idade',
  'categoria',
  'genero',
  'horario',
  'professor',
  'nivel',
];

const ALIASES_ATLETAS: Record<string, string> = { aluno: 'nome', atleta: 'nome' };
const ALIASES_HISTORICO: Record<string, string> = { atleta: 'aluno' };

function normalizarHeader(header: string, aliases: Record<string, string>): string {
  const chaveHeader = chave(header);
  return aliases[chaveHeader] ?? chaveHeader;
}

function mensagemColunaAusente(coluna: string, aliases: Record<string, string>): string {
  const sinonimos = Object.keys(aliases).filter((alias) => aliases[alias] === coluna);
  if (sinonimos.length === 0) return `Coluna obrigatória ausente: "${coluna}"`;
  return `Coluna obrigatória ausente: "${coluna}" (aceitos: ${[coluna, ...sinonimos].join(', ')})`;
}

function lerTabela(texto: string): {
  dados: Record<string, string>[];
  erros: string[];
} {
  const resultado = Papa.parse<Record<string, string>>(removerBOM(texto), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => normalizarHeader(h, ALIASES_ATLETAS),
  });

  const erros: string[] = [];
  const campos = resultado.meta.fields ?? [];
  for (const obrigatoria of COLUNAS_OBRIGATORIAS) {
    if (!campos.includes(obrigatoria)) {
      erros.push(mensagemColunaAusente(obrigatoria, ALIASES_ATLETAS));
    }
  }
  return { dados: resultado.data, erros };
}

export function parseCSVAtletas(texto: string): ResultadoCSV {
  const { dados, erros } = lerTabela(texto);
  const atletas: Atleta[] = [];

  if (erros.length > 0) return { atletas, erros };

  dados.forEach((linha, indice) => {
    const numeroLinha = indice + 2;
    const nome = (linha.nome ?? '').trim();
    const idadeTexto = (linha.idade ?? '').trim();
    const repetido =
      ['nome', 'aluno', 'atleta'].includes(chave(nome)) && chave(idadeTexto) === 'idade';

    if (!nome && !idadeTexto) return;
    if (repetido) return;

    const idade = Number.parseInt(idadeTexto, 10);
    if (!Number.isInteger(idade) || idade < 1 || idade > 99) {
      erros.push(`Linha ${numeroLinha}: idade inválida ("${idadeTexto}")`);
      return;
    }

    const genero = normalizarGenero(linha.genero ?? '');
    if (!genero) {
      erros.push(
        `Linha ${numeroLinha}: gênero inválido ("${linha.genero ?? ''}") — use feminino ou masculino`,
      );
      return;
    }

    const periodo = periodoDoHorario(linha.horario ?? '');
    if (!periodo) {
      erros.push(
        `Linha ${numeroLinha}: horário inválido ("${linha.horario ?? ''}") — use manhã, tarde ou um horário (ex.: 08:45)`,
      );
      return;
    }

    const categoriaOficial = normalizarCategoria(linha.categoria ?? '');
    if (!categoriaOficial) {
      erros.push(`Linha ${numeroLinha}: categoria inválida ("${linha.categoria ?? ''}")`);
      return;
    }

    const categoriaCalculada = categoriaPorIdade(idade);
    const tempo = parseTempo(linha.tempo ?? '');

    atletas.push({
      id: gerarId(),
      nome,
      idade,
      categoriaOficial,
      categoriaCalculada,
      genero,
      periodo,
      professor: (linha.professor ?? '').trim(),
      nivel: (linha.nivel ?? '').trim(),
      tempo,
      medalha: calcularMedalha(tempo, categoriaOficial, genero),
    });
  });

  return { atletas, erros };
}

export function parseCSVHistorico(texto: string): ResultadoHistorico {
  const resultado = Papa.parse<Record<string, string>>(removerBOM(texto), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => normalizarHeader(h, ALIASES_HISTORICO),
  });

  const erros: string[] = [];
  const eventos: EventoHistorico[] = [];
  const campos = resultado.meta.fields ?? [];

  for (const obrigatoria of ['ano', 'aluno', 'medalha', 'categoria']) {
    if (!campos.includes(obrigatoria)) {
      return { eventos, erros: [mensagemColunaAusente(obrigatoria, ALIASES_HISTORICO)] };
    }
  }

  resultado.data.forEach((linha, indice) => {
    const numeroLinha = indice + 2;
    const aluno = (linha.aluno ?? '').trim();
    if (!aluno) return;
    if (['aluno', 'atleta'].includes(chave(aluno))) return;

    const ano = Number.parseInt((linha.ano ?? '').trim(), 10);
    if (!Number.isInteger(ano) || ano < 1900 || ano > 2200) {
      erros.push(`Linha ${numeroLinha}: ano inválido ("${linha.ano ?? ''}")`);
      return;
    }

    const medalha = normalizarMedalha(linha.medalha ?? '');
    if (!medalha) {
      erros.push(
        `Linha ${numeroLinha}: medalha inválida ("${linha.medalha ?? ''}") — use OURO, PRATA, BRONZE ou Sem Tempo`,
      );
      return;
    }

    const categoria = normalizarCategoria(linha.categoria ?? '');
    if (!categoria) {
      erros.push(`Linha ${numeroLinha}: categoria inválida ("${linha.categoria ?? ''}")`);
      return;
    }

    const genero = linha.genero ? normalizarGenero(linha.genero) : null;

    eventos.push({
      ano,
      aluno,
      tempo: parseTempo(linha.tempo ?? ''),
      medalha,
      categoria,
      genero: genero ?? undefined,
    });
  });

  return { eventos, erros };
}

export function exportCSV(
  nomeArquivo: string,
  campos: string[],
  linhas: (string | number)[][],
): void {
  const csv = Papa.unparse({ fields: campos, data: linhas });
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}
