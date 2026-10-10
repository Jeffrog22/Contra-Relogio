import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Atleta } from '../types';
import { parseCSVAtletas } from '../utils/csv';
import { formatTempo } from '../utils/medalhas';
import { useAppStore } from '../store/useAppStore';
import { Card, CardDescricao, CardHeading } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TabelaGenerica } from '../components/ui/TabelaGenerica';
import { MedalhaBadge } from '../components/ui/MedalhaBadge';

export function CarregarPage() {
  const navigate = useNavigate();
  const processarAtletas = useAppStore((estado) => estado.processarAtletas);
  const limparAtletas = useAppStore((estado) => estado.limparAtletas);
  const mostrarToast = useAppStore((estado) => estado.mostrarToast);
  const totalCarregado = useAppStore((estado) => estado.atletas.length);

  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [erros, setErros] = useState<string[]>([]);

  async function lerArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    const texto = await arquivo.text();
    const resultado = parseCSVAtletas(texto);
    setNomeArquivo(arquivo.name);
    setAtletas(resultado.atletas);
    setErros(resultado.erros);

    if (resultado.erros.length > 0) {
      mostrarToast('erro', `CSV com ${resultado.erros.length} erro(s). Corrija e reenvie.`);
    } else if (resultado.atletas.length === 0) {
      mostrarToast('erro', 'Nenhum atleta encontrado no arquivo.');
    } else {
      mostrarToast('sucesso', `${resultado.atletas.length} atleta(s) lido(s).`);
    }
  }

  function processar() {
    if (atletas.length === 0) {
      mostrarToast('erro', 'Nada a processar. Envie um CSV válido.');
      return;
    }
    processarAtletas(atletas);
    mostrarToast('sucesso', `${atletas.length} atleta(s) processado(s).`);
    navigate('/lista');
  }

  function limparCarregamento() {
    limparAtletas();
    setNomeArquivo(null);
    setAtletas([]);
    setErros([]);
    mostrarToast('sucesso', 'Carregamento limpo: atletas e séries removidos.');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
        Carregar CSV de atletas
      </h1>

      <Card>
        <CardHeading icone="📄" titulo="Upload do arquivo" />
        <CardDescricao>
          Colunas obrigatórias: <b>nome, idade, categoria, genero, horario, professor, nivel</b> —
          e opcional <b>tempo</b>. Gênero: feminino | masculino. Horário: manhã | tarde | horário
          (ex.: 08:45 — antes das 13h é manhã, a partir das 13h é tarde). Categoria: Pré-Mirim |
          Mirim | Petiz | Infantil | Juvenil | Júnior | Sênior — subclasses como "Mirim II" viram a
          categoria-base (Mirim).
        </CardDescricao>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(evento) => lerArquivo(evento.target.files?.[0])}
            className="text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:px-4 file:py-2 file:rounded-md file:border-0 file:text-sm file:bg-primary-600 file:text-white hover:file:bg-primary-700 file:transition-colors"
          />
          {nomeArquivo && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Arquivo: <b>{nomeArquivo}</b> — {atletas.length} atleta(s)
            </span>
          )}
          <Button
            variante="secondary"
            onClick={limparCarregamento}
            disabled={totalCarregado === 0}
            className="disabled:opacity-50"
          >
            Limpar carregamento
          </Button>
        </div>

        {erros.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
              Erros de validação:
            </p>
            <ul className="text-xs text-red-700 dark:text-red-300 list-disc list-inside space-y-0.5">
              {erros.map((erro) => (
                <li key={erro}>{erro}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {atletas.length > 0 && (
        <Card>
          <CardHeading icone="" titulo="Pré-visualização" />
          <TabelaGenerica
            className="mb-4"
            colunas={[
              { chave: 'nome', titulo: 'Nome', render: (a) => a.nome },
              { chave: 'idade', titulo: 'Idade', render: (a) => a.idade },
              {
                chave: 'categoria',
                titulo: 'Categoria',
                render: (a) => <span className="font-mono tabular-nums">{a.categoriaOficial}</span>,
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
              { chave: 'medalha', titulo: 'Medalha', render: (a) => <MedalhaBadge medalha={a.medalha} /> },
            ]}
            itens={atletas}
            chaveItem={(a) => a.id}
          />
          <div className="flex justify-end">
            <Button onClick={processar}>Processar</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
