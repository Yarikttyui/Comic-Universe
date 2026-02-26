import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../store/authStore';
import { resolvePostAuthRoute } from '../utils/authNavigation';

export function RequireAuth() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.isOnboardingCompleted && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  if (user && !user.isOnboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to={resolvePostAuthRoute(user, '/onboarding')} replace />;
  }

  return <Outlet />;
}

interface RequireRolesProps {
  roles: UserRole[];
}

export function RequireRoles({ roles }: RequireRolesProps) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
