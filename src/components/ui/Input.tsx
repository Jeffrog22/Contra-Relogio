import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  erro?: boolean;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { erro = false, className = '', disabled = false, ...resto },
  ref,
) {
  const base =
    'w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';
  const estiloErro = erro ? 'border-red-500 animate-shake' : '';
  const estiloDisabled = disabled
    ? 'disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400'
    : '';

  return (
    <input
      ref={ref}
      disabled={disabled}
      className={`${base} ${estiloErro} ${estiloDisabled} ${className}`}
      {...resto}
    />
  );
});
