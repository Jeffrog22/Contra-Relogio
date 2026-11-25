import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Serie } from '../../types';
import { useCronometro } from '../../hooks/useCronometro';
import { formatTempo } from '../../utils/medalhas';
import { Button } from './Button';

interface Props {
  serie: Serie;
  onFechar: () => void;
}

const CHAVE_POS = 'festival-crono-btns';

type QualBotao = 'iniciar' | 'parar';
type PosBotoes = Partial<Record<QualBotao, { left: number; top: number }>>;

function carregarPos(): PosBotoes {
  try {
    const bruto = localStorage.getItem(CHAVE_POS);
    return bruto ? (JSON.parse(bruto) as PosBotoes) : {};
  } catch {
    return {};
  }
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Formato do crono.html: 00'27"45 (min'seg"centésimos). */
function formatMestre(ms: number): string {
  const totalCs = Math.floor(Math.max(0, ms) / 10);
  const min = Math.floor(totalCs / 6000);
  const seg = Math.floor((totalCs % 6000) / 100);
  const cs = totalCs % 100;
  return `${pad2(min)}'${pad2(seg)}"${pad2(cs)}`;
}

interface ChipProps {
  atletaId: string;
  raia: number;
  nome: string;
}

function ChipRaia({ atletaId, raia, nome }: ChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `chip-${atletaId}`,
  });
  const nomeCurto = nome.trim().split(/\s+/).slice(0, 2).join(' ');
  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={nome}
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? 'opacity-40' : ''
      } bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300`}
    >
      <span className="font-mono tabular-nums font-bold">{raia}</span>
      <span className="max-w-[10rem] truncate">{nomeCurto}</span>
    </span>
  );
}

interface LinhaProps {
  ordem: number;
  tempoMs: number;
  chip?: ChipProps;
}

function LinhaPendente({ ordem, tempoMs, chip }: LinhaProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `pend-${ordem}` });
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      <td className="py-2 font-mono tabular-nums text-gray-600 dark:text-gray-400">{ordem}</td>
      <td className="py-2 font-mono tabular-nums font-medium text-gray-800 dark:text-gray-100">
        {formatTempo(tempoMs / 1000)}
      </td>
      <td className="py-2">
        <div
          ref={setNodeRef}
          className={`min-h-[32px] min-w-[7rem] rounded-md border border-dashed px-2 py-1 flex items-center transition-colors ${
            isOver
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : chip
                ? 'border-solid border-transparent'
                : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
          }`}
        >
          {chip ? (
            <ChipRaia atletaId={chip.atletaId} raia={chip.raia} nome={chip.nome} />
          ) : (
            <span className="text-xs">—</span>
          )}
        </div>
      </td>
    </tr>
  );
}

export function CronometroSerie({ serie, onFechar }: Props) {
  const atletas = useMemo(() => serie.atletas.map((i) => i.atleta), [serie]);
  const infoPorId = useMemo(
    () => new Map(serie.atletas.map((i) => [i.atleta.id, { raia: i.raia, nome: i.atleta.nome }])),
    [serie],
  );
  const {
    running,
    tempoMestre,
    pendentes,
    atribuicoes,
    chipsDisponiveis,
    total,
    podeRegistrar,
    iniciar,
    capturar,
    zerar,
    atribuir,
    desatribuir,
    gravar,
  } = useCronometro(atletas);

  const modalRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<PosBotoes>(carregarPos);
  const posRef = useRef(pos);
  const arrastoRef = useRef<{
    qual: QualBotao;
    x0: number;
    y0: number;
    left0: number;
    top0: number;
    movido: boolean;
  } | null>(null);
  const holdRef = useRef<number | null>(null);
  const holdFeitoRef = useRef(false);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(
    () => () => {
      if (holdRef.current !== null) clearTimeout(holdRef.current);
    },
    [],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function atualizarPos(qual: QualBotao, left: number, top: number) {
    const novo = { ...posRef.current, [qual]: { left, top } };
    posRef.current = novo;
    setPos(novo);
  }

  function cancelarHold() {
    if (holdRef.current !== null) {
      clearTimeout(holdRef.current);
      holdRef.current = null;
    }
  }

  function salvarPos() {
    try {
      localStorage.setItem(CHAVE_POS, JSON.stringify(posRef.current));
    } catch {
      /* localStorage indisponível — posição fica só na sessão */
    }
  }

  function pointerDown(qual: QualBotao, evento: ReactPointerEvent<HTMLButtonElement>) {
    const botao = evento.currentTarget;
    const modal = modalRef.current;
    if (!modal) return;
    botao.setPointerCapture(evento.pointerId);
    const retBotao = botao.getBoundingClientRect();
    const retModal = modal.getBoundingClientRect();
    arrastoRef.current = {
      qual,
      x0: evento.clientX,
      y0: evento.clientY,
      left0: retBotao.left - retModal.left,
      top0: retBotao.top - retModal.top,
      movido: false,
    };
    if (qual === 'parar') {
      holdFeitoRef.current = false;
      holdRef.current = window.setTimeout(() => {
        holdFeitoRef.current = true;
        holdRef.current = null;
        zerar();
      }, 3000);
    }
  }

  function pointerMove(evento: ReactPointerEvent<HTMLButtonElement>) {
    const st = arrastoRef.current;
    if (!st) return;
    const dx = evento.clientX - st.x0;
    const dy = evento.clientY - st.y0;
    if (!st.movido) {
      if (Math.hypot(dx, dy) < 6) return;
      st.movido = true;
      cancelarHold();
    }
    const modal = modalRef.current;
    if (!modal) return;
    const retModal = modal.getBoundingClientRect();
    const retBotao = evento.currentTarget.getBoundingClientRect();
    const left = Math.min(
      Math.max(0, st.left0 + dx),
      Math.max(0, retModal.width - retBotao.width),
    );
    const top = Math.min(
      Math.max(0, st.top0 + dy),
      Math.max(0, retModal.height - retBotao.height),
    );
    atualizarPos(st.qual, left, top);
  }

  function pointerUp(evento: ReactPointerEvent<HTMLButtonElement>) {
    const st = arrastoRef.current;
    arrastoRef.current = null;
    cancelarHold();
    try {
      evento.currentTarget.releasePointerCapture(evento.pointerId);
    } catch {
      /* pointer já liberado */
    }
    if (!st) return;
    if (st.movido) {
      salvarPos();
      return;
    }
    if (st.qual === 'iniciar') {
      iniciar();
    } else if (!holdFeitoRef.current) {
      capturar();
    }
  }

  function pointerCancel() {
    arrastoRef.current = null;
    cancelarHold();
  }

  function aoTerparAraste(evento: DragEndEvent) {
    const { active, over } = evento;
    if (!over) return;
    const atletaId = String(active.id).replace(/^chip-/, '');
    if (over.id === 'chips-livre') {
      desatribuir(atletaId);
      return;
    }
    const ordem = Number(String(over.id).replace(/^pend-/, ''));
    if (Number.isFinite(ordem) && ordem >= 1) atribuir(ordem, atletaId);
  }

  function fechar() {
    if (running || pendentes.length > 0) {
      const confirmar = window.confirm(
        'Há tempos não registrados. Fechar e descartar os tempos da série?',
      );
      if (!confirmar) return;
    }
    zerar();
    onFechar();
  }

  function registrar() {
    if (!podeRegistrar) return;
    gravar();
    onFechar();
  }

  const estiloBotao = (qual: QualBotao) =>
    pos[qual] ? { left: pos[qual]!.left, top: pos[qual]!.top } : undefined;

  const classePadrao = (qual: QualBotao) =>
    pos[qual]
      ? ''
      : qual === 'iniciar'
        ? 'left-4 top-4'
        : 'right-4 top-4';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-start bg-black/40 dark:bg-black/60"
      onClick={fechar}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-b-lg shadow-xl dark:shadow-black/20 max-h-[90vh] flex flex-col select-none"
        style={{ WebkitTouchCallout: 'none' }}
        onClick={(evento) => evento.stopPropagation()}
        onContextMenu={(evento) => evento.preventDefault()}
      >
        <button
          type="button"
          aria-label="Iniciar cronômetro"
          className={`absolute z-20 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors touch-none ${classePadrao('iniciar')}`}
          style={estiloBotao('iniciar')}
          onPointerDown={(e) => pointerDown('iniciar', e)}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerCancel}
          onContextMenu={(e) => e.preventDefault()}
        >
          ▶ Iniciar
        </button>
        <button
          type="button"
          aria-label="Parar e registrar chegada (segure 3s para zerar)"
          className={`absolute z-20 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors touch-none ${classePadrao('parar')}`}
          style={estiloBotao('parar')}
          onPointerDown={(e) => pointerDown('parar', e)}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={pointerCancel}
          onContextMenu={(e) => e.preventDefault()}
        >
          ■ Parar
        </button>

        <DndContext sensors={sensors} onDragEnd={aoTerparAraste}>
          <header className="relative shrink-0 px-4 pt-6 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />

            <div className="flex justify-center">
              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg px-4 py-2 text-center min-w-[9.5rem] sm:min-w-[12rem]">
                <div className="flex items-center justify-between gap-3 mb-0.5">
                  <span className="text-primary-400 text-xs">◷</span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      running
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {running ? 'Rodando' : 'Parado'}
                  </span>
                </div>
                <div className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-primary-400">
                  {formatMestre(tempoMestre)}
                </div>
              </div>
            </div>

            <div className="mt-3 min-h-[2rem]">
              <ZonaChips chips={chipsDisponiveis} infoPorId={infoPorId} />
            </div>

            <div className="mt-1.5 text-center text-[10px] text-gray-400 dark:text-gray-500">
              Série {serie.numero} - {serie.genero}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Registros pendentes
              </h3>
              <span className="text-xs font-mono tabular-nums text-gray-500 dark:text-gray-400">
                {pendentes.length}/{total} capturados
              </span>
            </div>

            {pendentes.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Clique em <span className="font-medium text-red-600 dark:text-red-400">Parar</span> a
                cada chegada para capturar o tempo da sequência.
              </p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-1.5 w-16 font-medium">Ordem</th>
                    <th className="text-left py-1.5 font-medium">Tempo</th>
                    <th className="text-left py-1.5 font-medium">Baliza</th>
                  </tr>
                </thead>
                <tbody>
                  {pendentes.map((p) => {
                    const atletaId = atribuicoes[p.ordem];
                    const info = atletaId ? infoPorId.get(atletaId) : undefined;
                    return (
                      <LinhaPendente
                        key={p.ordem}
                        ordem={p.ordem}
                        tempoMs={p.tempoMs}
                        chip={
                          atletaId && info
                            ? { atletaId, raia: info.raia, nome: info.nome }
                            : undefined
                        }
                      />
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <footer className="shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <Button
              variante="primary"
              disabled={!podeRegistrar}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={registrar}
            >
              Registrar
            </Button>
            <Button variante="secondary" onClick={fechar}>
              Fechar
            </Button>
          </footer>
        </DndContext>
      </div>
    </div>
  );
}

interface ZonaChipsProps {
  chips: string[];
  infoPorId: Map<string, { raia: number; nome: string }>;
}

function ZonaChips({ chips, infoPorId }: ZonaChipsProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'chips-livre' });
  return (
    <div
      ref={setNodeRef}
      className={`w-full flex flex-wrap justify-center gap-1.5 rounded-md p-1 transition-shadow ${
        isOver ? 'ring-2 ring-primary-400' : ''
      }`}
    >
      {chips.length === 0 ? (
        <span className="text-[10px] text-gray-400 dark:text-gray-500 py-1">
          Todos os chips atribuídos
        </span>
      ) : (
        chips.map((id) => {
          const info = infoPorId.get(id);
          if (!info) return null;
          return <ChipRaia key={id} atletaId={id} raia={info.raia} nome={info.nome} />;
        })
      )}
    </div>
  );
}
