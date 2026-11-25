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
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('iniciar define running e tempoMestre zero', () => {
    const { result } = renderHook(() => useCronometro(atletas));
    act(() => {
      result.current.iniciar();
    });
    expect(result.current.running).toBe(true);
    expect(result.current.tempoMestre).toBeLessThan(50);
    expect(result.current.pendentes).toHaveLength(0);
  });

  it('tick avança o tempo mestre', () => {
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
  });

  it('capturar cria pendente ordinal com o tempo atual e continua rodando', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(1_000_000);
    const { result } = renderHook(() => useCronometro(atletas));
    act(() => {
      result.current.iniciar();
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    act(() => {
      result.current.capturar();
    });
    expect(result.current.pendentes).toHaveLength(1);
    expect(result.current.pendentes[0].ordem).toBe(1);
    expect(result.current.pendentes[0].tempoMs).toBeGreaterThanOrEqual(1460);
    expect(result.current.pendentes[0].tempoMs).toBeLessThanOrEqual(1500);
    expect(result.current.running).toBe(true);
  });

  it('capturar até o total para o cronômetro e avisa', () => {
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
      result.current.capturar();
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    act(() => {
      result.current.capturar();
    });
    expect(result.current.pendentes).toHaveLength(2);
    expect(result.current.pendentes[1].ordem).toBe(2);
    expect(result.current.running).toBe(false);
    expect(result.current.todasCapturadas).toBe(true);
    expect(mockMostrarToast).toHaveBeenCalledWith('sucesso', 'Todas as chegadas capturadas!');
    act(() => {
      result.current.capturar();
    });
    expect(result.current.pendentes).toHaveLength(2);
  });

  it('capturar sem iniciar não cria pendente', () => {
    const { result } = renderHook(() => useCronometro(atletas));
    act(() => {
      result.current.capturar();
    });
    expect(result.current.pendentes).toHaveLength(0);
  });

  it('atribuição manual e auto-atribuição do último chip', () => {
    const { result } = renderHook(() => useCronometro(atletas));
    act(() => {
      result.current.iniciar();
    });
    act(() => {
      result.current.capturar();
    });
    act(() => {
      result.current.capturar();
    });
    act(() => {
      result.current.atribuir(1, 'a1');
    });
    expect(result.current.atribuicoes[1]).toBe('a1');
    expect(result.current.atribuicoes[2]).toBe('a2');
    expect(result.current.chipsDisponiveis).toHaveLength(0);
    expect(result.current.podeRegistrar).toBe(true);
  });

  it('com 3+ chips a atribuição espera o arraste manual', () => {
    const trio: Atleta[] = [
      montaAtleta({ id: 'a1' }),
      montaAtleta({ id: 'a2' }),
      montaAtleta({ id: 'a3' }),
    ];
    const { result } = renderHook(() => useCronometro(trio));
    act(() => {
      result.current.iniciar();
    });
    act(() => {
      result.current.capturar();
    });
    act(() => {
      result.current.capturar();
    });
    act(() => {
      result.current.capturar();
    });
    act(() => {
      result.current.atribuir(1, 'a1');
    });
    expect(result.current.atribuicoes[1]).toBe('a1');
    expect(result.current.atribuicoes[2]).toBeUndefined();
    expect(result.current.chipsDisponiveis).toHaveLength(2);
    expect(result.current.podeRegistrar).toBe(false);
  });

  it('zerar limpa tempo, pendentes e atribuições', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(1_000_000);
    const { result } = renderHook(() => useCronometro(atletas));
    act(() => {
      result.current.iniciar();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      result.current.capturar();
    });
    act(() => {
      result.current.atribuir(1, 'a1');
    });
    act(() => {
      result.current.zerar();
    });
    expect(result.current.running).toBe(false);
    expect(result.current.tempoMestre).toBe(0);
    expect(result.current.pendentes).toHaveLength(0);
    expect(Object.keys(result.current.atribuicoes)).toHaveLength(0);
    expect(result.current.chipsDisponiveis).toHaveLength(2);
  });

  it('gravar registra na store apenas os tempos atribuídos, com 2 casas', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(1_000_000);
    const { result } = renderHook(() => useCronometro(atletas));
    act(() => {
      result.current.iniciar();
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    act(() => {
      result.current.capturar();
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => {
      result.current.capturar();
    });
    act(() => {
      result.current.atribuir(1, 'a1');
    });
    act(() => {
      result.current.gravar();
    });
    expect(mockAtualizarTempo).toHaveBeenCalledTimes(2);
    expect(mockAtualizarTempo).toHaveBeenCalledWith('a1', 1.5);
    expect(mockAtualizarTempo).toHaveBeenCalledWith('a2', 2);
    expect(mockMostrarToast).toHaveBeenCalledWith('sucesso', '2 tempo(s) registrado(s) no Controle.');
  });

  it('podeRegistrar exige pendentes todos atribuídos', () => {
    const { result } = renderHook(() => useCronometro(atletas));
    expect(result.current.podeRegistrar).toBe(false);
    act(() => {
      result.current.iniciar();
    });
    act(() => {
      result.current.capturar();
    });
    act(() => {
      result.current.capturar();
    });
    expect(result.current.podeRegistrar).toBe(false);
    act(() => {
      result.current.atribuir(1, 'a1');
    });
    expect(result.current.podeRegistrar).toBe(true);
  });

  it('formato 00\'\'00 via formatTempo para valores conhecidos', () => {
    expect(formatTempo(34.66)).toBe("34''66");
    expect(formatTempo(5.4)).toBe("05''40");
    expect(formatTempo(0)).toBe('—');
  });
});
