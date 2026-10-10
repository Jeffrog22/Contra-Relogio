import { useMemo, useState } from 'react';
import type { EventoHistorico, Genero, Medalha } from '../types';
import { useAppStore } from '../store/useAppStore';
import { parseCSVHistorico } from '../utils/csv';
import { formatTempo } from '../utils/medalhas';
import { CATEGORIAS } from '../utils/categorias';
import { Card, CardDescricao, CardHeading } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { SearchInput } from '../components/ui/SearchInput';
import { MedalhaBadge } from '../components/ui/MedalhaBadge';
import { TabelaGenerica } from '../components/ui/TabelaGenerica';

const MEDALHAS: (Medalha | 'todas')[] = ['todas', 'OURO', 'PRATA', 'BRONZE', 'Sem Tempo'];
const GENEROS: (Genero | 'todos')[] = ['todos', 'feminino', 'masculino'];

interface Panorama {
  aluno: string;
  genero?: Genero;
  porAno: Map<number, EventoHistorico>;
}

export function AnalisePage() {
  const historico = useAppStore((estado) => estado.historico);
  const adicionarHistorico = useAppStore((estado) => estado.adicionarHistorico);
  const limparHistorico = useAppStore((estado) => estado.limparHistorico);
  const mostrarToast = useAppStore((estado) => estado.mostrarToast);

  const [busca, setBusca] = useState('');
  const [medalha, setMedalha] = useState<Medalha | 'todas'>('todas');
  const [ano, setAno] = useState<number | 'todos'>('todos');
  const [categoria, setCategoria] = useState<string>('todas');
  const [genero, setGenero] = useState<Genero | 'todos'>('todos');

  async function lerArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    const texto = await arquivo.text();
    const { eventos, erros } = parseCSVHistorico(texto);

    if (erros.length > 0) {
      mostrarToast('erro', `Histórico com ${erros.length} erro(s). Corrija e reenvie.`);
      return;
    }
    if (eventos.length === 0) {
      mostrarToast('erro', 'Nenhum evento encontrado no arquivo.');
      return;
    }
    adicionarHistorico(eventos);
    mostrarToast('sucesso', `${eventos.length} registro(s) histórico(s) adicionado(s).`);
  }

  const anos = useMemo(
    () => [...new Set(historico.map((evento) => evento.ano))].sort((a, b) => a - b),
    [historico],
  );

  const categoriasPresentes = useMemo(() => {
    const presentes = new Set(historico.map((evento) => evento.categoria));
    return CATEGORIAS.filter((cat) => presentes.has(cat));
  }, [historico]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return historico.filter((evento) => {
      if (termo && !evento.aluno.toLowerCase().includes(termo)) return false;
      if (medalha !== 'todas' && evento.medalha !== medalha) return false;
      if (ano !== 'todos' && evento.ano !== ano) return false;
      if (categoria !== 'todas' && evento.categoria !== categoria) return false;
      if (genero !== 'todos' && evento.genero !== undefined && evento.genero !== genero)
        return false;
      return true;
    });
  }, [historico, busca, medalha, ano, categoria, genero]);

  const panorama: Panorama[] = useMemo(() => {
    const mapa = new Map<string, Panorama>();
    for (const evento of filtrados) {
      const entrada = mapa.get(evento.aluno);
      if (entrada) {
        entrada.porAno.set(evento.ano, evento);
      } else {
        mapa.set(evento.aluno, {
          aluno: evento.aluno,
          genero: evento.genero,
          porAno: new Map([[evento.ano, evento]]),
        });
      }
    }
    return [...mapa.values()].sort((a, b) => a.aluno.localeCompare(b.aluno, 'pt-BR'));
  }, [filtrados]);

  const colunasPanorama = [
    {
      chave: 'aluno',
      titulo: 'Aluno',
      render: (linha: Panorama) => linha.aluno,
    },
    {
      chave: 'genero',
      titulo: 'Gênero',
      render: (linha: Panorama) => linha.genero ?? '—',
    },
    ...anos.map((anoColuna) => ({
      chave: `ano-${anoColuna}`,
      titulo: String(anoColuna),
      render: (linha: Panorama) => {
        const evento = linha.porAno.get(anoColuna);
        if (!evento) return <span className="text-gray-400 dark:text-gray-500">—</span>;
        return (
          <span className="flex flex-col gap-1">
            <span className="font-mono tabular-nums text-xs">{formatTempo(evento.tempo)}</span>
            <MedalhaBadge medalha={evento.medalha} />
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{evento.categoria}</span>
          </span>
        );
      },
    })),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
        Análise comparativa
      </h1>

      <Card>
        <CardHeading icone="📤" titulo="Upload de CSVs históricos" />
        <CardDescricao>
          Colunas: <b>ano, aluno, tempo, medalha, categoria</b> — e opcional <b>genero</b>. Você
          pode enviar vários arquivos; eles são somados ao histórico.
        </CardDescricao>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(evento) => lerArquivo(evento.target.files?.[0])}
            className="text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:px-4 file:py-2 file:rounded-md file:border-0 file:text-sm file:bg-primary-600 file:text-white hover:file:bg-primary-700 file:transition-colors"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {historico.length} registro(s) • {anos.length} edição(ões)
          </span>
          {historico.length > 0 && (
            <Button variante="secondary" onClick={limparHistorico}>
              Limpar histórico
            </Button>
          )}
        </div>
      </Card>

      {historico.length > 0 && (
        <Card>
          <CardHeading icone="🔎" titulo="Filtros" />
          <div className="space-y-3 mb-4">
            <div className="w-full max-w-xs">
              <SearchInput valor={busca} onChange={setBusca} placeholder="Buscar atleta..." />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Medalha
              </span>
              {MEDALHAS.map((opcao) => (
                <Pill
                  key={opcao}
                  ativo={medalha === opcao}
                  onClick={() => setMedalha(opcao)}
                  className="!px-3 !py-1 !text-xs"
                >
                  {opcao}
                </Pill>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Ano
              </span>
              <Pill ativo={ano === 'todos'} onClick={() => setAno('todos')} className="!px-3 !py-1 !text-xs">
                Todos
              </Pill>
              {anos.map((opcao) => (
                <Pill
                  key={opcao}
                  ativo={ano === opcao}
                  onClick={() => setAno(opcao)}
                  className="!px-3 !py-1 !text-xs"
                >
                  {opcao}
                </Pill>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Categoria
              </span>
              <Pill
                ativo={categoria === 'todas'}
                onClick={() => setCategoria('todas')}
                className="!px-3 !py-1 !text-xs"
              >
                Todas
              </Pill>
              {categoriasPresentes.map((opcao) => (
                <Pill
                  key={opcao}
                  ativo={categoria === opcao}
                  onClick={() => setCategoria(opcao)}
                  className="!px-3 !py-1 !text-xs"
                >
                  {opcao}
                </Pill>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Gênero
              </span>
              {GENEROS.map((opcao) => (
                <Pill
                  key={opcao}
                  ativo={genero === opcao}
                  onClick={() => setGenero(opcao)}
                  className="!px-3 !py-1 !text-xs"
                >
                  {opcao}
                </Pill>
              ))}
            </div>
          </div>

          <div className="no-print mb-4">
            <Button onClick={() => window.print()} disabled={panorama.length === 0} className="disabled:opacity-50">
              Imprimir Resultados Filtrados
            </Button>
            <span className="ml-3 text-xs text-gray-500 dark:text-gray-400">
              {filtrados.length} registro(s) em {panorama.length} atleta(s)
            </span>
          </div>

          <div className="print-area">
            <TabelaGenerica
              colunas={colunasPanorama}
              itens={panorama}
              chaveItem={(linha) => linha.aluno}
              vazio="Nenhum registro corresponde aos filtros."
            />
          </div>
        </Card>
      )}

      {historico.length === 0 && (
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Envie pelo menos um CSV histórico para começar a análise comparativa.
          </p>
        </Card>
      )}
    </div>
  );
}
