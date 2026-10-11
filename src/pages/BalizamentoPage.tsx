import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AtletaSerie, GeneroOpcao, PeriodoOpcao } from '../types';
import { useAppStore } from '../store/useAppStore';
import { formatTempo } from '../utils/medalhas';
import { Card, CardHeading } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { TabelaGenerica, type Coluna } from '../components/ui/TabelaGenerica';
import { MedalhaBadge } from '../components/ui/MedalhaBadge';

interface LinhaTabela {
  id: string;
  serie: number;
  raia: 1 | 2 | 3 | 4;
  item: AtletaSerie;
}

const PERIODOS: { valor: PeriodoOpcao; rotulo: string }[] = [
  { valor: 'manhã', rotulo: 'Manhã' },
  { valor: 'tarde', rotulo: 'Tarde' },
  { valor: 'geral', rotulo: 'Geral' },
];

const GENEROS: { valor: GeneroOpcao; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'feminino', rotulo: 'Feminino' },
  { valor: 'masculino', rotulo: 'Masculino' },
];

const CHIP_CLASSE = '!px-3 !py-1 !text-xs';
const LINHA_CLASSE =
  'hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800';

interface LinhaSorteavelProps {
  linha: LinhaTabela;
  celulas: ReactNode[];
}

function LinhaSorteavel({ linha, celulas }: LinhaSorteavelProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: linha.id,
  });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${LINHA_CLASSE} cursor-grab active:cursor-grabbing${
        isDragging ? ' opacity-60 bg-primary-50 dark:bg-primary-900/20 relative z-10' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      {celulas}
    </tr>
  );
}

export function BalizamentoPage() {
  const atletas = useAppStore((estado) => estado.atletas);
  const series = useAppStore((estado) => estado.series);
  const periodo = useAppStore((estado) => estado.periodo);
  const setPeriodo = useAppStore((estado) => estado.setPeriodo);
  const genero = useAppStore((estado) => estado.generoBalizamento);
  const setGenero = useAppStore((estado) => estado.setGeneroBalizamento);
  const executarBalizamento = useAppStore((estado) => estado.executarBalizamento);
  const removerAtletaDaSerie = useAppStore((estado) => estado.removerAtletaDaSerie);
  const reordenarSeries = useAppStore((estado) => estado.reordenarSeries);
  const mostrarToast = useAppStore((estado) => estado.mostrarToast);

  const [modoEdicao, setModoEdicao] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    const estado = useAppStore.getState();
    if (estado.atletas.length > 0 && estado.series.length === 0) {
      estado.executarBalizamento(true);
    }
  }, []);

  const linhas: LinhaTabela[] = series.flatMap((serie) =>
    serie.atletas.map((item) => ({
      id: `${serie.numero}-${item.atleta.id}`,
      serie: serie.numero,
      raia: item.raia,
      item,
    })),
  );

  function remover(linha: LinhaTabela) {
    removerAtletaDaSerie(linha.serie, linha.item.atleta.id);
    mostrarToast(
      'sucesso',
      `${linha.item.atleta.nome} excluído da série ${linha.serie} (seguirá no balizamento ao atualizar).`,
    );
  }

  function aoTerminarDrag({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const linhaAtiva = linhas.find((linha) => linha.id === String(active.id));
    const linhaOver = linhas.find((linha) => linha.id === String(over.id));
    if (!linhaAtiva || !linhaOver) return;

    if (linhaAtiva.serie === linhaOver.serie) {
      const novas = series.map((serie) => {
        if (serie.numero !== linhaAtiva.serie) return serie;
        const de = serie.atletas.findIndex((i) => i.atleta.id === linhaAtiva.item.atleta.id);
        const para = serie.atletas.findIndex((i) => i.atleta.id === linhaOver.item.atleta.id);
        if (de < 0 || para < 0) return serie;
        return { ...serie, atletas: arrayMove(serie.atletas, de, para) };
      });
      reordenarSeries(novas);
      return;
    }

    const novas = series
      .map((serie) => {
        if (serie.numero === linhaAtiva.serie) {
          return {
            ...serie,
            atletas: serie.atletas.filter((i) => i.atleta.id !== linhaAtiva.item.atleta.id),
          };
        }
        if (serie.numero === linhaOver.serie) {
          const alvo = serie.atletas.findIndex((i) => i.atleta.id === linhaOver.item.atleta.id);
          const copia = [...serie.atletas];
          if (alvo >= 0) copia.splice(alvo, 0, linhaAtiva.item);
          else copia.push(linhaAtiva.item);
          return { ...serie, atletas: copia };
        }
        return serie;
      })
      .filter((serie) => serie.atletas.length > 0);

    reordenarSeries(novas);
  }

  const colunas: Coluna<LinhaTabela>[] = [
    {
      chave: 'serie',
      titulo: 'Série',
      render: (linha) => <span className="font-mono tabular-nums">{linha.serie}</span>,
    },
    {
      chave: 'baliza',
      titulo: 'Baliza',
      render: (linha) => <span className="font-mono tabular-nums">{linha.raia}</span>,
    },
    {
      chave: 'professor',
      titulo: 'Professor',
      render: (linha) => linha.item.atleta.professor,
    },
    { chave: 'nome', titulo: 'Nome', render: (linha) => linha.item.atleta.nome },
    {
      chave: 'tempo',
      titulo: 'Tempo',
      render: (linha) => (
        <span className="font-mono tabular-nums">
          {formatTempo(linha.item.atleta.tempo)}
        </span>
      ),
    },
    {
      chave: 'medalha',
      titulo: 'Medalha',
      render: (linha) => <MedalhaBadge medalha={linha.item.atleta.medalha} />,
    },
    {
      chave: 'categoria',
      titulo: 'Categoria',
      render: (linha) => linha.item.atleta.categoriaOficial,
    },
    { chave: 'nivel', titulo: 'Nível', render: (linha) => linha.item.atleta.nivel },
    ...(modoEdicao
      ? [
          {
            chave: 'acoes',
            titulo: 'Ações',
            render: (linha: LinhaTabela) => (
              <Button
                variante="ghost"
                aria-label={`Excluir ${linha.item.atleta.nome} do balizamento`}
                title="Excluir do balizamento"
                className="!text-red-500 hover:!text-red-700 dark:!text-red-400"
                onClick={() => remover(linha)}
              >
                ✕
              </Button>
            ),
          },
        ]
      : []),
  ];

  const tabela = (
    <TabelaGenerica
      colunas={colunas}
      itens={linhas}
      chaveItem={(linha) => linha.id}
      renderLinha={
        modoEdicao
          ? (linha, celulas) => <LinhaSorteavel key={linha.id} linha={linha} celulas={celulas} />
          : undefined
      }
      vazio="Nenhuma série gerada."
    />
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Balizamento</h1>

      <Card>
        <CardHeading icone="🏁" titulo="Gerar balizamento" />

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Gênero
          </span>
          {GENEROS.map((opcao) => (
            <Pill
              key={opcao.valor}
              ativo={genero === opcao.valor}
              onClick={() => setGenero(opcao.valor)}
              className={CHIP_CLASSE}
            >
              {opcao.rotulo}
            </Pill>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {PERIODOS.map((opcao) => (
            <Pill
              key={opcao.valor}
              ativo={periodo === opcao.valor}
              onClick={() => setPeriodo(opcao.valor)}
            >
              {opcao.rotulo}
            </Pill>
          ))}
          <Button onClick={() => executarBalizamento()}>Atualizar</Button>
          {atletas.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {atletas.length} atleta(s) • {series.length} série(s)
            </span>
          )}
        </div>

        {series.length > 0 && (
          <div className="flex justify-end mb-2">
            <Button
              variante={modoEdicao ? 'primary' : 'secondary'}
              aria-pressed={modoEdicao}
              title="Reordenar (arraste) e excluir atletas do balizamento"
              onClick={() => setModoEdicao((atual) => !atual)}
            >
              {modoEdicao ? '✔ Concluir edição' : '✏️ Editar balizamento'}
            </Button>
          </div>
        )}

        {series.length > 0 ? (
          modoEdicao ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={aoTerminarDrag}
            >
              <SortableContext
                items={linhas.map((linha) => linha.id)}
                strategy={verticalListSortingStrategy}
              >
                {tabela}
              </SortableContext>
            </DndContext>
          ) : (
            tabela
          )
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {atletas.length === 0 ? (
              <>
                Nenhum atleta carregado.{' '}
                <Link className="text-primary-600 dark:text-primary-400 underline" to="/carregar">
                  Importe um CSV
                </Link>{' '}
                antes de executar o balizamento.
              </>
            ) : (
              'Nenhum atleta corresponde aos filtros de período e gênero atuais.'
            )}
          </p>
        )}
      </Card>
    </div>
  );
}
