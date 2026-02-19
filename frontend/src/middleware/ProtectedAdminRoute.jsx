import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import OnlyAdminModal from '@/components/ui/modals/OnlyAdminModal';
import { useAuth } from '@/hooks/useAuth';

const ProtectedAdminRoute = ({ children, requireAuth = true, onDeny }) => {

  const { setIsLoggedIn } = useAuth();
  const [status, setStatus] = useState('loading');
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

          if (data.user.role === 'admin') {
            setStatus('admin');
          } else {
            setStatus('user');
          }

          return;
        }

        setIsLoggedIn(false);
        setStatus('guest');
      } catch (err) {
        console.error('Admin auth failed:', err);
        setIsLoggedIn(false);
        setStatus('guest');
      }
    };

    checkAuthentication();
  }, []);

  if (status === 'loading') return null;

  if (requireAuth && status === 'guest') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'user') {
    return onDeny
      ? onDeny()
      : (
        <OnlyAdminModal
          isOpen
          onClose={() => navigate('/')}
        />
      );
  }

  return children;
};

export default ProtectedAdminRoute;
