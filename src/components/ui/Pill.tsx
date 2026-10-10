import type { ReactNode } from 'react';

interface Props {
  ativo: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function Pill({ ativo, onClick, children, className = '' }: Props) {
  const estilo = ativo
    ? 'px-4 py-2 text-sm rounded-lg bg-primary-600 text-white transition'
    : 'px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 transition';

  return (
    <button type="button" onClick={onClick} className={`${estilo} ${className}`}>
      {children}
    </button>
  );
}
