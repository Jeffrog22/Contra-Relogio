import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Atleta, EventoHistorico, PeriodoOpcao, Serie } from '../types';
import { balizar } from '../utils/balizamento';
import { calcularMedalha } from '../utils/medalhas';

export interface ToastState {
  tipo: 'sucesso' | 'erro';
  mensagem: string;
}

interface AppState {
  atletas: Atleta[];
  series: Serie[];
  periodo: PeriodoOpcao;
  historico: EventoHistorico[];
  tema: 'light' | 'dark';
  sidebarAberta: boolean;
  toast: ToastState | null;

  processarAtletas: (atletas: Atleta[]) => void;
  limparAtletas: () => void;
  setPeriodo: (periodo: PeriodoOpcao) => void;
  executarBalizamento: () => void;
  atualizarTempoAtleta: (id: string, tempo: number | undefined) => void;
  adicionarHistorico: (eventos: EventoHistorico[]) => void;
  limparHistorico: () => void;
  alternarTema: () => void;
  alternarSidebar: () => void;
  mostrarToast: (tipo: 'sucesso' | 'erro', mensagem: string) => void;
  esconderToast: () => void;
}

let timeoutToast: ReturnType<typeof setTimeout> | undefined;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      atletas: [],
      series: [],
      periodo: 'geral',
      historico: [],
      tema: 'light',
      sidebarAberta: true,
      toast: null,

      processarAtletas: (atletas) => set({ atletas, series: [] }),

      limparAtletas: () => set({ atletas: [], series: [] }),

      setPeriodo: (periodo) => set({ periodo }),

      executarBalizamento: () => {
        const { atletas, periodo } = get();
        if (atletas.length === 0) {
          get().mostrarToast('erro', 'Nenhum atleta carregado. Importe um CSV primeiro.');
          return;
        }
        const series = balizar(atletas, periodo);
        set({ series });
        get().mostrarToast(
          'sucesso',
          `Balizamento executado: ${series.length} série${series.length === 1 ? '' : 's'}.`,
        );
      },

      atualizarTempoAtleta: (id, tempo) =>
        set((estado) => ({
          atletas: estado.atletas.map((atleta) =>
            atleta.id === id
              ? {
                  ...atleta,
                  tempo,
                  medalha: calcularMedalha(tempo, atleta.categoriaOficial, atleta.genero),
                }
              : atleta,
          ),
          series: estado.series.map((serie) => ({
            ...serie,
            atletas: serie.atletas.map((item) =>
              item.atleta.id === id
                ? {
                    ...item,
                    atleta: {
                      ...item.atleta,
                      tempo,
                      medalha: calcularMedalha(
                        tempo,
                        item.atleta.categoriaOficial,
                        item.atleta.genero,
                      ),
                    },
                  }
                : item,
            ),
          })),
        })),

      adicionarHistorico: (eventos) =>
        set((estado) => ({ historico: [...estado.historico, ...eventos] })),

      limparHistorico: () => set({ historico: [] }),

      alternarTema: () => {
        const novo: 'light' | 'dark' = get().tema === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', novo === 'dark');
        localStorage.setItem('festival-tema', novo);
        set({ tema: novo });
      },

      alternarSidebar: () => set((estado) => ({ sidebarAberta: !estado.sidebarAberta })),

      mostrarToast: (tipo, mensagem) => {
        set({ toast: { tipo, mensagem } });
        if (timeoutToast) clearTimeout(timeoutToast);
        timeoutToast = setTimeout(() => set({ toast: null }), 3000);
      },

      esconderToast: () => {
        if (timeoutToast) clearTimeout(timeoutToast);
        set({ toast: null });
      },
    }),
    {
      name: 'festival-storage',
      partialize: (estado) => ({
        atletas: estado.atletas,
        series: estado.series,
        periodo: estado.periodo,
        historico: estado.historico,
        tema: estado.tema,
        sidebarAberta: estado.sidebarAberta,
      }),
    },
  ),
);
