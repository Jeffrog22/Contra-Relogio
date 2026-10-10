import { useAppStore } from '../../store/useAppStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export function TopBar() {
  const tema = useAppStore((estado) => estado.tema);
  const alternarTema = useAppStore((estado) => estado.alternarTema);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-[57px] flex items-center justify-between px-4 no-print">
      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
        Festival de Natação Contra Relógio
        <Badge tom="cinza" className="ml-2 align-middle text-[10px] font-semibold">
          v{__APP_VERSION__}
        </Badge>
      </span>
      <Button
        variante="ghost"
        onClick={alternarTema}
        aria-label={tema === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
        title={tema === 'dark' ? 'Tema claro' : 'Tema escuro'}
      >
        <span className="text-lg leading-none">{tema === 'dark' ? '☀️' : '🌙'}</span>
      </Button>
    </header>
  );
}
