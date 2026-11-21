import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Atleta, Categoria, Genero, Periodo } from '../types';
import { useAppStore } from '../store/useAppStore';
import { exportCSV } from '../utils/csv';
import { formatTempo, parseTempo } from '../utils/medalhas';
import { CATEGORIAS } from '../utils/categorias';
import { Card, CardHeading } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { InputMascaraTempo } from '../components/ui/InputMascaraTempo';
import { Modal } from '../components/ui/Modal';
import { Pill } from '../components/ui/Pill';
import { SearchInput } from '../components/ui/SearchInput';
import { TabelaGenerica } from '../components/ui/TabelaGenerica';

type Campo =
  | 'nome'
  | 'idade'
  | 'categoriaOficial'
  | 'genero'
  | 'periodo'
  | 'professor'
  | 'nivel'
  | 'tipo';

type Edicao = { id: string; campo: Campo };

type Ordenacao = { campo: Campo; direcao: 'asc' | 'desc' };

const GENEROS: (Genero | 'todos')[] = ['todos', 'feminino', 'masculino'];

const ORDEM_PERIODOS: Periodo[] = ['manhã', 'tarde'];

const INPUT_CLASSE =
  'px-1 py-0.5 text-sm rounded border border-primary-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 outline-none';

interface FormAtleta {
  nome: string;
  idade: string;
  categoria: Categoria;
  genero: Genero;
  periodo: Periodo;
  professor: string;
  nivel: string;
  tipo: 'Crawl c/ prancha' | 'Crawl s/ prancha';
  tempo: string;
}

const FORM_VAZIO: FormAtleta = {
  nome: '',
  idade: '',
  categoria: 'Mirim',
  genero: 'feminino',
  periodo: 'manhã',
  professor: '',
  nivel: '',
  tipo: 'Crawl c/ prancha',
  tempo: '',
};

const SELECT_CLASSE =
  'w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

export function ListaApresentacaoPage() {
  const atletas = useAppStore((estado) => estado.atletasApresentacao);
  const atualizarAtleta = useAppStore((estado) => estado.atualizarAtleta);
  const adicionarAtleta = useAppStore((estado) => estado.adicionarAtleta);
  const mostrarToast = useAppStore((estado) => estado.mostrarToast);

  const [busca, setBusca] = useState('');
  const [nivel, setNivel] = useState<string>('todos');
  const [genero, setGenero] = useState<Genero | 'todos'>('todos');
  const [tipo, setTipo] = useState<string>('todos');
  const [periodoFiltro, setPeriodoFiltro] = useState<Periodo | 'todos'>('todos');
  const [ordenacao, setOrdenacao] = useState<Ordenacao>({ campo: 'nome', direcao: 'asc' });
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [rascunho, setRascunho] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState<FormAtleta>(FORM_VAZIO);

  function alterarForm<K extends keyof FormAtleta>(campo: K, valor: FormAtleta[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function abrirModal() {
    setForm(FORM_VAZIO);
    setModalAberto(true);
  }

  function confirmarAdicao() {
    const nome = form.nome.trim();
    if (!nome) {
      mostrarToast('erro', 'O nome não pode ficar vazio.');
      return;
    }

    const idade = Number(form.idade.replace(',', '.'));
    if (!Number.isInteger(idade) || idade < 1 || idade > 99) {
      mostrarToast('erro', 'Idade deve ser um número inteiro de 1 a 99.');
      return;
    }

    let tempo: number | undefined;
    if (form.tempo.trim() !== '') {
      tempo = parseTempo(form.tempo.trim());
      if (tempo === undefined) {
        mostrarToast('erro', 'Tempo inválido. Use segundos (ex.: 34.66 ou 34,66).');
        return;
      }
    }

    const adicionado = adicionarAtleta(
      {
        nome,
        idade,
        categoriaOficial: form.categoria,
        genero: form.genero,
        periodo: form.periodo,
        professor: form.professor.trim(),
        nivel: form.nivel.trim(),
        tipo: form.tipo,
        tempo,
      },
      'apresentacao',
    );
    if (!adicionado) return;

    setModalAberto(false);
    mostrarToast('sucesso', `Atleta "${nome}" adicionado.`);
  }

  function comparar(a: Atleta, b: Atleta, campo: Campo): number {
    switch (campo) {
      case 'nome':
        return a.nome.localeCompare(b.nome, 'pt-BR');
      case 'idade':
        return a.idade - b.idade;
      case 'categoriaOficial':
        return CATEGORIAS.indexOf(a.categoriaOficial) - CATEGORIAS.indexOf(b.categoriaOficial);
      case 'genero':
        return a.genero.localeCompare(b.genero, 'pt-BR');
      case 'periodo':
        return ORDEM_PERIODOS.indexOf(a.periodo) - ORDEM_PERIODOS.indexOf(b.periodo);
      case 'professor':
        return a.professor.localeCompare(b.professor, 'pt-BR');
      case 'nivel':
        return a.nivel.localeCompare(b.nivel, 'pt-BR');
      case 'tipo':
        return (a.tipo ?? '').localeCompare(b.tipo ?? '', 'pt-BR');
    }
  }

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const base = atletas.filter((atleta) => {
      if (termo && !atleta.nome.toLowerCase().includes(termo)) return false;
      if (nivel !== 'todos' && atleta.nivel !== nivel) return false;
      if (genero !== 'todos' && atleta.genero !== genero) return false;
      if (tipo !== 'todos' && atleta.tipo !== tipo) return false;
      if (periodoFiltro !== 'todos' && atleta.periodo !== periodoFiltro) return false;
      return true;
    });
    return [...base].sort((a, b) => {
      const resultado = comparar(a, b, ordenacao.campo);
      return ordenacao.direcao === 'asc' ? resultado : -resultado;
    });
  }, [atletas, busca, nivel, genero, tipo, periodoFiltro, ordenacao]);

  const filtradoAtivo =
    busca.trim() !== '' ||
    nivel !== 'todos' ||
    genero !== 'todos' ||
    tipo !== 'todos' ||
    periodoFiltro !== 'todos';

  function limparFiltros() {
    setBusca('');
    setNivel('todos');
    setGenero('todos');
    setTipo('todos');
    setPeriodoFiltro('todos');
  }

  function ordenarPor(campo: Campo) {
    setOrdenacao((atual) =>
      atual.campo === campo
        ? { campo, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' }
        : { campo, direcao: 'asc' },
    );
  }

  function cabecalhoOrdenavel(campo: Campo, rotulo: string) {
    return (
      <button
        type="button"
        onClick={() => ordenarPor(campo)}
        className="uppercase tracking-wider hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-flex items-center gap-1"
        title={`Ordenar por ${rotulo}`}
      >
        {rotulo}
        {ordenacao.campo === campo && (
          <span className="text-primary-600 dark:text-primary-400">
            {ordenacao.direcao === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </button>
    );
  }

  function iniciarEdicao(atleta: Atleta, campo: Campo, valor: string) {
    setEdicao({ id: atleta.id, campo });
    setRascunho(valor);
  }

  function estaEditando(atleta: Atleta, campo: Campo) {
    return edicao?.id === atleta.id && edicao.campo === campo;
  }

  function confirmarEdicao(atleta: Atleta) {
    if (!edicao) return;
    const { campo } = edicao;
    const bruto = rascunho;

    if (campo === 'nome') {
      const nome = bruto.trim();
      if (!nome) {
        mostrarToast('erro', 'O nome não pode ficar vazio.');
        return;
      }
      atualizarAtleta(atleta.id, { nome });
    } else if (campo === 'idade') {
      const idade = Number(bruto.replace(',', '.'));
      if (!Number.isInteger(idade) || idade < 1 || idade > 99) {
        mostrarToast('erro', 'Idade deve ser um número inteiro de 1 a 99.');
        return;
      }
      atualizarAtleta(atleta.id, { idade });
    } else if (campo === 'professor') {
      atualizarAtleta(atleta.id, { professor: bruto.trim() });
    } else if (campo === 'nivel') {
      atualizarAtleta(atleta.id, { nivel: bruto.trim() });
    }

    setEdicao(null);
  }

  function aplicarSelect(atleta: Atleta, campo: Campo, valor: string) {
    if (campo === 'categoriaOficial') {
      atualizarAtleta(atleta.id, { categoriaOficial: valor as Categoria });
    } else if (campo === 'genero') {
      atualizarAtleta(atleta.id, { genero: valor as Genero });
    } else if (campo === 'periodo') {
      atualizarAtleta(atleta.id, { periodo: valor as Periodo });
    } else if (campo === 'tipo') {
      atualizarAtleta(atleta.id, { tipo: valor as Atleta['tipo'] });
    }
    setEdicao(null);
  }

  function celulaTexto(atleta: Atleta, campo: Campo, valor: string, valorEdicao?: string) {
    if (estaEditando(atleta, campo)) {
      return (
        <input
          autoFocus
          value={rascunho}
          onChange={(evento) => setRascunho(evento.target.value)}
          onBlur={() => confirmarEdicao(atleta)}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter') confirmarEdicao(atleta);
            if (evento.key === 'Escape') setEdicao(null);
          }}
          className={INPUT_CLASSE}
        />
      );
    }
    return (
      <span
        className="cursor-text"
        title="Duplo clique para editar"
        onDoubleClick={() => iniciarEdicao(atleta, campo, valorEdicao ?? valor)}
      >
        {valor}
      </span>
    );
  }

  function celulaSelect(
    atleta: Atleta,
    campo: Campo,
    valor: string,
    opcoes: { valor: string; rotulo: string }[],
  ) {
    if (estaEditando(atleta, campo)) {
      return (
        <select
          autoFocus
          value={rascunho}
          onChange={(evento) => aplicarSelect(atleta, campo, evento.target.value)}
          onBlur={() => setEdicao(null)}
          className={INPUT_CLASSE}
        >
          {opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
      );
    }
    return (
      <span
        className="cursor-text"
        title="Duplo clique para editar"
        onDoubleClick={() => iniciarEdicao(atleta, campo, valor)}
      >
        {opcoes.find((opcao) => opcao.valor === valor)?.rotulo ?? valor}
      </span>
    );
  }

  function exportar() {
    if (filtrados.length === 0) {
      mostrarToast('erro', 'Nada a exportar.');
      return;
    }
    exportCSV(
      'listagem-apresentacao.csv',
      [
        'nome',
        'idade',
        'categoria',
        'genero',
        'horario',
        'professor',
        'nivel',
        'tipo',
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
        a.tipo ?? '',
        a.medalha ?? 'Sem Tempo',
      ]),
    );
    mostrarToast('sucesso', `Exportados ${filtrados.length} atleta(s).`);
  }

  const chipClasse = '!px-3 !py-1 !text-xs';

  const niveisPresentes = useMemo(() => {
    const presentes = new Set(atletas.map((atleta) => atleta.nivel.trim()).filter(Boolean));
    return [...presentes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [atletas]);

  const NIVEIS: { valor: string; rotulo: string }[] = [
    { valor: 'todos', rotulo: 'Todos' },
    ...niveisPresentes.map((nivel) => ({ valor: nivel, rotulo: nivel })),
  ];

  const TIPOS: { valor: string; rotulo: string }[] = [
    { valor: 'todos', rotulo: 'Todos' },
    { valor: 'Crawl c/ prancha', rotulo: 'Crawl c/ prancha' },
    { valor: 'Crawl s/ prancha', rotulo: 'Crawl s/ prancha' },
  ];

  const PERIODOS_FILTRO: (Periodo | 'todos')[] = ['todos', 'manhã', 'tarde'];

  const TIPOS_SELECT: { valor: string; rotulo: string }[] = [
    { valor: '', rotulo: '—' },
    ...TIPOS.filter((opcao) => opcao.valor !== 'todos'),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Lista Apresentação</h1>

      <Card>
        <CardHeading icone="🤿" titulo="Atletas para apresentação" />

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-full max-w-xs">
            <SearchInput valor={busca} onChange={setBusca} placeholder="Buscar por nome..." />
          </div>
          <Button onClick={abrirModal}>+ Adicionar Atleta</Button>
          <Button variante="secondary" onClick={exportar}>
            Exportar CSV
          </Button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {filtrados.length} de {atletas.length} atleta(s)
          </span>
          {filtradoAtivo && (
            <Button
              variante="ghost"
              onClick={limparFiltros}
              aria-label="Limpar filtros"
              title="Limpar filtros"
              className="text-base"
            >
              ↺
            </Button>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Nível
            </span>
            {NIVEIS.map((opcao) => (
              <Pill
                key={opcao.valor}
                ativo={nivel === opcao.valor}
                onClick={() => setNivel(opcao.valor)}
                className={chipClasse}
              >
                {opcao.rotulo}
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
                className={chipClasse}
              >
                {opcao}
              </Pill>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Período
            </span>
            {PERIODOS_FILTRO.map((opcao) => (
              <Pill
                key={opcao}
                ativo={periodoFiltro === opcao}
                onClick={() => setPeriodoFiltro(opcao)}
                className={chipClasse}
              >
                {opcao}
              </Pill>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Tipo
            </span>
            {TIPOS.map((opcao) => (
              <Pill
                key={opcao.valor}
                ativo={tipo === opcao.valor}
                onClick={() => setTipo(opcao.valor)}
                className={chipClasse}
              >
                {opcao.rotulo}
              </Pill>
            ))}
          </div>
        </div>

        <TabelaGenerica
          colunas={[
            {
              chave: 'nome',
              titulo: cabecalhoOrdenavel('nome', 'Nome'),
              render: (a) => celulaTexto(a, 'nome', a.nome),
            },
            {
              chave: 'idade',
              titulo: cabecalhoOrdenavel('idade', 'Idade'),
              render: (a) => celulaTexto(a, 'idade', String(a.idade)),
            },
            {
              chave: 'categoria',
              titulo: cabecalhoOrdenavel('categoriaOficial', 'Categoria'),
              render: (a) =>
                celulaSelect(
                  a,
                  'categoriaOficial',
                  a.categoriaOficial,
                  CATEGORIAS.map((cat) => ({ valor: cat, rotulo: cat })),
                ),
            },
            {
              chave: 'genero',
              titulo: cabecalhoOrdenavel('genero', 'Gênero'),
              render: (a) =>
                celulaSelect(
                  a,
                  'genero',
                  a.genero,
                  [
                    { valor: 'feminino', rotulo: 'feminino' },
                    { valor: 'masculino', rotulo: 'masculino' },
                  ],
                ),
            },
            {
              chave: 'horario',
              titulo: cabecalhoOrdenavel('periodo', 'Horário'),
              render: (a) =>
                celulaSelect(
                  a,
                  'periodo',
                  a.periodo,
                  [
                    { valor: 'manhã', rotulo: 'manhã' },
                    { valor: 'tarde', rotulo: 'tarde' },
                  ],
                ),
            },
            {
              chave: 'professor',
              titulo: cabecalhoOrdenavel('professor', 'Professor'),
              render: (a) => celulaTexto(a, 'professor', a.professor),
            },
            {
              chave: 'nivel',
              titulo: cabecalhoOrdenavel('nivel', 'Nível'),
              render: (a) => celulaTexto(a, 'nivel', a.nivel),
            },
            {
              chave: 'tipo',
              titulo: cabecalhoOrdenavel('tipo', 'Tipo'),
              render: (a) => celulaSelect(a, 'tipo', a.tipo ?? '', TIPOS_SELECT),
            },
          ]}
          itens={filtrados}
          chaveItem={(a) => a.id}
          vazio={
            atletas.length === 0 ? (
              <>
                Nenhum atleta processado.{' '}
                <Link
                  className="text-primary-600 dark:text-primary-400 underline"
                  to="/upload-apresentacao"
                >
                  Envie um CSV
                </Link>
                .
              </>
            ) : (
              'Nenhum atleta corresponde aos filtros.'
            )
          }
        />
      </Card>

      {modalAberto && (
        <Modal
          titulo="Adicionar atleta"
          onClose={() => setModalAberto(false)}
          footer={
            <>
              <Button variante="secondary" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmarAdicao}>Adicionar</Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label
                htmlFor="novo-nome"
                className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
              >
                Nome
              </label>
              <Input
                id="novo-nome"
                value={form.nome}
                onChange={(evento) => alterarForm('nome', evento.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label
                htmlFor="novo-idade"
                className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
              >
                Idade
              </label>
              <Input
                id="novo-idade"
                type="number"
                min={1}
                max={99}
                value={form.idade}
                onChange={(evento) => alterarForm('idade', evento.target.value)}
                placeholder="ex.: 10"
              />
            </div>

            <div>
              <label
                htmlFor="novo-categoria"
                className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
              >
                Categoria
              </label>
              <select
                id="novo-categoria"
                value={form.categoria}
                onChange={(evento) => alterarForm('categoria', evento.target.value as Categoria)}
                className={SELECT_CLASSE}
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="novo-genero"
                className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
              >
                Gênero
              </label>
              <select
                id="novo-genero"
                value={form.genero}
                onChange={(evento) => alterarForm('genero', evento.target.value as Genero)}
                className={SELECT_CLASSE}
              >
                <option value="feminino">feminino</option>
                <option value="masculino">masculino</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="novo-periodo"
                className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
              >
                Horário
              </label>
              <select
                id="novo-periodo"
                value={form.periodo}
                onChange={(evento) => alterarForm('periodo', evento.target.value as Periodo)}
                className={SELECT_CLASSE}
              >
                <option value="manhã">manhã</option>
                <option value="tarde">tarde</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="novo-professor"
                className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
              >
                Professor
              </label>
              <Input
                id="novo-professor"
                value={form.professor}
                onChange={(evento) => alterarForm('professor', evento.target.value)}
                placeholder="ex.: Prof. Ana"
              />
            </div>

            <div>
              <label
                htmlFor="novo-nivel"
                className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
              >
                Nível
              </label>
              <Input
                id="novo-nivel"
                value={form.nivel}
                onChange={(evento) => alterarForm('nivel', evento.target.value)}
                placeholder="ex.: iniciante"
              />
            </div>

            <div>
              <label
                htmlFor="novo-tipo"
                className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
              >
                Tipo
              </label>
              <select
                id="novo-tipo"
                value={form.tipo}
                onChange={(evento) =>
                  alterarForm('tipo', evento.target.value as FormAtleta['tipo'])}
                className={SELECT_CLASSE}
              >
                <option value="Crawl c/ prancha">Crawl c/ prancha</option>
                <option value="Crawl s/ prancha">Crawl s/ prancha</option>
              </select>
            </div>

            <div className="col-span-2">
              <label
                htmlFor="novo-tempo"
                className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
              >
                Tempo (opcional)
              </label>
              <InputMascaraTempo
                id="novo-tempo"
                valor={form.tempo}
                onMudar={(tempo) =>
                  alterarForm('tempo', tempo !== undefined ? formatTempo(tempo) : '')
                }
                placeholder="ex.: 34.66"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
