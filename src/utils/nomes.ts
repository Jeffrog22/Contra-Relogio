const PREPOSICOES = new Set([
  'de',
  'do',
  'da',
  'dos',
  'das',
  'no',
  'na',
  'nos',
  'nas',
  'em',
  'com',
  'por',
  'para',
  'a',
  'o',
]);

/** Primeiro e segundo nome do aluno, desconsiderando preposições/contrações (no texto e na contagem). */
export function nomeCurto(nome: string): string {
  const tokens = nome.trim().split(/\s+/).filter(Boolean);
  const filtrados = tokens.filter((t) => !PREPOSICOES.has(t.toLowerCase()));
  const base = filtrados.length > 0 ? filtrados : tokens;
  return base.slice(0, 2).join(' ');
}
