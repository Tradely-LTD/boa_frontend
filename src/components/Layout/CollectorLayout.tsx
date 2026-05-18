import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import type { RootState } from '../../store/store';
import NotificationBell from '../NotificationBell/NotificationBell';

const navItems = [
  { label: 'My Assignments', icon: 'assignment_ind', to: '/collector/assignments' },
];

export default function CollectorLayout() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const user      = useSelector((s: RootState) => s.auth.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-boa-green-dark flex flex-col z-30
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-5 py-4 border-b border-emerald-900 flex items-center justify-between">
          <div>
            <img src="/boa-logo.png" alt="Bank of Agriculture" className="h-12 w-auto brightness-0 invert mb-1" />
            <p className="text-emerald-400 text-xs">Collector Portal</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-emerald-400 hover:text-white p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Menu</p>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition
                ${isActive ? 'bg-boa-green text-white' : 'text-emerald-300 hover:bg-emerald-900 hover:text-white'}`
              }>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-emerald-900">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-base text-emerald-300">person</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-emerald-400 text-xs">Collector</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-emerald-400 hover:bg-red-900/40 hover:text-red-300 transition">
            <span className="material-symbols-outlined text-base">logout</span>
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 md:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 md:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition shrink-0">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <p className="text-sm font-semibold text-slate-700 truncate">My Assignments</p>
          </div>
          <NotificationBell managerPrefix="/collector" />
        </header>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
