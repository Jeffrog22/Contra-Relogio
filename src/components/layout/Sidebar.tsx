import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

const CARREGAR_SUBITENS = [
  { to: '/carregar', icone: '📄', rotulo: 'Upload Festival' },
  { to: '/upload-apresentacao', icone: '📤', rotulo: 'Upload Apresentação' },
];

const LINKS = [
  { to: '/lista-apresentacao', icone: '🤿', rotulo: 'Lista Apresentação' },
  { to: '/lista', icone: '🏊', rotulo: 'Lista Festival' },
  { to: '/balizamento', icone: '🏁', rotulo: 'Balizamento' },
  { to: '/controle', icone: '⏱️', rotulo: 'Controle' },
  { to: '/analise', icone: '📊', rotulo: 'Análise' },
];

const LINK_CLASSE_ATIVA =
  'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors';

const LINK_CLASSE_INATIVA =
  'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors';

const SUBITEM_CLASSE_ATIVA =
  'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors';

const SUBITEM_CLASSE_INATIVA =
  'text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors';

function ehMobile(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 767px)').matches
    : false;
}

export function Sidebar() {
  const aberta = useAppStore((estado) => estado.sidebarAberta);
  const alternarSidebar = useAppStore((estado) => estado.alternarSidebar);
  const [carregarAberto, setCarregarAberto] = useState(false);
  const location = useLocation();
  const carregarAtivo = location.pathname === '/carregar' || location.pathname === '/upload-apresentacao';

  // No mobile o drawer fecha ao navegar (desktop mantém o estado manual).
  useEffect(() => {
    if (aberta && ehMobile()) {
      alternarSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      {aberta && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden no-print"
          onClick={alternarSidebar}
          aria-hidden="true"
        />
      )}
      <aside
        className={`no-print bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-r dark:border-gray-800 min-h-[calc(100vh-57px)] flex flex-col py-4 transition-all duration-300 ease-in-out overflow-hidden max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 ${
          aberta ? 'w-56 translate-x-0' : 'w-14 max-md:-translate-x-full'
        }`}
      >
        <div className="px-2 mb-3">
          <button
            type="button"
            onClick={alternarSidebar}
            aria-label={aberta ? 'Recolher menu' : 'Expandir menu'}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-lg leading-none">{aberta ? '◀' : '▶'}</span>
          </button>
        </div>

        {aberta && (
          <span className="px-2 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Festival
          </span>
        )}

        <nav className="flex flex-col gap-1 px-2">
          {/* Carregar com dropdown */}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setCarregarAberto(!carregarAberto)}
              className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors ${
                carregarAtivo ? LINK_CLASSE_ATIVA : LINK_CLASSE_INATIVA
              }`}
            >
              <span className="text-lg leading-none">📄</span>
              {aberta && <span className="truncate">Carregar</span>}
              {aberta && (
                <span className="ml-auto text-xs">{carregarAberto ? '▲' : '▼'}</span>
              )}
            </button>

            {aberta && carregarAberto && (
              <div className="ml-3 flex flex-col gap-0.5 border-l border-primary-300 dark:border-primary-700 pl-2">
                {CARREGAR_SUBITENS.map((sub) => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    className={({ isActive }) =>
                      isActive ? SUBITEM_CLASSE_ATIVA : SUBITEM_CLASSE_INATIVA
                    }
                    title={sub.rotulo}
                    onClick={() => setCarregarAberto(false)}
                  >
                    <span className="text-lg leading-none">{sub.icone}</span>
                    {aberta && <span className="truncate">{sub.rotulo}</span>}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Demais links */}
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? LINK_CLASSE_ATIVA : LINK_CLASSE_INATIVA
              }
              title={link.rotulo}
            >
              <span className="text-lg leading-none">{link.icone}</span>
              {aberta && <span className="truncate">{link.rotulo}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
