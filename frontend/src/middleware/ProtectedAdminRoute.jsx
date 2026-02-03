import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { refreshAccessToken } from '@/api/auth';

const AUTH_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

const checkRoute = `${AUTH_API_BASE_URL}/check`;

const ProtectedAdminRoute = ({ element: Element, requireAuth = true, onDeny = null }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  // Check authentication by making an API request to the backend
  const checkAuthentication = async () => {
    try {
      const response = await fetch(checkRoute, {
        method: 'GET',
        credentials: 'include', // Include cookies with the request
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUserRole(data.user.role);

      } else if (response.status === 403) {
        await refreshAccessToken();
        const response = await fetch(checkRoute, {
          method: 'GET',
          credentials: 'include', // Send cookies
        });
        const data = await response.json();
        setIsAuthenticated(true);
        setUserRole(data.user.role);

      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error during authentication check:', error);
      setIsAuthenticated(false);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  // If authentication is required and the user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return typeof onDeny === 'function' ? onDeny() : navigate('/login');
  }

  // If the user is not an admin, deny access
  if (userRole !== 'admin') {
    return typeof onDeny === 'function' ? onDeny() : navigate('/unauthorized'); // Redirect to an unauthorized page if role doesn't match
  }

  return <Element />;
};

export default ProtectedAdminRoute;
