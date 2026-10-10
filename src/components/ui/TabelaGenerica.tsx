import type { ReactNode } from 'react';

export interface Coluna<T> {
  chave: string;
  titulo: string;
  render: (item: T) => ReactNode;
}

interface Props<T> {
  colunas: Coluna<T>[];
  itens: T[];
  chaveItem: (item: T) => string;
  vazio?: ReactNode;
  className?: string;
}

export function TabelaGenerica<T>({
  colunas,
  itens,
  chaveItem,
  vazio = 'Nenhum registro encontrado.',
  className = '',
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
            itens.map((item) => (
              <tr
                key={chaveItem(item)}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800"
              >
                {colunas.map((coluna) => (
                  <td
                    key={coluna.chave}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                  >
                    {coluna.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
