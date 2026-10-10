import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { exportCSV } from '../utils/csv';
import { formatTempo } from '../utils/medalhas';
import { Card, CardHeading } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { TabelaGenerica } from '../components/ui/TabelaGenerica';

export function ListaPage() {
  const atletas = useAppStore((estado) => estado.atletas);
  const mostrarToast = useAppStore((estado) => estado.mostrarToast);
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return atletas;
    return atletas.filter((atleta) => atleta.nome.toLowerCase().includes(termo));
  }, [atletas, busca]);

  function exportar() {
    if (filtrados.length === 0) {
      mostrarToast('erro', 'Nada a exportar.');
      return;
    }
    exportCSV(
      'listagem-festival.csv',
      [
        'nome',
        'idade',
        'categoria',
        'genero',
        'horario',
        'professor',
        'nivel',
        'tempo',
        'medalha',
      ],
      filtrados.map((a) => [
        a.nome,
        a.idade,
        a.categoriaOficial,
        a.genero,
        a.periodo,
        a.professor,
        a.nivel,
        a.tempo ?? '',
        a.medalha ?? 'Sem Tempo',
      ]),
    );
    mostrarToast('sucesso', `Exportados ${filtrados.length} atleta(s).`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Listagem geral</h1>

      <Card>
        <CardHeading icone="🏊" titulo="Atletas cadastrados" />

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-full max-w-xs">
            <SearchInput valor={busca} onChange={setBusca} placeholder="Buscar por nome..." />
          </div>
          <Button variante="secondary" onClick={exportar}>
            Exportar CSV
          </Button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {filtrados.length} de {atletas.length} atleta(s)
          </span>
        </div>

        <TabelaGenerica
          colunas={[
            { chave: 'nome', titulo: 'Nome', render: (a) => a.nome },
            {
              chave: 'idade',
              titulo: 'Idade',
              render: (a) => <span className="font-mono tabular-nums">{a.idade}</span>,
            },
            {
              chave: 'categoria',
              titulo: 'Categoria',
              render: (a) => <span>{a.categoriaOficial}</span>,
            },
            { chave: 'genero', titulo: 'Gênero', render: (a) => a.genero },
            { chave: 'horario', titulo: 'Horário', render: (a) => a.periodo },
            { chave: 'professor', titulo: 'Professor', render: (a) => a.professor },
            { chave: 'nivel', titulo: 'Nível', render: (a) => a.nivel },
            {
              chave: 'tempo',
              titulo: 'Tempo',
              render: (a) => <span className="font-mono tabular-nums">{formatTempo(a.tempo)}</span>,
            },
          ]}
          itens={filtrados}
          chaveItem={(a) => a.id}
          vazio={
            atletas.length === 0 ? (
              <>
                Nenhum atleta processado.{' '}
                <Link className="text-primary-600 dark:text-primary-400 underline" to="/carregar">
                  Carregue um CSV
                </Link>
                .
              </>
            ) : (
              'Nenhum atleta corresponde à busca.'
            )
          }
        />
      </Card>
    </div>
  );
}
