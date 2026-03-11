import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { checkAuthSession } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import OnlyUserModal from '@/components/ui/modals/OnlyUserModal';
import LoadingScreen from '@/components/ui/LoadingScreen';

// ─── constants ────────────────────────────────────────────────────────────────

const ALLOWED_ROLES = ['user'];   // roles that may access user-facing routes
const ADMIN_ROLES   = ['admin'];  // roles that must be bounced to OnlyUserModal

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute
//
// Props:
//   children              ReactNode — rendered when access is granted
//   requireAuth           boolean   — true (default): auth required; false: guest-only
//   redirectTo            string    — where to send unauthenticated users (default: /login)
//   adminRedirect         string    — where the OnlyUserModal close button navigates (default: /login)
//   authenticatedRedirect string    — where authenticated users are sent on guest-only routes
// ─────────────────────────────────────────────────────────────────────────────

const ProtectedRoute = ({
  children,
  requireAuth = true,
  redirectTo = '/login',
  adminRedirect = '/login',
  authenticatedRedirect = '/studio',
}) => {
  const navigate = useNavigate();
  const { isLoggedIn, role: contextRole, setIsLoggedIn, setRole } = useAuth();

  // API-verified fallback — only used when context is empty (fresh page load / hard refresh)
  const [apiState, setApiState] = useState({ phase: 'loading', isAuthenticated: false, role: null });

  useEffect(() => {
    // ✅ Context already has auth info (populated during login flow) — skip API call entirely
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
          setApiState({ phase: 'resolved', isAuthenticated: false, role: null });
        }
      } catch (err) {
        console.error('[ProtectedRoute] Auth check failed:', err);
        if (!cancelled) {
          setIsLoggedIn(false);
          setApiState({ phase: 'resolved', isAuthenticated: false, role: null });
        }
      }
    };

    verify();
    return () => { cancelled = true; };
  }, [isLoggedIn, contextRole, setIsLoggedIn, setRole]);

  // ✅ Always derive from live context — reactive to every render, never stale.
  // Falls back to apiState only when context is empty (hard refresh scenario).
  const phase           = (isLoggedIn && contextRole) ? 'resolved'  : apiState.phase;
  const isAuthenticated = (isLoggedIn && contextRole) ? true        : apiState.isAuthenticated;
  const role            = (isLoggedIn && contextRole) ? contextRole : apiState.role;

  // ── Still checking ─────────────────────────────────────────────────────────
  if (phase === 'loading') return <LoadingScreen />;

  // ── Guest-only routes (e.g. /login, /register) ────────────────────────────
  if (!requireAuth) {
    return isAuthenticated
      ? <Navigate to={authenticatedRedirect} replace />
      : children;
  }

  // ── Auth-required routes ───────────────────────────────────────────────────
  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;

  // ── Role check: admins are not allowed in the user portal ─────────────────
  if (ADMIN_ROLES.includes(role)) {
    return <OnlyUserModal isOpen onClose={() => navigate(adminRedirect, { replace: true })} />;
  }

  // ── Role check: unknown / unrecognised roles ───────────────────────────────
  if (!ALLOWED_ROLES.includes(role)) {
    console.warn(`[ProtectedRoute] Unrecognised role "${role}" — denying access.`);
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;