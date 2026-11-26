import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { PREFIXO_HASH, desserializarCompartilhado } from './utils/compartilhar';
import { aplicarZoom, lerZoomSalvo } from './utils/zoom';
import { useAppStore } from './store/useAppStore';
import './index.css';

const temaSalvo = localStorage.getItem('festival-tema');
if (temaSalvo === 'dark') {
  document.documentElement.classList.add('dark');
}

aplicarZoom(lerZoomSalvo());

function importarLinkNoBoot() {
  if (!window.location.hash.startsWith(PREFIXO_HASH)) return;
  try {
    const store = useAppStore.getState();
    const dados = desserializarCompartilhado(window.location.hash);
    if (dados) {
      store.importarCompartilhado(dados);
      store.mostrarToast(
        'sucesso',
        `Dados do link importados (${dados.atletas.length} atleta(s) no Festival, ${dados.atletasApresentacao.length} na Apresentação).`,
      );
    } else {
      store.mostrarToast('erro', 'Link de compartilhamento inválido ou corrompido.');
    }
  } catch {
    try {
      useAppStore.getState().mostrarToast('erro', 'Link de compartilhamento inválido ou corrompido.');
    } catch {
      /* store indisponível — React monta normalmente */
    }
  } finally {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

importarLinkNoBoot();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
