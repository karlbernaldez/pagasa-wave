import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import OnlyUserModal from '../components/ui/modals/OnlyUserModal';
import { refreshAccessToken } from '@/api/auth';

const ProtectedRoute = ({
  element: Element,
  requireAuth = true,
  onDeny,
  setIsLoggedIn,
}) => {
  const [status, setStatus] = useState('loading'); 
  // 'loading' | 'guest' | 'user' | 'admin'

  const navigate = useNavigate();

  const AUTH_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/auth`;
  const checkRoute = `${AUTH_API_BASE_URL}/check`;

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const res = await fetch(checkRoute, {
          method: 'GET',
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(true);

          setStatus(data.user.role === 'admin' ? 'admin' : 'user');
          return;
        }

        if (res.status === 403) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            setIsLoggedIn(true);
            setStatus('user');
            return;
          }
        }

        setIsLoggedIn(false);
        setStatus('guest');
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsLoggedIn(false);
        setStatus('guest');
      }
    };

    checkAuthentication();
  }, [setIsLoggedIn]);

  /* ----------------------------------
     1. LOADING → render nothing / loader
     ---------------------------------- */
  if (status === 'loading') {
    return null;
  }

  /* ----------------------------------
     2. NOT AUTHENTICATED
     ---------------------------------- */
  if (requireAuth && status === 'guest') {
    return typeof onDeny === 'function'
      ? onDeny()
      : <Navigate to="/login" replace />;
  }

  /* ----------------------------------
     3. ADMIN BLOCK
     ---------------------------------- */
  if (status === 'admin') {
    return (
      <OnlyUserModal
        isOpen
        onClose={() => navigate('/login')}
      />
    );
  }

  /* ----------------------------------
     4. ALLOWED
     ---------------------------------- */
  return <Element />;
};

export default ProtectedRoute;
