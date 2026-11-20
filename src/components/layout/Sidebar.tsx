import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

const ICONE_APRESENTACAO: ReactNode = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6c0-2 4-4 9-4s9 2 9 4" />
    <path d="M3 6c0 3 3 6 9 6s9-3 9-6" />
    <circle cx="8" cy="9" r="2" />
    <circle cx="16" cy="9" r="2" />
    <path d="M10 9h4" />
    <path d="M12 11v1" />
    <path d="M9 13Q12 14 15 13" />
  </svg>
);

const LINKS = [
  { to: '/carregar', icone: '📄', rotulo: 'Carregar' },
  { to: '/lista', icone: '🏊', rotulo: 'Lista Festival' },
  { to: '/lista-apresentacao', icone: ICONE_APRESENTACAO, rotulo: 'Lista Apresentação' },
  { to: '/balizamento', icone: '🏁', rotulo: 'Balizamento' },
  { to: '/controle', icone: '⏱️', rotulo: 'Controle' },
  { to: '/analise', icone: '📊', rotulo: 'Análise' },
];

export function Sidebar() {
  const aberta = useAppStore((estado) => estado.sidebarAberta);
  const alternarSidebar = useAppStore((estado) => estado.alternarSidebar);

  return (
    <aside
      className={`no-print bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-r dark:border-gray-800 min-h-[calc(100vh-57px)] flex flex-col py-4 transition-all duration-300 ease-in-out overflow-hidden ${
        aberta ? 'w-56' : 'w-14'
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
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors'
            }
            title={link.rotulo}
          >
            <span className="text-lg leading-none">{link.icone}</span>
            {aberta && <span className="truncate">{link.rotulo}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
