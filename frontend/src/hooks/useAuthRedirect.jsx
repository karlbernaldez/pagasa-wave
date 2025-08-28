import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const useAuthRedirect = (redirectPath = '/wavelab') => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        
        if (response.ok) {
          if (data.user.role === 'admin') {
            redirectPath = '/dashboard';
          }
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
