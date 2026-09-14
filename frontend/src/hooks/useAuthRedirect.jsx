import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { checkAuthSession } from '@/api/auth';
import { resolveAuthenticatedLandingPath } from '@/core/auth/resolveLandingPath';

const useAuthRedirect = (redirectPath = '/') => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { authenticated, user } = await checkAuthSession();
        if (authenticated && user) {
          navigate(resolveAuthenticatedLandingPath(user, redirectPath));
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    };

    checkAuth();
  }, [navigate, redirectPath]);
};

export default useAuthRedirect;
