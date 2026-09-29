import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { checkAuthSession } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import {
  hasAnyEffectivePermission,
  hasEffectivePermission,
  hasEveryEffectivePermission,
  resolveAuthenticatedLandingPath,
} from '@/core/auth/resolveLandingPath';
import LoadingScreen from '@/components/ui/LoadingScreen';

const ProtectedRoute = ({
  children,
  requireAuth = true,
  redirectTo = '/login',
  authenticatedRedirect = '/',
  permission = null,
  requireAll = [],
  requireAny = [],
  deniedRedirect = '/',
}) => {
  const { setIsLoggedIn, setRole } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const [apiState, setApiState] = useState({
    phase: 'loading',
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      setApiState((current) => ({ ...current, phase: 'loading' }));

      try {
        const { authenticated, user, unavailable } = await checkAuthSession({
          force: retryCount > 0,
        });
        if (cancelled) return;

        if (unavailable) {
          setApiState({ phase: 'unavailable', isAuthenticated: false, user: null });
          return;
        }

        if (authenticated && user) {
          setIsLoggedIn(true);
          setRole(user.role);
          setApiState({ phase: 'resolved', isAuthenticated: true, user });
        } else {
          setIsLoggedIn(false);
          setRole(null);
          setApiState({ phase: 'resolved', isAuthenticated: false, user: null });
        }
      } catch (err) {
        console.error('[ProtectedRoute] Auth check failed:', err);
        if (!cancelled) {
          setApiState({ phase: 'unavailable', isAuthenticated: false, user: null });
        }
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [retryCount, setIsLoggedIn, setRole]);

  if (apiState.phase === 'loading') return <LoadingScreen />;

  if (apiState.phase === 'unavailable') {
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
    return apiState.isAuthenticated ? (
      <Navigate
        to={resolveAuthenticatedLandingPath(apiState.user, authenticatedRedirect)}
        replace
      />
    ) : (
      children
    );
  }

  if (!apiState.isAuthenticated) return <Navigate to={redirectTo} replace />;

  const allowedByPermission = !permission || hasEffectivePermission(apiState.user, permission);
  const allowedByAll = !requireAll.length || hasEveryEffectivePermission(apiState.user, requireAll);
  const allowedByAny = !requireAny.length || hasAnyEffectivePermission(apiState.user, requireAny);

  if (!allowedByPermission || !allowedByAll || !allowedByAny) {
    const fallback = resolveAuthenticatedLandingPath(apiState.user, deniedRedirect);
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
