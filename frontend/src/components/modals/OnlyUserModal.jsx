import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, LogOut, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  padding: 20px;
`;

const ModalContainer = styled(motion.div)`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 32px;
  border-radius: 16px;
  max-width: 28rem;
  width: 100%;
  text-align: center;
  position: relative;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
    transform: scale(1.1);
  }
`;

const IconWrapper = styled.div`
  background: ${props => props.variant === 'warning'
    ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
    : 'linear-gradient(135deg, #e2f3feff 0%, #cad3feff 100%)'};
  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 24px;
  position: relative;
  box-shadow: ${props => props.variant === 'warning'
    ? '0 8px 16px rgba(245, 158, 11, 0.2)'
    : '0 8px 16px rgba(68, 114, 239, 0.2)'};
  
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: ${props => props.variant === 'warning'
    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
    : 'linear-gradient(135deg, #ef4444, #dc2626)'};
    border-radius: 50%;
    z-index: -1;
    opacity: 0.1;
  }
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #1e293b;
  background: linear-gradient(135deg, #1e293b 0%, #64748b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
`;

const Subtitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${props => props.variant === 'warning' ? '#f59e0b' : '#ef4444'};
  opacity: 0.9;
`;

const Description = styled.p`
  font-size: 14px;
  color: #64748b;
  margin-bottom: 32px;
  line-height: 1.6;
  font-weight: 400;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-direction: column;
  
  @media (min-width: 640px) {
    flex-direction: row;
  }
`;

const PrimaryButton = styled.button`
  background: ${props => props.variant === 'warning'
    ? 'linear-gradient(to right, #f59e0b 0%, #d97706 100%)'
    : 'linear-gradient(to right, #2563eb 0%, #1d4ed8 100%)'};
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 24px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.3s ease;
  flex: 1;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    background: ${props => props.variant === 'warning'
    ? 'linear-gradient(to right, #d97706 0%, #b45309 100%)'
    : 'linear-gradient(to right, #1d4ed8 0%, #1e40af 100%)'};
    transform: translateY(-2px);
    box-shadow: ${props => props.variant === 'warning'
    ? '0 8px 16px rgba(245, 158, 11, 0.3)'
    : '0 8px 16px rgba(37, 99, 235, 0.3)'};
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: #64748b;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.3s ease;
  flex: 1;
  
  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #475569;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const EditAccessModal = ({ isOpen, onClose }) => {
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);

  const handleLogin = () => {
    setShowSignOutModal(true);
  };

  const handleCreateAccount = () => {
    setShowCreateAccountModal(true);
  };

  const handleProceedWithSignOut = () => {
    setShowSignOutModal(false);
    onClose();
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const handleStaySignedIn = () => {
    setShowSignOutModal(false);
  };

  const handleProceedWithRegister = () => {
    setShowCreateAccountModal(false);
    onClose();
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "/register";
  };

  const handleCancelRegister = () => {
    setShowCreateAccountModal(false);
  };

  const animationVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && !showSignOutModal && !showCreateAccountModal && (
        <Overlay
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <ModalContainer
            variants={animationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <CloseButton onClick={onClose}>
              <X size={18} />
            </CloseButton>

            <IconWrapper>
              <User size={28} color="#2563eb" />
            </IconWrapper>

            <Title>Edit Access Required</Title>
            <Subtitle>Standard User Account Needed</Subtitle>
            <Description>
              To edit this content, you need to be signed in with a standard user account. Please sign in to your existing account or create a new one to continue.
            </Description>

            <ButtonGroup>
              <PrimaryButton onClick={handleLogin}>
                <User size={16} />
                Sign In
              </PrimaryButton>
              <SecondaryButton onClick={handleCreateAccount}>
                Create Account
              </SecondaryButton>
            </ButtonGroup>
          </ModalContainer>
        </Overlay>
      )}

      {showSignOutModal && (
        <Overlay
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={() => setShowSignOutModal(false)}
        >
          <ModalContainer
            variants={animationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <CloseButton onClick={() => setShowSignOutModal(false)}>
              <X size={18} />
            </CloseButton>

            <IconWrapper variant="warning">
              <AlertTriangle size={28} color="#f59e0b" />
            </IconWrapper>

            <Title>Switch Account Required</Title>
            <Subtitle variant="warning">Current Session Will End</Subtitle>
            <Description>
              To access editing features, you'll need to sign out of your current session and sign in with a standard user account. Your current session will be terminated.
            </Description>

            <ButtonGroup>
              <PrimaryButton variant="warning" onClick={handleProceedWithSignOut}>
                <LogOut size={16} />
                Sign Out & Continue
              </PrimaryButton>
              <SecondaryButton onClick={handleStaySignedIn}>
                Stay Signed In
              </SecondaryButton>
            </ButtonGroup>
          </ModalContainer>
        </Overlay>
      )}

      {showCreateAccountModal && (
        <Overlay
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={() => setShowCreateAccountModal(false)}
        >
          <ModalContainer
            variants={animationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <CloseButton onClick={() => setShowCreateAccountModal(false)}>
              <X size={18} />
            </CloseButton>

            <IconWrapper variant="warning">
              <AlertTriangle size={28} color="#f59e0b" />
            </IconWrapper>

            <Title>Account Registration Required</Title>
            <Subtitle variant="warning">Current Session Will End</Subtitle>
            <Description>
              To create a new standard user account, you'll need to sign out of your current session first. This will terminate your current session and redirect you to the registration page.
            </Description>

            <ButtonGroup>
              <PrimaryButton variant="warning" onClick={handleProceedWithRegister}>
                <LogOut size={16} />
                Sign Out & Register
              </PrimaryButton>
              <SecondaryButton onClick={handleCancelRegister}>
                Stay Signed In
              </SecondaryButton>
            </ButtonGroup>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default EditAccessModal;