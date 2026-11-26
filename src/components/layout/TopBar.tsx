import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { montarLink } from '../../utils/compartilhar';
import {
  NIVEIS_ZOOM,
  aplicarZoom,
  lerZoomSalvo,
  salvarZoom,
  zoomVizinho,
  type ZoomNivel,
} from '../../utils/zoom';
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
  const alternarSidebar = useAppStore((estado) => estado.alternarSidebar);
  const [zoom, setZoom] = useState<ZoomNivel>(() => lerZoomSalvo());

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
    const link = await montarLink(base, {
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

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Festival Interno',
          text: 'Dados do Festival Contra Relógio:',
          url: link,
        });
        mostrarToast('sucesso', 'Link compartilhado.');
        return;
      } catch {
        /* usuário cancelou ou share indisponível — cai para o copy */
      }
    }

    const copiado = await copiarParaAreaTransferencia(link);
    if (copiado) {
      mostrarToast('sucesso', 'Link copiado com todos os dados embutidos.');
    } else {
      mostrarToast('erro', 'Não foi possível copiar o link.');
    }
  }

  function ajustarZoom(direcao: -1 | 1) {
    const proximo = zoomVizinho(zoom, direcao) as ZoomNivel;
    if (proximo === zoom) return;
    setZoom(proximo);
    aplicarZoom(proximo);
    salvarZoom(proximo);
  }

  const indiceZoom = (NIVEIS_ZOOM as readonly number[]).indexOf(zoom);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-[57px] flex items-center justify-between px-4 no-print">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variante="ghost"
          className="md:hidden shrink-0"
          onClick={alternarSidebar}
          aria-label="Abrir menu de navegação"
          title="Menu"
        >
          <span className="text-lg leading-none">☰</span>
        </Button>
        <span className="text-lg font-bold text-primary-600 dark:text-primary-400 truncate">
          Festival de Natação Contra Relógio
          <span className="ml-2 align-middle text-[10px] font-normal text-gray-400 dark:text-gray-500">
            v{__APP_VERSION__}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variante="ghost"
          onClick={compartilhar}
          aria-label="Compartilhar link com dados"
          title="Compartilhar link com todos os dados embutidos"
        >
          <span className="text-lg leading-none">🔗</span>
        </Button>
        <Button
          variante="ghost"
          onClick={() => ajustarZoom(-1)}
          aria-label="Diminuir zoom"
          title={`Diminuir zoom (atual: ${Math.round(zoom * 100)}%)`}
          disabled={indiceZoom <= 0}
        >
          <span className="text-sm font-bold leading-none">A−</span>
        </Button>
        <Button
          variante="ghost"
          onClick={() => ajustarZoom(1)}
          aria-label="Aumentar zoom"
          title={`Aumentar zoom (atual: ${Math.round(zoom * 100)}%)`}
          disabled={indiceZoom >= NIVEIS_ZOOM.length - 1}
        >
          <span className="text-sm font-bold leading-none">A+</span>
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
