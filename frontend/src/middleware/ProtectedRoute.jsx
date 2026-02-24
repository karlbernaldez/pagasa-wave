import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import OnlyUserModal from '../components/ui/modals/OnlyUserModal';
import { checkAuthSession } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';

const ProtectedRoute = ({ children, requireAuth = true, onDeny }) => {
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
        console.error('Auth check failed:', err);
        setIsLoggedIn(false);
        setStatus('guest');
      }
    };

    checkAuthentication();
  }, [setIsLoggedIn]);

  if (status === 'loading') return null;

  if (requireAuth && status === 'guest') {
    return typeof onDeny === 'function' ? onDeny() : <Navigate to="/login" replace />;
  }

  if (status === 'admin') {
    return <OnlyUserModal isOpen onClose={() => navigate('/login')} />;
  }

  return children;
};

export default ProtectedRoute;