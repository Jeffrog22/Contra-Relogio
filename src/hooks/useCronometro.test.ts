// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useCronometro } from './useCronometro';
import { useAppStore } from '../store/useAppStore';
import { formatTempo } from '../utils/medalhas';
import type { Atleta } from '../types';

function montaAtleta(overrides: Partial<Atleta> = {}): Atleta {
  return {
    id: 'at',
    nome: 'X',
    idade: 10,
    categoriaOficial: 'Mirim',
    categoriaCalculada: 'Mirim',
    genero: 'feminino',
    periodo: 'manhã',
    professor: '',
    nivel: '',
    tempo: undefined,
    medalha: undefined,
    ...overrides,
  };
}

const atletas: Atleta[] = [
  montaAtleta({ id: 'a1', nome: 'Ana' }),
  montaAtleta({ id: 'a2', nome: 'Bruno' }),
];

describe('useCronometro', () => {
  let mockAtualizarTempo: ReturnType<typeof vi.fn>;
  let mockMostrarToast: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAtualizarTempo = vi.fn();
    mockMostrarToast = vi.fn();
    vi.spyOn(useAppStore.getState(), 'atualizarTempoAtleta').mockImplementation(
      mockAtualizarTempo,
    );
    vi.spyOn(useAppStore.getState(), 'mostrarToast').mockImplementation(mockMostrarToast);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('iniciar define running, startedAt de todos e seleciona o primeiro', () => {
    const { result } = renderHook(() => useCronometro(atletas));
    act(() => {
      result.current.iniciar();
    });
    expect(result.current.running).toBe(true);
    expect(result.current.startedAt['a1']).toBeDefined();
    expect(result.current.startedAt['a2']).toBeDefined();
    expect(result.current.selectedId).toBe('a1');
  });

  it('tick avanca o tempo do mestre e das raias', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(1_000_000);
    const { result } = renderHook(() => useCronometro(atletas));
    act(() => {
      result.current.iniciar();
    });
    expect(result.current.tempoMestre).toBe(0);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.tempoMestre).toBeGreaterThanOrEqual(960);
    expect(result.current.tempoMestre).toBeLessThanOrEqual(1000);
    expect(result.current.tempoDoAtleta('a1')).toBeGreaterThanOrEqual(960);
    expect(result.current.tempoDoAtleta('a1')).toBeLessThanOrEqual(1000);
  });

  it('parar grava tempo via store, marca done e avança para o próximo', () => {
    const { result } = renderHook(() => useCronometro(atletas));
    act(() => {
      result.current.iniciar();
    });
    act(() => {
      result.current.parar('a1');
    });
    expect(mockAtualizarTempo).toHaveBeenCalledWith('a1', expect.any(Number));
    expect(mockMostrarToast).toHaveBeenCalledWith('sucesso', 'Tempo de Ana registrado.');
    expect(result.current.done.has('a1')).toBe(true);
    expect(result.current.selectedId).toBe('a2');
  });

  it('parar congela o tempo da raia enquanto o mestre continua', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(1_000_000);
    const { result } = renderHook(() => useCronometro(atletas));
    act(() => {
      result.current.iniciar();
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => {
      result.current.parar('a1');
    });
    expect(mockAtualizarTempo).toHaveBeenCalledWith('a1', 0.5);
    const tempoCongelado = result.current.tempoDoAtleta('a1');
    expect(tempoCongelado).toBe(500);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.tempoDoAtleta('a1')).toBe(tempoCongelado);
    expect(result.current.tempoMestre).toBeGreaterThanOrEqual(1460);
    expect(result.current.running).toBe(true);
  });

  it('parar sem iniciar nao grava nada', () => {
    const { result } = renderHook(() => useCronometro(atletas));
    act(() => {
      result.current.parar('a1');
    });
    expect(mockAtualizarTempo).not.toHaveBeenCalled();
    expect(result.current.done.has('a1')).toBe(false);
  });

  it('todasConcluidas e true apenas quando todos estao done', () => {
    const { result } = renderHook(() => useCronometro(atletas));
    expect(result.current.todasConcluidas()).toBe(false);
    act(() => {
      result.current.iniciar();
    });
    act(() => {
      result.current.parar('a1');
    });
    expect(result.current.todasConcluidas()).toBe(false);
    act(() => {
      result.current.parar('a2');
    });
    expect(result.current.todasConcluidas()).toBe(true);
    expect(result.current.running).toBe(false);
  });

  it('reset limpa estado e para o ticker', () => {
    const { result } = renderHook(() => useCronometro(atletas));
    act(() => {
      result.current.iniciar();
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.running).toBe(false);
    expect(result.current.done.size).toBe(0);
    expect(Object.keys(result.current.startedAt).length).toBe(0);
    expect(result.current.tempoMestre).toBe(0);
  });

  it('formato 00\'\'00 via formatTempo para valores conhecidos', () => {
    expect(formatTempo(34.66)).toBe("34''66");
    expect(formatTempo(5.4)).toBe("05''40");
    expect(formatTempo(0)).toBe('—');
  });
});
