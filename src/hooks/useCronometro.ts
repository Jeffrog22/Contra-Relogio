import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Atleta } from '../types';
import { useAppStore } from '../store/useAppStore';

export interface TempoPendente {
  ordem: number;
  tempoMs: number;
}

interface UseCronometroReturn {
  running: boolean;
  tempoMestre: number;
  pendentes: TempoPendente[];
  atribuicoes: Record<number, string>;
  chipsDisponiveis: string[];
  total: number;
  todasCapturadas: boolean;
  podeRegistrar: boolean;
  iniciar: () => void;
  capturar: () => void;
  zerar: () => void;
  atribuir: (ordem: number, atletaId: string) => void;
  desatribuir: (atletaId: string) => void;
  gravar: () => void;
}

export function useCronometro(atletas: Atleta[]): UseCronometroReturn {
  const atualizarTempo = useAppStore((estado) => estado.atualizarTempoAtleta);
  const mostrarToast = useAppStore((estado) => estado.mostrarToast);
  const ids = useMemo(() => atletas.map((a) => a.id), [atletas]);
  const total = ids.length;

  const [running, setRunning] = useState(false);
  const [tempoMestre, setTempoMestre] = useState(0);
  const [pendentes, setPendentes] = useState<TempoPendente[]>([]);
  const [atribuicoes, setAtribuicoes] = useState<Record<number, string>>({});
  const masterStartRef = useRef<number | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const todasCapturadas = total > 0 && pendentes.length >= total;

  const podeRegistrar =
    pendentes.length > 0 && pendentes.every((p) => atribuicoes[p.ordem] !== undefined);

  const chipsDisponiveis = useMemo(() => {
    const usados = new Set(Object.values(atribuicoes));
    return ids.filter((id) => !usados.has(id));
  }, [ids, atribuicoes]);

  /** Regra do último chip: com exatamente 1 chip livre e 1 pendente sem chip, atribui automaticamente. */
  const aplicarAuto = useCallback(
    (novosPendentes: TempoPendente[], novasAtribuicoes: Record<number, string>) => {
      const usados = new Set(Object.values(novasAtribuicoes));
      const livres = ids.filter((id) => !usados.has(id));
      if (livres.length !== 1) return novasAtribuicoes;
      const semChip = novosPendentes.find((p) => novasAtribuicoes[p.ordem] === undefined);
      if (!semChip) return novasAtribuicoes;
      return { ...novasAtribuicoes, [semChip.ordem]: livres[0] };
    },
    [ids],
  );

  const iniciar = useCallback(() => {
    if (running || total === 0 || todasCapturadas) return;
    masterStartRef.current = Date.now();
    setTempoMestre(0);
    setRunning(true);
  }, [running, total, todasCapturadas]);

  const capturar = useCallback(() => {
    if (!running || masterStartRef.current === null) return;
    if (pendentes.length >= total) return;
    const tempoMs = Date.now() - masterStartRef.current;
    const novos: TempoPendente[] = [...pendentes, { ordem: pendentes.length + 1, tempoMs }];
    setPendentes(novos);
    if (novos.length >= total) {
      setRunning(false);
      mostrarToast('sucesso', 'Todas as chegadas capturadas!');
    }
    setAtribuicoes((prev) => aplicarAuto(novos, prev));
  }, [running, pendentes, total, aplicarAuto, mostrarToast]);

  const zerar = useCallback(() => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
    masterStartRef.current = null;
    setRunning(false);
    setTempoMestre(0);
    setPendentes([]);
    setAtribuicoes({});
  }, []);

  const atribuir = useCallback(
    (ordem: number, atletaId: string) => {
      setAtribuicoes((prev) => {
        const semEste = Object.fromEntries(
          Object.entries(prev).filter(([, id]) => id !== atletaId),
        );
        return aplicarAuto(pendentes, { ...semEste, [ordem]: atletaId });
      });
    },
    [pendentes, aplicarAuto],
  );

  const desatribuir = useCallback((atletaId: string) => {
    setAtribuicoes((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([, id]) => id !== atletaId)),
    );
  }, []);

  const gravar = useCallback(() => {
    let n = 0;
    for (const p of pendentes) {
      const atletaId = atribuicoes[p.ordem];
      if (!atletaId) continue;
      atualizarTempo(atletaId, Number((p.tempoMs / 1000).toFixed(2)));
      n++;
    }
    mostrarToast('sucesso', `${n} tempo(s) registrado(s) no Controle.`);
  }, [pendentes, atribuicoes, atualizarTempo, mostrarToast]);

  useEffect(() => {
    if (!running) {
      if (tickerRef.current) {
        clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
      return;
    }
    const tick = () => {
      const inicio = masterStartRef.current;
      if (inicio !== null) setTempoMestre(Date.now() - inicio);
    };
    tick();
    tickerRef.current = setInterval(tick, 30);
    return () => {
      if (tickerRef.current) {
        clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
    };
  }, [running]);

  return {
    running,
    tempoMestre,
    pendentes,
    atribuicoes,
    chipsDisponiveis,
    total,
    todasCapturadas,
    podeRegistrar,
    iniciar,
    capturar,
    zerar,
    atribuir,
    desatribuir,
    gravar,
  };
}
