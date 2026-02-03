import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import OnlyUserModal from '../components/ui/modals/OnlyUserModal';
import { refreshAccessToken } from '@/api/auth';

const ProtectedRoute = ({ element: Element, requireAuth = true, onDeny = null, setIsLoggedIn }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const navigate = useNavigate();

  const AUTH_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

  const checkRoute = `${AUTH_API_BASE_URL}/check`;

  const checkAuthentication = async () => {
    try {
      const response = await fetch(checkRoute, {
        method: 'GET',
        credentials: 'include', // Send cookies
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setIsLoggedIn(true);

        if (data.user.role === 'admin') {
          setIsAdminUser(true);
          setShowAdminModal(true);
          console.warn('Access denied: Admins cannot access this route.');
        }

      } else if (response.status === 403) {
        const response = await refreshAccessToken();
        setIsAuthenticated(true);
        setIsLoggedIn(true);

      } else {
        setIsAuthenticated(false);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const handleModalClose = () => {
    setShowAdminModal(false);
    navigate('/login');
  };

  if (requireAuth && !isAuthenticated) {
    return typeof onDeny === 'function' ? onDeny() : <Navigate to="/login" replace />;
  }

  if (isAdminUser) {
    return <OnlyUserModal isOpen={true} onClose={handleModalClose} />;
  }

  return <Element />;
};

export default ProtectedRoute;
