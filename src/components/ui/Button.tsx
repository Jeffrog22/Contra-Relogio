import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variante = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANTES: Record<Variante, string> = {
  primary:
    'bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors px-4 py-2 text-sm',
  secondary:
    'border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
  danger:
    'bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors px-5 py-2 text-sm font-bold',
  ghost: 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  children: ReactNode;
}

export function Button({ variante = 'primary', className = '', children, ...resto }: Props) {
  return (
    <button className={`${VARIANTES[variante]} ${className}`} {...resto}>
      {children}
    </button>
  );
}
