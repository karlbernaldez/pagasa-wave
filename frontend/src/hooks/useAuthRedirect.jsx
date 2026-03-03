import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { checkAuthSession } from '@/api/auth';

const useAuthRedirect = (redirectPath = '/studio') => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { authenticated, user } = await checkAuthSession();
        if (authenticated && user) {
          const nextPath = user.role === 'admin' ? '/dashboard' : redirectPath;
          navigate(nextPath);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        // Do nothing or show a login prompt if needed
      }
    };

    checkAuth();
  }, [navigate, redirectPath]);
};

export default useAuthRedirect;
