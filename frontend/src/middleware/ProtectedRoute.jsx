import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { fetchUserDetails } from '../api/userAPI';
import OnlyUserModal from '../components/modals/OnlyUserModal';

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

const ProtectedRoute = ({ element: Element, requireAuth = true, onDeny = null }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const navigate = useNavigate();

  // Check if user is admin
  const checkUserRole = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('authToken');

      if (!user || !token) {
        return false;
      }

      const userData = await fetchUserDetails(user.id, token);
      
      if (userData.role === 'admin') {
        setIsAdminUser(true);
        setShowAdminModal(true);
        console.error('Access denied: Using Admin account please switch to a regular user account.');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  };

  // Check authentication status
  const checkAuthentication = async () => {
    try {
      const accessToken = localStorage.getItem('authToken');
      const refreshToken = document.cookie.match('(^|;)\\s*refreshToken\\s*=\\s*([^;]+)')?.pop();

      if (!accessToken) {
        setIsAuthenticated(false);
        return;
      }

      // Check if access token is expired
      const isAccessTokenExpired = isTokenExpired(accessToken);
      
      if (isAccessTokenExpired && refreshToken) {
        try {
          const newAccessToken = await refreshAccessToken(refreshToken);
          if (newAccessToken) {
            localStorage.setItem('authToken', newAccessToken);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error('Error refreshing token:', err);
          setIsAuthenticated(false);
        }
      } else if (!isAccessTokenExpired) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
    }
  };

  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  };

  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await fetch('/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token.');
      }

      const data = await response.json();
      return data.accessToken;
    } catch (err) {
      console.error('Error refreshing access token:', err);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      // First check authentication
      await checkAuthentication();
      
      // Then check user role if authenticated
      if (localStorage.getItem('authToken')) {
        await checkUserRole();
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Handle modal close
  const handleModalClose = () => {
    setShowAdminModal(false);
    // Optionally redirect to home or login page
    navigate('/login');
  };

  // Show loading spinner while checking authentication
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

  // Show admin modal if user is admin
  if (showAdminModal && isAdminUser) {
    return <OnlyUserModal isOpen={true} onClose={handleModalClose} />;
  }

  // If authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    if (typeof onDeny === 'function') {
      return onDeny();
    } else {
      navigate('/login');
      return null;
    }
  }

  // Render the protected component
  return <Element />;
};

export default ProtectedRoute;