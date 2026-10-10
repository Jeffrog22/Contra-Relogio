import type { ReactNode } from 'react';

type Tom = 'verde' | 'vermelho' | 'amarelo' | 'azul' | 'cinza';

const TONS: Record<Tom, string> = {
  verde: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  vermelho: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  amarelo: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  azul: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  cinza: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
};

interface Props {
  tom: Tom;
  children: ReactNode;
  className?: string;
}

export function Badge({ tom, children, className = '' }: Props) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${TONS[tom]} ${className}`}
    >
      {children}
    </span>
  );
}
