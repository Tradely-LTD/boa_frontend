import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store } from './store/store';
import type { RootState } from './store/store';

import ProtectedRoute  from './components/Layout/ProtectedRoute';
import AppLayout       from './components/Layout/AppLayout';
import ManagerLayout   from './components/Layout/ManagerLayout';
import CollectorLayout from './components/Layout/CollectorLayout';
import { LoginScreen } from './screens/auth_screens';

// Admin screens
import DashboardScreen        from './screens/dashboard_screens/DashboardScreen';
import { ApplicationsScreen } from './screens/applications_screens';
import { CentresScreen }      from './screens/centres_screens';
import { UsersScreen }        from './screens/users_screens';
import ReportsScreen          from './screens/reports_screens/ReportsScreen';
import CentreReportScreen     from './screens/reports_screens/CentreReportScreen';
import LoanApplicationsScreen from './screens/loan_screens/LoanApplicationsScreen';
import { SettingsScreen }     from './screens/settings_screens';
import { NotificationsScreen } from './screens/notifications_screens';

// Manager screens
import ManagerDashboardScreen       from './screens/manager_screens/dashboard/ManagerDashboardScreen';
import CommodityIntakeScreen        from './screens/manager_screens/intake/CommodityIntakeScreen';
import WarehouseReceiptsScreen      from './screens/manager_screens/receipts/WarehouseReceiptsScreen';
import InventoryScreen              from './screens/manager_screens/inventory/InventoryScreen';
import FarmInputsScreen             from './screens/manager_screens/farm-inputs/FarmInputsScreen';
import CollectionRequestsScreen       from './screens/manager_screens/collections/CollectionRequestsScreen';
import MarketplaceListingsScreen      from './screens/manager_screens/marketplace/MarketplaceListingsScreen';
import MarketplaceOrdersScreen        from './screens/manager_screens/marketplace/MarketplaceOrdersScreen';
import TractorsScreen                 from './screens/mechanization_screens/TractorsScreen';
import AdminMechDeploymentsScreen     from './screens/mechanization_screens/AdminMechDeploymentsScreen';
import FleetScreen                    from './screens/manager_screens/mechanization/FleetScreen';
import HireRequestsScreen             from './screens/manager_screens/mechanization/HireRequestsScreen';
import MechDeploymentsScreen          from './screens/manager_screens/mechanization/MechDeploymentsScreen';

// Collector screens
import CollectionAssignmentsScreen  from './screens/collector_screens/CollectionAssignmentsScreen';

const ADMIN_ROLES     = ['admin', 'super_admin'];
const MANAGER_ROLES   = ['centre_manager'];
const COLLECTOR_ROLES = ['collector'];

function RoleRedirect() {
  const user = useSelector((s: RootState) => s.auth.user);
  if (user?.role === 'centre_manager') return <Navigate to="/manager/dashboard" replace />;
  if (user?.role === 'collector')      return <Navigate to="/collector/assignments" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />

          {/* Admin portal */}
          <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"     element={<DashboardScreen />} />
              <Route path="/applications"  element={<ApplicationsScreen />} />
              <Route path="/centres"       element={<CentresScreen />} />
              <Route path="/loans"         element={<LoanApplicationsScreen />} />
              <Route path="/reports"                element={<ReportsScreen />} />
              <Route path="/reports/centre"        element={<CentreReportScreen />} />
              <Route path="/users"         element={<UsersScreen />} />
              <Route path="/settings"                    element={<SettingsScreen />} />
              <Route path="/notifications"              element={<NotificationsScreen />} />
              <Route path="/mechanization/tractors"     element={<TractorsScreen />} />
              <Route path="/mechanization/deployments"  element={<AdminMechDeploymentsScreen />} />
            </Route>
          </Route>

          {/* Manager portal */}
          <Route element={<ProtectedRoute allowedRoles={MANAGER_ROLES} />}>
            <Route element={<ManagerLayout />}>
              <Route path="/manager/dashboard"     element={<ManagerDashboardScreen />} />
              <Route path="/manager/intake"        element={<CommodityIntakeScreen />} />
              <Route path="/manager/receipts"      element={<WarehouseReceiptsScreen />} />
              <Route path="/manager/inventory"     element={<InventoryScreen />} />
              <Route path="/manager/farm-inputs"   element={<FarmInputsScreen />} />
              <Route path="/manager/collections"              element={<CollectionRequestsScreen />} />
              <Route path="/manager/marketplace/listings"    element={<MarketplaceListingsScreen />} />
              <Route path="/manager/marketplace/orders"      element={<MarketplaceOrdersScreen />} />
              <Route path="/manager/mechanization/fleet"        element={<FleetScreen />} />
              <Route path="/manager/mechanization/requests"     element={<HireRequestsScreen />} />
              <Route path="/manager/mechanization/deployments"  element={<MechDeploymentsScreen />} />
              <Route path="/manager/notifications" element={<NotificationsScreen />} />
              <Route path="/manager/settings"      element={<SettingsScreen />} />
            </Route>
          </Route>

          {/* Collector portal */}
          <Route element={<ProtectedRoute allowedRoles={COLLECTOR_ROLES} />}>
            <Route element={<CollectorLayout />}>
              <Route path="/collector/assignments" element={<CollectionAssignmentsScreen />} />
            </Route>
          </Route>

          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
