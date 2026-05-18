import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import NotificationBell from '../NotificationBell/NotificationBell';

const pageTitles: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/applications':  'Applications',
  '/centres':       'Aggregation Centres',
  '/loans':         'WR Financing',
  '/reports':        'Reports & Analytics',
  '/reports/centre': 'Centre Report',
  '/users':         'User Management',
  '/settings':                   'Settings',
  '/notifications':              'Notifications',
  '/mechanization/tractors':     'Tractor Inventory',
  '/mechanization/deployments':  'Tractor Deployments',
};

export default function AppLayout() {
  const location   = useLocation();
  const title      = pageTitles[location.pathname] ?? '';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 md:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 md:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition shrink-0"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <p className="text-sm font-semibold text-slate-700 truncate">{title}</p>
          </div>
          <NotificationBell />
        </header>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
