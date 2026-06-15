import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import type { RootState } from '../../store/store';

const navItems = [
  { label: 'Dashboard',           icon: 'dashboard',        to: '/manager/dashboard',    group: 'main' },
  { label: 'Reports',             icon: 'bar_chart',        to: '/manager/reports',      group: 'main' },
  { label: 'Commodity Intake',    icon: 'inventory_2',      to: '/manager/intake',       group: 'main' },
  { label: 'AgriHub Receipts',     icon: 'receipt_long',     to: '/manager/receipts',     group: 'main' },
  { label: 'Inventory & POS',     icon: 'point_of_sale',    to: '/manager/inventory',    group: 'main' },
  { label: 'Farm Inputs',         icon: 'grass',            to: '/manager/farm-inputs',  group: 'main' },
  { label: 'Collections',         icon: 'local_shipping',   to: '/manager/collections',  group: 'main' },
  { label: 'Container Shops',     icon: 'add_business',     to: '/manager/shops',        group: 'main' },
  { label: 'Commodity Prices',    icon: 'price_change',     to: '/manager/commodity-prices', group: 'main' },
  { label: 'My Listings',         icon: 'storefront',       to: '/manager/marketplace/listings',        group: 'market' },
  { label: 'Marketplace Orders',  icon: 'shopping_bag',     to: '/manager/marketplace/orders',          group: 'market' },
  { label: 'My Fleet',            icon: 'agriculture',      to: '/manager/mechanization/fleet',         group: 'mech' },
  { label: 'Hire Requests',       icon: 'assignment',       to: '/manager/mechanization/requests',      group: 'mech' },
  { label: 'Deployments',         icon: 'near_me',          to: '/manager/mechanization/deployments',   group: 'mech' },
  { label: 'Notifications',       icon: 'notifications',    to: '/manager/notifications', group: 'system' },
  { label: 'Settings',            icon: 'settings',         to: '/manager/settings',      group: 'system' },
];

interface ManagerSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function ManagerSidebar({ open, onClose }: ManagerSidebarProps) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const user      = useSelector((s: RootState) => s.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-boa-green-dark flex flex-col z-30
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="px-5 py-4 border-b border-emerald-900 flex items-center justify-between">
          <div>
            <img src="/boa-logo.png" alt="Bank of Agriculture" className="h-12 w-auto brightness-0 invert mb-1" />
            <p className="text-emerald-400 text-xs">Centre Manager Portal</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-emerald-400 hover:text-white p-1"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Operations</p>
          {navItems.filter(i => i.group === 'main').map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition
                ${isActive
                  ? 'bg-boa-green text-white'
                  : 'text-emerald-300 hover:bg-emerald-900 hover:text-white'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider px-3 mt-5 mb-2">Marketplace</p>
          {navItems.filter(i => i.group === 'market').map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition
                ${isActive
                  ? 'bg-harvest-gold text-emerald-950'
                  : 'text-emerald-300 hover:bg-emerald-900 hover:text-white'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider px-3 mt-5 mb-2">Mechanization</p>
          {navItems.filter(i => i.group === 'mech').map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition
                ${isActive
                  ? 'bg-boa-green text-white'
                  : 'text-emerald-300 hover:bg-emerald-900 hover:text-white'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider px-3 mt-5 mb-2">System</p>
          {navItems.filter(i => i.group === 'system').map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition
                ${isActive
                  ? 'bg-boa-green text-white'
                  : 'text-emerald-300 hover:bg-emerald-900 hover:text-white'
                }`
              }
            >
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
              <p className="text-emerald-400 text-xs truncate">Centre Manager</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-emerald-400 hover:bg-red-900/40 hover:text-red-300 transition"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
