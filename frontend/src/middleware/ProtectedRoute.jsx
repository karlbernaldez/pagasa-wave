import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { checkAuthSession } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import OnlyUserModal from '@/components/ui/modals/OnlyUserModal';
import LoadingScreen from '@/components/ui/LoadingScreen';

const ALLOWED_ROLES = ['forecaster'];
const ADMIN_ROLES = ['admin'];

const resolveAuthenticatedRedirect = (role, fallback = '/studio') => {
  if (role === 'admin') return '/dashboard';
  if (role === 'forecaster') return '/studio';
  if (role === 'user') return '/';
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
  const [retryCount, setRetryCount] = useState(0);
  const [apiState, setApiState] = useState({
    phase: 'loading',
    isAuthenticated: false,
    role: null,
  });

  useEffect(() => {
    if (isLoggedIn && contextRole) return;

    let cancelled = false;

    const verify = async () => {
      setApiState((current) => ({ ...current, phase: 'loading' }));

      try {
        const { authenticated, user, unavailable } = await checkAuthSession({
          force: retryCount > 0,
        });
        if (cancelled) return;

        if (unavailable) {
          setApiState({ phase: 'unavailable', isAuthenticated: false, role: null });
          return;
        }

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
          setApiState({ phase: 'unavailable', isAuthenticated: false, role: null });
        }
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, contextRole, retryCount, setIsLoggedIn, setRole]);

  const phase = isLoggedIn && contextRole ? 'resolved' : apiState.phase;
  const isAuthenticated = isLoggedIn && contextRole ? true : apiState.isAuthenticated;
  const role = isLoggedIn && contextRole ? contextRole : apiState.role;

  if (phase === 'loading') return <LoadingScreen />;

  if (phase === 'unavailable') {
    return (
      <div className="grid min-h-[320px] place-items-center p-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-black text-slate-900">Unable to verify your session</h2>
          <p className="mt-2 text-sm font-medium text-slate-600">
            WaveLab could not reach the authentication service. Your session has not been treated as
            signed out.
          </p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-4 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!requireAuth) {
    return isAuthenticated ? (
      <Navigate to={resolveAuthenticatedRedirect(role, authenticatedRedirect)} replace />
    ) : (
      children
    );
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
