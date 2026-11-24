import { useEffect, useMemo, useRef } from 'react';
import type { Serie } from '../../types';
import { useCronometro } from '../../hooks/useCronometro';
import { formatTempo } from '../../utils/medalhas';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from './Modal';
import { Button } from './Button';

interface Props {
  serie: Serie;
  onFechar: () => void;
}

export function CronometroSerie({ serie, onFechar }: Props) {
  const atletas = useMemo(() => serie.atletas.map((i) => i.atleta), [serie]);
  const mostrarToast = useAppStore((estado) => estado.mostrarToast);
  const {
    running,
    selectedId,
    done,
    tempoMestre,
    iniciar,
    parar,
    reset,
    todasConcluidas,
    tempoDoAtleta,
    temAlguemParaCronometrar,
  } = useCronometro(atletas);

  const concluidos = atletas.filter(
    (a) => done.has(a.id) || a.tempo !== undefined,
  ).length;
  const total = atletas.length;
  const avisouRef = useRef(false);

  useEffect(() => {
    if (avisouRef.current || !todasConcluidas()) return;
    avisouRef.current = true;
    mostrarToast('sucesso', 'Série completa!');
    onFechar();
  }, [todasConcluidas, mostrarToast, onFechar]);

  function fechar() {
    if (running) {
      const confirmar = window.confirm(
        'Há um tempo em andamento. Fechar e descartar o tempo da série?',
      );
      if (!confirmar) return;
    }
    reset();
    onFechar();
  }

  const raiaDe = (id: string) => serie.atletas.find((i) => i.atleta.id === id)?.raia;

  return (
    <Modal titulo={`Cronômetro — Série ${serie.numero}`} onClose={fechar}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Série {serie.numero} · {serie.categoria} · {serie.genero}
          </span>
          <span className="text-xs font-mono tabular-nums text-primary-600 dark:text-primary-400">
            {concluidos}/{total} concluídos
          </span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Mestre</span>
            <span className="font-mono tabular-nums text-xl font-semibold">
              {formatTempo(tempoMestre / 1000)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {atletas.map((atleta) => {
            const finalizado = done.has(atleta.id);
            const jaTemTempo = atleta.tempo !== undefined && atleta.tempo !== null;
            const concluido = finalizado || jaTemTempo;
            const selecionado = selectedId === atleta.id;
            const ms = tempoDoAtleta(atleta.id);
            const raia = raiaDe(atleta.id);
            return (
              <div
                key={atleta.id}
                className={`flex items-center justify-between p-2 rounded border ${
                  selecionado
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono tabular-nums text-xs text-gray-400 dark:text-gray-500 w-4">
                    {raia}
                  </span>
                  <span className="text-sm font-medium truncate w-32">{atleta.nome}</span>
                  <span className="font-mono tabular-nums text-sm w-20">
                    {concluido
                      ? formatTempo(atleta.tempo)
                      : ms > 0
                        ? formatTempo(ms / 1000)
                        : formatTempo(0)}
                  </span>
                  {concluido ? (
                    <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded">
                      Concluído
                    </span>
                  ) : selecionado ? (
                    <span className="text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 px-2 py-0.5 rounded">
                      Ativo
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {running ? 'Aguardando' : 'Pronto'}
                    </span>
                  )}
                </div>
                {!concluido && (
                  <Button
                    variante="ghost"
                    className="text-xs px-2 py-1"
                    disabled={running && !selecionado}
                    onClick={() => {
                      if (!running) iniciar();
                      else if (selecionado) parar(atleta.id);
                    }}
                  >
                    {running && selecionado ? 'Parar' : 'Iniciar'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Button
              variante={running ? 'secondary' : 'primary'}
              disabled={running || !temAlguemParaCronometrar}
              onClick={iniciar}
            >
              {running ? 'Rodando' : 'Iniciar série'}
            </Button>
            <Button variante="danger" disabled={!running} onClick={reset}>
              Zerar
            </Button>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {!temAlguemParaCronometrar
              ? 'Todos já têm tempo'
              : running
                ? 'Cronômetro rodando'
                : 'Pronto para iniciar'}
          </span>
        </div>
      </div>
    </Modal>
  );
}
