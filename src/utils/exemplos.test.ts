import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseCSVAtletas, parseCSVHistorico } from './csv';

function lerExemplo(nome: string): string {
  return readFileSync(fileURLToPath(new URL(`../../exemplos/${nome}`, import.meta.url)), 'utf8');
}

describe('CSVs de exemplo do repositório', () => {
  it('exemplos/atletas.csv é válido', () => {
    const { atletas, erros } = parseCSVAtletas(lerExemplo('atletas.csv'));

    expect(erros).toEqual([]);
    expect(atletas.length).toBe(16);
    expect(atletas.every((a) => a.categoriaCalculada.length > 0)).toBe(true);
    expect(atletas.every((a) => a.nome.trim().length > 0)).toBe(true);
    expect(atletas.some((a) => a.medalha === 'Sem Tempo')).toBe(true);
    expect(
      atletas.some((a) => a.medalha === 'OURO' || a.medalha === 'PRATA' || a.medalha === 'BRONZE'),
    ).toBe(true);
  });

  it('exemplos/historico.csv é válido', () => {
    const { eventos, erros } = parseCSVHistorico(lerExemplo('historico.csv'));

    expect(erros).toEqual([]);
    expect(eventos.length).toBe(7);
    expect([...new Set(eventos.map((e) => e.ano))].sort()).toEqual([2024, 2025]);
  });
});
