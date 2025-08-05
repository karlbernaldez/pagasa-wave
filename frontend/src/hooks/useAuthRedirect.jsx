import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const useAuthRedirect = (redirectPath = '/edit') => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include', // ensures cookie is sent
        });

        if (response.ok) {
          // User is authenticated
          navigate(redirectPath);
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
