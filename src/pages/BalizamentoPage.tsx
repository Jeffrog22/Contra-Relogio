import { Link } from 'react-router-dom';
import type { AtletaSerie } from '../types';
import type { PeriodoOpcao } from '../types';
import { useAppStore } from '../store/useAppStore';
import { formatTempo } from '../utils/medalhas';
import { Card, CardHeading } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { TabelaGenerica } from '../components/ui/TabelaGenerica';
import { MedalhaBadge } from '../components/ui/MedalhaBadge';
import { Badge } from '../components/ui/Badge';

interface LinhaTabela {
  serie: number;
  aviso?: string;
  raia: 1 | 2 | 3 | 4;
  item: AtletaSerie;
}

const PERIODOS: { valor: PeriodoOpcao; rotulo: string }[] = [
  { valor: 'manhã', rotulo: 'Manhã' },
  { valor: 'tarde', rotulo: 'Tarde' },
  { valor: 'geral', rotulo: 'Geral' },
];

export function BalizamentoPage() {
  const atletas = useAppStore((estado) => estado.atletas);
  const series = useAppStore((estado) => estado.series);
  const periodo = useAppStore((estado) => estado.periodo);
  const setPeriodo = useAppStore((estado) => estado.setPeriodo);
  const executarBalizamento = useAppStore((estado) => estado.executarBalizamento);

  const linhas: LinhaTabela[] = series.flatMap((serie) =>
    serie.atletas.map((item) => ({
      serie: serie.numero,
      aviso: serie.aviso,
      raia: item.raia,
      item,
    })),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Balizamento</h1>

      <Card>
        <CardHeading icone="🏁" titulo="Gerar balizamento" />
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
          <Button onClick={executarBalizamento}>Executar Balizamento</Button>
          {atletas.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {atletas.length} atleta(s) • {series.length} série(s)
            </span>
          )}
        </div>

        {series.length > 0 ? (
          <TabelaGenerica
            colunas={[
              {
                chave: 'serie',
                titulo: 'Série',
                render: (linha) => (
                  <span className="font-mono tabular-nums">
                    {linha.serie}
                    {linha.aviso && (
                      <Badge tom={linha.aviso.includes('incompleta') ? 'vermelho' : 'azul'}>
                        <span className="ml-1">{linha.aviso}</span>
                      </Badge>
                    )}
                  </span>
                ),
              },
              {
                chave: 'baliza',
                titulo: 'Baliza',
                render: (linha) => (
                  <span className="font-mono tabular-nums">{linha.raia}</span>
                ),
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
            ]}
            itens={linhas}
            chaveItem={(linha) => `${linha.serie}-${linha.item.atleta.id}`}
            vazio="Nenhuma série gerada."
          />
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
              'Escolha o período e clique em "Executar Balizamento".'
            )}
          </p>
        )}
      </Card>
    </div>
  );
}
