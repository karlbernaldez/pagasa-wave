import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import OnlyAdminModal from '@/components/ui/modals/OnlyAdminModal';
import { useAuth } from '@/hooks/useAuth';
import { checkAuthSession } from '@/api/auth';

const ProtectedAdminRoute = ({ children, requireAuth = true, onDeny }) => {
  const { setIsLoggedIn } = useAuth();
  const [status, setStatus] = useState('loading');
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const checkAuthentication = async () => {
      setStatus('loading');

      try {
        const { authenticated, user, unavailable } = await checkAuthSession({
          force: retryCount > 0,
        });
        if (cancelled) return;

        if (unavailable) {
          setStatus('unavailable');
          return;
        }

        if (authenticated && user) {
          setIsLoggedIn(true);
          setStatus(user.role === 'admin' ? 'admin' : 'user');
          return;
        }

        setIsLoggedIn(false);
        setStatus('guest');
      } catch (err) {
        console.error('Admin auth failed:', err);
        if (!cancelled) setStatus('unavailable');
      }
    };

    checkAuthentication();
    return () => {
      cancelled = true;
    };
  }, [retryCount, setIsLoggedIn]);

  if (status === 'loading') return null;

  if (status === 'unavailable') {
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

  if (requireAuth && status === 'guest') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'user') {
    return onDeny ? onDeny() : <OnlyAdminModal isOpen onClose={() => navigate('/')} />;
  }

  return children;
};

export default ProtectedAdminRoute;
