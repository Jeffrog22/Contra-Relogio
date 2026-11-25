export async function exportXlsx(
  nomeArquivo: string,
  campos: string[],
  linhas: (string | number)[][],
): Promise<void> {
  const XLSX = await import('xlsx');
  const planilha = XLSX.utils.aoa_to_sheet([campos, ...linhas]);
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, 'Resultados');
  XLSX.writeFile(livro, nomeArquivo);
}
