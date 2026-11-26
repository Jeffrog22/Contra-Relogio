import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Toast } from '../ui/Toast';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar />
      <div className="flex overflow-x-clip">
        <Sidebar />
        <main className="flex-1 min-w-0 p-6 bg-gray-50 dark:bg-gray-950 min-h-[calc(100vh-57px-env(safe-area-inset-top))] print:p-0">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}
