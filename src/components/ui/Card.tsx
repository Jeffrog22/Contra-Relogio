import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-black/20 p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeading({ icone, titulo }: { icone: string; titulo: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-3xl">{icone}</span>
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{titulo}</h2>
    </div>
  );
}

export function CardDescricao({ children }: { children: ReactNode }) {
  return <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{children}</p>;
}
