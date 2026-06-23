import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { checkAuthSession } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import OnlyUserModal from '@/components/ui/modals/OnlyUserModal';
import LoadingScreen from '@/components/ui/LoadingScreen';

const ALLOWED_ROLES = ['user', 'forecaster'];
const ADMIN_ROLES = ['admin'];

const resolveAuthenticatedRedirect = (role, fallback = '/studio') => {
  if (role === 'admin') return '/dashboard';
  if (role === 'forecaster') return '/studio';
  if (role === 'user') return fallback;
  return fallback;
};

const ProtectedRoute = ({
  children,
  requireAuth = true,
  redirectTo = '/login',
  adminRedirect = '/login',
  authenticatedRedirect = '/studio',
}) => {
  const navigate = useNavigate();
  const { isLoggedIn, role: contextRole, setIsLoggedIn, setRole } = useAuth();
  const [apiState, setApiState] = useState({ phase: 'loading', isAuthenticated: false, role: null });

  useEffect(() => {
    if (isLoggedIn && contextRole) return;

    let cancelled = false;

    const verify = async () => {
      try {
        const { authenticated, user } = await checkAuthSession();
        if (cancelled) return;

        if (authenticated && user) {
          setIsLoggedIn(true);
          setRole(user.role);
          setApiState({ phase: 'resolved', isAuthenticated: true, role: user.role });
        } else {
          setIsLoggedIn(false);
          setRole(null);
          setApiState({ phase: 'resolved', isAuthenticated: false, role: null });
        }
      } catch (err) {
        console.error('[ProtectedRoute] Auth check failed:', err);
        if (!cancelled) {
          setIsLoggedIn(false);
          setRole(null);
          setApiState({ phase: 'resolved', isAuthenticated: false, role: null });
        }
      }
    };

    verify();
    return () => { cancelled = true; };
  }, [isLoggedIn, contextRole, setIsLoggedIn, setRole]);

  const phase = (isLoggedIn && contextRole) ? 'resolved' : apiState.phase;
  const isAuthenticated = (isLoggedIn && contextRole) ? true : apiState.isAuthenticated;
  const role = (isLoggedIn && contextRole) ? contextRole : apiState.role;

  if (phase === 'loading') return <LoadingScreen />;

  if (!requireAuth) {
    return isAuthenticated
      ? <Navigate to={resolveAuthenticatedRedirect(role, authenticatedRedirect)} replace />
      : children;
  }

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;

  if (ADMIN_ROLES.includes(role)) {
    return <OnlyUserModal isOpen onClose={() => navigate(adminRedirect, { replace: true })} />;
  }

  if (!ALLOWED_ROLES.includes(role)) {
    console.warn(`[ProtectedRoute] Unrecognised role "${role}" — denying access.`);
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
