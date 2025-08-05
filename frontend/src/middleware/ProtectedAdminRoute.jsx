import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const LoadingModal = styled.div`
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LoadingText = styled.div`
  margin-top: 10px;
  font-size: 18px;
  font-weight: bold;
`;

const LoadingSpinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ProtectedAdminRoute = ({ element: Element, requireAuth = true, onDeny = null }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  // Check authentication by making an API request to the backend
  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include', // Include cookies with the request
      });

      if (response.ok) {
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

  // Show a loading spinner while checking the authentication status
  if (isLoading) {
    return (
      <ModalBackdrop>
        <LoadingModal>
          <LoadingSpinner />
          <LoadingText>Loading...</LoadingText>
        </LoadingModal>
      </ModalBackdrop>
    );
  }

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
