import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
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

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include', // Send cookies
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);

        if (data.user.role === 'admin') {
          setIsAdminUser(true);
          setShowAdminModal(true);
          console.warn('Access denied: Admins cannot access this route.');
        }
      } else {
        setIsAuthenticated(false);
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

  if (requireAuth && !isAuthenticated) {
    return typeof onDeny === 'function' ? onDeny() : navigate('/login');
  }

  if (isAdminUser) {
    return <OnlyUserModal isOpen={true} onClose={handleModalClose} />;
  }

  return <Element />;
};

export default ProtectedRoute;
