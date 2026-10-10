import type { Medalha } from '../../types';

const ESTILOS: Record<Medalha, string> = {
  OURO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PRATA: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  BRONZE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Sem Tempo': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

export function MedalhaBadge({ medalha }: { medalha: Medalha | undefined }) {
  const valor: Medalha = medalha ?? 'Sem Tempo';
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${ESTILOS[valor]}`}
    >
      {valor}
    </span>
  );
}
