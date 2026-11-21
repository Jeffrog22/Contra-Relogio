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
import { categoriaPorIdade, normalizarCategoria } from '../utils/categorias';
import { calcularMedalha } from '../utils/medalhas';
import { gerarId } from '../utils/csv';
import type { DadosCompartilhados } from '../utils/compartilhar';

export interface ToastState {
  tipo: 'sucesso' | 'erro';
  mensagem: string;
}

export type DestinoLista = 'festival' | 'apresentacao';

function aplicarAtualizacao(atual: Atleta, campos: Partial<Atleta>): Atleta | null {
  const atualizado: Atleta = { ...atual, ...campos };

  if (campos.categoriaOficial !== undefined) {
    const normalizada = normalizarCategoria(String(campos.categoriaOficial));
    if (!normalizada) return null;
    atualizado.categoriaOficial = normalizada;
  }

  if ('tempo' in campos || 'categoriaOficial' in campos || 'genero' in campos) {
    atualizado.medalha = calcularMedalha(
      atualizado.tempo,
      atualizado.categoriaOficial,
      atualizado.genero,
    );
  }

  return atualizado;
}

interface AppState {
  atletas: Atleta[];
  atletasApresentacao: Atleta[];
  series: Serie[];
  periodo: PeriodoOpcao;
  generoBalizamento: GeneroOpcao;
  historico: EventoHistorico[];
  tema: 'light' | 'dark';
  sidebarAberta: boolean;
  toast: ToastState | null;

  processarAtletas: (atletas: Atleta[]) => void;
  processarApresentacao: (atletas: Atleta[]) => void;
  importarCompartilhado: (dados: DadosCompartilhados) => void;
  limparAtletas: (destino?: DestinoLista) => void;
  adicionarAtleta: (
    dados: Omit<Atleta, 'id' | 'categoriaCalculada' | 'medalha'>,
    destino?: DestinoLista,
  ) => boolean;
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
      atletasApresentacao: [],
      series: [],
      periodo: 'geral',
      generoBalizamento: 'todos',
      historico: [],
      tema: 'light',
      sidebarAberta: true,
      toast: null,

      processarAtletas: (atletas) => set({ atletas, series: [] }),

      processarApresentacao: (atletas) => set({ atletasApresentacao: atletas }),

      importarCompartilhado: (dados) =>
        set({
          atletas: dados.atletas,
          atletasApresentacao: dados.atletasApresentacao,
          series: dados.series,
          periodo: dados.periodo,
          generoBalizamento: dados.generoBalizamento,
          historico: dados.historico,
        }),

      limparAtletas: (destino = 'festival') =>
        destino === 'festival'
          ? set({ atletas: [], series: [] })
          : set({ atletasApresentacao: [] }),

      adicionarAtleta: (dados, destino = 'festival') => {
        const estado = get();
        const nome = dados.nome.trim();
        const normalizada = normalizarCategoria(String(dados.categoriaOficial));
        if (!normalizada) {
          get().mostrarToast('erro', 'Categoria inválida.');
          return false;
        }

        const base = destino === 'apresentacao' ? estado.atletasApresentacao : estado.atletas;
        const duplicado = base.some(
          (atleta) => atleta.nome.trim().toLowerCase() === nome.toLowerCase(),
        );
        if (duplicado) {
          get().mostrarToast('erro', `Já existe um atleta chamado "${nome}".`);
          return false;
        }

        const novo: Atleta = {
          ...dados,
          id: gerarId(),
          nome,
          categoriaOficial: normalizada,
          categoriaCalculada: categoriaPorIdade(dados.idade),
          medalha: calcularMedalha(dados.tempo, normalizada, dados.genero),
        };

        if (destino === 'apresentacao') {
          set({ atletasApresentacao: [...estado.atletasApresentacao, novo] });
          return true;
        }

        const atletas = [...estado.atletas, novo];
        const series =
          estado.series.length > 0
            ? balizar(atletas, estado.periodo, estado.generoBalizamento)
            : estado.series;

        set({ atletas, series });
        return true;
      },

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
          if (!atual) {
            const atualApresentacao = estado.atletasApresentacao.find(
              (atleta) => atleta.id === id,
            );
            if (!atualApresentacao) return {};
            const atualizadoApresentacao = aplicarAtualizacao(atualApresentacao, campos);
            if (!atualizadoApresentacao) return {};
            return {
              atletasApresentacao: estado.atletasApresentacao.map((atleta) =>
                atleta.id === id ? atualizadoApresentacao : atleta,
              ),
            };
          }

          const atualizado = aplicarAtualizacao(atual, campos);
          if (!atualizado) return {};

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
        atletasApresentacao: estado.atletasApresentacao,
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
