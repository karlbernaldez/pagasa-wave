import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import OnlyAdminModal from '@/components/ui/modals/OnlyAdminModal';
import { useAuth } from '@/hooks/useAuth';
import { checkAuthSession } from '@/api/auth';

const ProtectedAdminRoute = ({ children, requireAuth = true, onDeny }) => {
  const { setIsLoggedIn } = useAuth();
  const [status, setStatus] = useState('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const { authenticated, user } = await checkAuthSession();

        if (authenticated && user) {
          setIsLoggedIn(true);
          setStatus(user.role === 'admin' ? 'admin' : 'user');
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
  }, [setIsLoggedIn]);

  if (status === 'loading') return null;

  if (requireAuth && status === 'guest') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'user') {
    return onDeny ? onDeny() : <OnlyAdminModal isOpen onClose={() => navigate('/')} />;
  }

  return children;
};

export default ProtectedAdminRoute;