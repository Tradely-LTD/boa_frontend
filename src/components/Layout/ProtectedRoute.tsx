import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

interface Props {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const token = useSelector((s: RootState) => s.auth.token);
  const user  = useSelector((s: RootState) => s.auth.user);

  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'centre_manager') return <Navigate to="/manager/dashboard" replace />;
    if (user.role === 'collector')      return <Navigate to="/collector/assignments" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
