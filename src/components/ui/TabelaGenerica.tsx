import type { ReactNode } from 'react';

export interface Coluna<T> {
  chave: string;
  titulo: ReactNode;
  render: (item: T) => ReactNode;
}

interface Props<T> {
  colunas: Coluna<T>[];
  itens: T[];
  chaveItem: (item: T) => string;
  vazio?: ReactNode;
  className?: string;
  renderLinha?: (item: T, celulas: ReactNode[]) => ReactNode;
  classeLinha?: (item: T) => string;
}

/**
 * Classe autocontida de linha para tabelas com séries: borda inferior,
 * tinta alternada por índice (par/ímpar) e recorte superior na primeira
 * linha de cada série. Não combina com outras classes de borda.
 */
export function classeLinhaSerie(indice: number, primeira: boolean): string {
  const tinta =
    indice % 2 === 0
      ? 'bg-primary-50/70 hover:bg-primary-100/70 dark:bg-primary-900/25 dark:hover:bg-primary-900/40'
      : 'hover:bg-gray-50 dark:hover:bg-gray-800';
  return [
    'border-b border-b-gray-100 dark:border-b-gray-800',
    tinta,
    primeira ? 'border-t-2 border-t-primary-300 dark:border-t-primary-700' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function TabelaGenerica<T>({
  colunas,
  itens,
  chaveItem,
  vazio = 'Nenhum registro encontrado.',
  className = '',
  renderLinha,
  classeLinha,
}: Props<T>) {
  return (
    <div
      className={`overflow-x-auto bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${className}`}
    >
      <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {colunas.map((coluna) => (
              <th
                key={coluna.chave}
                className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider"
              >
                {coluna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {itens.length === 0 ? (
            <tr>
              <td
                colSpan={colunas.length}
                className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                {vazio}
              </td>
            </tr>
          ) : (
            itens.map((item) => {
              const celulas = colunas.map((coluna) => (
                <td
                  key={coluna.chave}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                >
                  {coluna.render(item)}
                </td>
              ));
              if (renderLinha) return renderLinha(item, celulas);
              return (
                <tr
                  key={chaveItem(item)}
                  className={
                    classeLinha
                      ? classeLinha(item)
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800'
                  }
                >
                  {celulas}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
