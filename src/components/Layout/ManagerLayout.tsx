import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ManagerSidebar from '../Sidebar/ManagerSidebar';
import NotificationBell from '../NotificationBell/NotificationBell';

const pageTitles: Record<string, string> = {
  '/manager/dashboard':     'Dashboard',
  '/manager/intake':        'Commodity Intake',
  '/manager/receipts':      'AgriHub Receipts',
  '/manager/inventory':     'Inventory & POS',
  '/manager/farm-inputs':   'Farm Inputs',
  '/manager/collections':   'Collection Requests',
  '/manager/notifications': 'Notifications',
  '/manager/settings':      'Settings',
  '/collector/assignments': 'My Assignments',
};

export default function ManagerLayout() {
  const location   = useLocation();
  const title      = pageTitles[location.pathname] ?? '';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
      <ManagerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 md:ml-64 flex flex-col min-h-screen">
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
          <NotificationBell managerPrefix="/manager" />
        </header>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
