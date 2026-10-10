import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { mascaraTempo, parseTempo, formatTempo } from '../utils/medalhas';
import { Card, CardHeading } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MedalhaBadge } from '../components/ui/MedalhaBadge';
import { TabelaGenerica } from '../components/ui/TabelaGenerica';

function tempoParaMascara(tempo: number | undefined): string {
  if (!tempo) return '';
  return mascaraTempo(tempo.toFixed(2).replace('.', ''));
}

function TempoInput({ atletaId, tempo }: { atletaId: string; tempo?: number }) {
  const atualizarTempo = useAppStore((estado) => estado.atualizarTempoAtleta);
  const [valor, setValor] = useState(() => tempoParaMascara(tempo));

  return (
    <Input
      value={valor}
      onChange={(evento) => {
        const mascarado = mascaraTempo(evento.target.value);
        setValor(mascarado);
        atualizarTempo(atletaId, parseTempo(mascarado));
      }}
      placeholder="00'00"
      inputMode="numeric"
      aria-label="Tempo do atleta"
      className="font-mono tabular-nums w-24"
    />
  );
}

export function ControlePage() {
  const series = useAppStore((estado) => estado.series);
  const atletas = useAppStore((estado) => estado.atletas);

  const linhas = series.flatMap((serie) =>
    serie.atletas.map((item) => ({
      key: `${serie.numero}-${item.atleta.id}`,
      serie: serie.numero,
      aviso: serie.aviso,
      raia: item.raia,
      atleta: item.atleta,
    })),
  );

  const seriesImpressao = series.map((serie) => ({
    numero: serie.numero,
    genero: serie.genero,
    categoria: serie.categoria,
    nivel: serie.nivel,
    atletas: serie.atletas.map((item) => ({
      nome: item.atleta.nome,
      tempo: item.atleta.tempo,
      medalha: item.atleta.medalha,
      categoria: item.atleta.categoriaOficial,
    })),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
        Controle de resultados
      </h1>

      <div className="no-print">
        <Card>
          <CardHeading icone="⏱️" titulo="Lançamento de tempos" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Digite o tempo (formato 00'00) — a medalha é recalculada automaticamente pela tabela de
            índices da categoria.
          </p>

          {linhas.length > 0 ? (
            <TabelaGenerica
              className="mb-4"
              colunas={[
                {
                  chave: 'serie',
                  titulo: 'Série',
                  render: (linha) => (
                    <span className="font-mono tabular-nums">{linha.serie}</span>
                  ),
                },
                {
                  chave: 'baliza',
                  titulo: 'Baliza',
                  render: (linha) => (
                    <span className="font-mono tabular-nums">{linha.raia}</span>
                  ),
                },
                { chave: 'nome', titulo: 'Nome', render: (linha) => linha.atleta.nome },
                {
                  chave: 'tempo',
                  titulo: 'Tempo',
                  render: (linha) => <TempoInput atletaId={linha.atleta.id} tempo={linha.atleta.tempo} />,
                },
                {
                  chave: 'medalha',
                  titulo: 'Medalha',
                  render: (linha) => <MedalhaBadge medalha={linha.atleta.medalha} />,
                },
                {
                  chave: 'categoria',
                  titulo: 'Categoria',
                  render: (linha) => linha.atleta.categoriaOficial,
                },
                { chave: 'nivel', titulo: 'Nível', render: (linha) => linha.atleta.nivel },
              ]}
              itens={linhas}
              chaveItem={(linha) => linha.key}
              vazio="Nenhuma série. Execute o balizamento primeiro."
            />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {atletas.length === 0 ? (
                <>
                  Nenhum atleta carregado.{' '}
                  <Link className="text-primary-600 dark:text-primary-400 underline" to="/carregar">
                    Importe um CSV
                  </Link>{' '}
                  e execute o balizamento.
                </>
              ) : (
                <>
                  Execute o balizamento na{' '}
                  <Link
                    className="text-primary-600 dark:text-primary-400 underline"
                    to="/balizamento"
                  >
                    tela de Balizamento
                  </Link>{' '}
                  para lançar os tempos.
                </>
              )}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => window.print()}
              disabled={linhas.length === 0}
              className="disabled:opacity-50"
            >
              Imprimir Resultados
            </Button>
          </div>
        </Card>
      </div>

      <div className="hidden print:block print-area">
        <h1 className="text-xl font-semibold mb-4">Resultados — Festival Interno PPt</h1>
        {seriesImpressao.map((serie) => (
          <div key={serie.numero} className="mb-6">
            <h2 className="text-lg font-semibold mb-2">
              Série {serie.numero} — {serie.genero} • {serie.categoria} • {serie.nivel}
            </h2>
            <table className="min-w-full text-sm border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-1 text-left">Nome</th>
                  <th className="px-3 py-1 text-left">Tempo</th>
                  <th className="px-3 py-1 text-left">Medalha</th>
                  <th className="px-3 py-1 text-left">Categoria</th>
                </tr>
              </thead>
              <tbody>
                {serie.atletas.map((atleta) => (
                  <tr key={atleta.nome} className="border-t border-gray-200">
                    <td className="px-3 py-1">{atleta.nome}</td>
                    <td className="px-3 py-1 font-mono tabular-nums">{formatTempo(atleta.tempo)}</td>
                    <td className="px-3 py-1">{atleta.medalha ?? 'Sem Tempo'}</td>
                    <td className="px-3 py-1">{atleta.categoria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
