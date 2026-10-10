import { useAppStore } from '../../store/useAppStore';

export function Toast() {
  const toast = useAppStore((estado) => estado.toast);
  const esconderToast = useAppStore((estado) => estado.esconderToast);

  if (!toast) return null;

  const cor =
    toast.tipo === 'sucesso'
      ? 'bg-green-600 dark:bg-green-700'
      : 'bg-red-600 dark:bg-red-700';

  return (
    <div
      role="status"
      onClick={esconderToast}
      className={`fixed bottom-4 right-4 text-white px-4 py-2 rounded shadow-lg dark:shadow-black/20 text-sm z-50 cursor-pointer ${cor}`}
    >
      {toast.mensagem}
    </div>
  );
}
