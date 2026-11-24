import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Atleta } from '../types';
import { useAppStore } from '../store/useAppStore';

interface UseCronometroReturn {
  running: boolean;
  selectedId: string | null;
  done: Set<string>;
  startedAt: Record<string, number>;
  masterStartedAt: number | null;
  tempoMestre: number;
  iniciar: () => void;
  parar: (id: string) => void;
  reset: () => void;
  todasConcluidas: () => boolean;
  tempoDoAtleta: (id: string) => number;
  temAlguemParaCronometrar: boolean;
}

export function useCronometro(atletas: Atleta[]): UseCronometroReturn {
  const atualizarTempo = useAppStore((estado) => estado.atualizarTempoAtleta);
  const mostrarToast = useAppStore((estado) => estado.mostrarToast);
  const ids = useMemo(() => atletas.map((a) => a.id), [atletas]);
  const temAlguemParaCronometrar = useMemo(
    () => atletas.some((a) => a.tempo === undefined || a.tempo === null),
    [atletas],
  );

  const [running, setRunning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [startedAt, setStartedAt] = useState<Record<string, number>>({});
  const [tempos, setTempos] = useState<Record<string, number>>({});
  const [tempoMestre, setTempoMestre] = useState(0);
  const masterStartedAtRef = useRef<number | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const iniciar = useCallback(() => {
    if (running) return;
    const agora = Date.now();
    const novo: Record<string, number> = {};
    const novoDone = new Set(done);
    for (const atleta of atletas) {
      if (atleta.tempo !== undefined && atleta.tempo !== null) {
        novoDone.add(atleta.id);
        continue;
      }
      if (!novoDone.has(atleta.id)) novo[atleta.id] = agora;
    }
    if (Object.keys(novo).length === 0) return;
    setStartedAt(novo);
    masterStartedAtRef.current = agora;
    setTempoMestre(0);
    setTempos({});
    setDone(novoDone);
    setSelectedId(ids.find((id) => !novoDone.has(id)) ?? null);
    setRunning(true);
  }, [running, atletas, ids, done]);

  const parar = useCallback(
    (id: string) => {
      if (!running) return;
      const sa = startedAt[id];
      if (!sa) return;
      const agora = Date.now();
      const tempoSegundos = Number(((agora - sa) / 1000).toFixed(2));
      atualizarTempo(id, tempoSegundos);
      const nome = atletas.find((a) => a.id === id)?.nome ?? 'atleta';
      mostrarToast('sucesso', `Tempo de ${nome} registrado.`);
      const novoDone = new Set(done);
      novoDone.add(id);
      setDone(novoDone);
      setTempos((anteriores) => ({ ...anteriores, [id]: agora - sa }));
      setSelectedId(ids.find((i) => !novoDone.has(i)) ?? null);
      if (ids.every((i) => novoDone.has(i))) setRunning(false);
    },
    [running, startedAt, atletas, ids, done, atualizarTempo, mostrarToast],
  );

  const reset = useCallback(() => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
    setRunning(false);
    setStartedAt({});
    setTempos({});
    setTempoMestre(0);
    setSelectedId(null);
    setDone(new Set());
    masterStartedAtRef.current = null;
  }, []);

  const todasConcluidas = useCallback((): boolean => {
    return ids.length > 0 && ids.every((id) => done.has(id));
  }, [ids, done]);

  useEffect(() => {
    if (!running) {
      if (tickerRef.current) {
        clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
      return;
    }
    const tick = () => {
      const t = Date.now();
      const base = masterStartedAtRef.current ?? t;
      setTempoMestre(t - base);
      setTempos((anteriores) => {
        const n: Record<string, number> = { ...anteriores };
        for (const id of ids) {
          if (done.has(id)) continue;
          const sa = startedAt[id];
          if (sa) n[id] = t - sa;
        }
        return n;
      });
    };
    tick();
    tickerRef.current = setInterval(tick, 30);
    return () => {
      if (tickerRef.current) {
        clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
    };
  }, [running, ids, done, startedAt]);

  const tempoDoAtleta = useCallback((id: string): number => {
    return tempos[id] ?? 0;
  }, [tempos]);

  return {
    running,
    selectedId,
    done,
    startedAt,
    masterStartedAt: masterStartedAtRef.current,
    tempoMestre,
    iniciar,
    parar,
    reset,
    todasConcluidas,
    tempoDoAtleta,
    temAlguemParaCronometrar,
  };
}
