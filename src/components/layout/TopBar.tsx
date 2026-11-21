import { useAppStore } from '../../store/useAppStore';
import { montarLink } from '../../utils/compartilhar';
import { Button } from '../ui/Button';

async function copiarParaAreaTransferencia(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = texto;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

export function TopBar() {
  const tema = useAppStore((estado) => estado.tema);
  const alternarTema = useAppStore((estado) => estado.alternarTema);
  const mostrarToast = useAppStore((estado) => estado.mostrarToast);

  async function compartilhar() {
    const estado = useAppStore.getState();
    const semDados =
      estado.atletas.length === 0 &&
      estado.atletasApresentacao.length === 0 &&
      estado.historico.length === 0;
    if (semDados) {
      mostrarToast('erro', 'Nenhum dado para compartilhar.');
      return;
    }

    const base = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const link = montarLink(base, {
      atletas: estado.atletas,
      atletasApresentacao: estado.atletasApresentacao,
      series: estado.series,
      periodo: estado.periodo,
      generoBalizamento: estado.generoBalizamento,
      historico: estado.historico,
    });
    if (!link) {
      mostrarToast('erro', 'Dados grandes demais para um link. Reduza os dados e tente de novo.');
      return;
    }

    const copiado = await copiarParaAreaTransferencia(link);
    if (copiado) {
      mostrarToast('sucesso', 'Link copiado com todos os dados embutidos.');
    } else {
      mostrarToast('erro', 'Não foi possível copiar o link.');
    }
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-[57px] flex items-center justify-between px-4 no-print">
      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
        Festival de Natação Contra Relógio
        <span className="ml-2 align-middle text-[10px] font-normal text-gray-400 dark:text-gray-500">
          v{__APP_VERSION__}
        </span>
      </span>
      <div className="flex items-center gap-1">
        <Button
          variante="ghost"
          onClick={compartilhar}
          aria-label="Copiar link com dados"
          title="Copiar link com todos os dados embutidos"
        >
          <span className="text-lg leading-none">🔗</span>
        </Button>
        <Button
          variante="ghost"
          onClick={alternarTema}
          aria-label={tema === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          title={tema === 'dark' ? 'Tema claro' : 'Tema escuro'}
        >
          <span className="text-lg leading-none">{tema === 'dark' ? '☀️' : '🌙'}</span>
        </Button>
      </div>
    </header>
  );
}
