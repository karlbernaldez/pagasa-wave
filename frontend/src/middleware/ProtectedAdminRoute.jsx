import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black background */
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

  // Check authentication and the user's role
  const checkAuthentication = async () => {
    const accessToken = localStorage.getItem('authToken');
    const refreshToken = document.cookie.match('(^|;)\\s*refreshToken\\s*=\\s*([^;]+)')?.pop(); // Extract refresh token from cookies

    if (!accessToken) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // If the access token is present, check if it's expired
    const isAccessTokenExpired = isTokenExpired(accessToken);
    if (isAccessTokenExpired && refreshToken) {
      try {
        // Try to refresh the token using the refresh token
        const newAccessToken = await refreshAccessToken(refreshToken);
        if (newAccessToken) {
          localStorage.setItem('authToken', newAccessToken);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(true);
      const decoded = jwtDecode(accessToken);
      setUserRole(decoded.role); // Set user role from decoded token
    }

    setIsLoading(false);
  };

  const isTokenExpired = (token) => {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now(); // Check if token is expired
  };

  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await fetch('/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include', // Make sure cookies are sent
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token.');
      }

      const data = await response.json();
      return data.accessToken; // Return new access token
    } catch (err) {
      console.error('Error refreshing access token:', err);
      return null;
    }
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
