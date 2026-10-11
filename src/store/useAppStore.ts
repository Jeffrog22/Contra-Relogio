import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Atleta,
  EventoHistorico,
  GeneroOpcao,
  PeriodoOpcao,
  Serie,
} from '../types';
import { balizar, reatribuirRaias } from '../utils/balizamento';
import { normalizarCategoria } from '../utils/categorias';
import { calcularMedalha } from '../utils/medalhas';

export interface ToastState {
  tipo: 'sucesso' | 'erro';
  mensagem: string;
}

interface AppState {
  atletas: Atleta[];
  series: Serie[];
  periodo: PeriodoOpcao;
  generoBalizamento: GeneroOpcao;
  historico: EventoHistorico[];
  tema: 'light' | 'dark';
  sidebarAberta: boolean;
  toast: ToastState | null;

  processarAtletas: (atletas: Atleta[]) => void;
  limparAtletas: () => void;
  setPeriodo: (periodo: PeriodoOpcao) => void;
  setGeneroBalizamento: (genero: GeneroOpcao) => void;
  executarBalizamento: (silencioso?: boolean) => void;
  atualizarAtleta: (id: string, campos: Partial<Atleta>) => void;
  atualizarTempoAtleta: (id: string, tempo: number | undefined) => void;
  removerAtletaDaSerie: (serieNumero: number, atletaId: string) => void;
  reordenarSeries: (novasSeries: Serie[]) => void;
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
      generoBalizamento: 'todos',
      historico: [],
      tema: 'light',
      sidebarAberta: true,
      toast: null,

      processarAtletas: (atletas) => set({ atletas, series: [] }),

      limparAtletas: () => set({ atletas: [], series: [] }),

      setPeriodo: (periodo) => {
        set({ periodo });
        const { atletas, generoBalizamento } = get();
        if (atletas.length > 0) {
          set({ series: balizar(atletas, periodo, generoBalizamento) });
        }
      },

      setGeneroBalizamento: (genero) => {
        set({ generoBalizamento: genero });
        const { atletas, periodo } = get();
        if (atletas.length > 0) {
          set({ series: balizar(atletas, periodo, genero) });
        }
      },

      executarBalizamento: (silencioso = false) => {
        const { atletas, periodo, generoBalizamento } = get();
        if (atletas.length === 0) {
          if (!silencioso) {
            get().mostrarToast('erro', 'Nenhum atleta carregado. Importe um CSV primeiro.');
          }
          return;
        }
        const series = balizar(atletas, periodo, generoBalizamento);
        set({ series });
        if (!silencioso) {
          get().mostrarToast(
            'sucesso',
            `Balizamento atualizado: ${series.length} série${series.length === 1 ? '' : 's'}.`,
          );
        }
      },

      atualizarAtleta: (id, campos) =>
        set((estado) => {
          const atual = estado.atletas.find((atleta) => atleta.id === id);
          if (!atual) return {};

          const atualizado: Atleta = { ...atual, ...campos };

          if (campos.categoriaOficial !== undefined) {
            const normalizada = normalizarCategoria(String(campos.categoriaOficial));
            if (!normalizada) return {};
            atualizado.categoriaOficial = normalizada;
          }

          if ('tempo' in campos || 'categoriaOficial' in campos || 'genero' in campos) {
            atualizado.medalha = calcularMedalha(
              atualizado.tempo,
              atualizado.categoriaOficial,
              atualizado.genero,
            );
          }

          return {
            atletas: estado.atletas.map((atleta) => (atleta.id === id ? atualizado : atleta)),
            series: estado.series.map((serie) => ({
              ...serie,
              atletas: serie.atletas.map((item) =>
                item.atleta.id === id ? { ...item, atleta: atualizado } : item,
              ),
            })),
          };
        }),

      atualizarTempoAtleta: (id, tempo) => get().atualizarAtleta(id, { tempo }),

      removerAtletaDaSerie: (serieNumero, atletaId) =>
        set((estado) => ({
          series: estado.series.map((serie) =>
            serie.numero === serieNumero
              ? reatribuirRaias({
                  ...serie,
                  atletas: serie.atletas.filter((item) => item.atleta.id !== atletaId),
                })
              : serie,
          ),
        })),

      reordenarSeries: (novasSeries) =>
        set({ series: novasSeries.map((serie) => reatribuirRaias(serie)) }),

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
        generoBalizamento: estado.generoBalizamento,
        historico: estado.historico,
        tema: estado.tema,
        sidebarAberta: estado.sidebarAberta,
      }),
    },
  ),
);
