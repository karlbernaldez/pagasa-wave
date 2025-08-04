import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MdLockOutline, MdClose } from 'react-icons/md';

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContainer = styled(motion.div)`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 32px;
  border-radius: 20px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  position: relative;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.8);
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
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 24px;
  position: relative;
  box-shadow: 0 8px 16px rgba(239, 68, 68, 0.2);
  
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
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
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
`;

const Subtitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #ef4444;
  opacity: 0.9;
`;

const Description = styled.p`
  font-size: 15px;
  color: #64748b;
  margin-bottom: 32px;
  line-height: 1.6;
  font-weight: 400;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-direction: column;
  
  @media (min-width: 400px) {
    flex-direction: row;
  }
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
    
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

const AccessDeniedModal = ({ isOpen, onClose }) => {
  const handleContactSupport = () => {
    // Handle contact support logic here
    console.log('Contact support clicked');
  };
  const handleProceedWithSignOut = () => {
    onClose();
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <Overlay onClick={onClose}>
            <ModalContainer
              variants={animationVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <CloseButton onClick={onClose}>
                <MdClose size={18} />
              </CloseButton>

              <IconWrapper>
                <MdLockOutline size={28} color="#ef4444" />
              </IconWrapper>

              <Title>Access Restricted</Title>
              <Subtitle>Admin Credentials Required</Subtitle>
              <Description>
                This page requires administrator privileges to access. Please log in with your admin account or contact support if you need assistance.
              </Description>

              <ButtonGroup>
                <ActionButton onClick={handleProceedWithSignOut}>
                  <MdLockOutline size={16} />
                  Login as Admin
                </ActionButton>
                <SecondaryButton onClick={handleContactSupport}>
                  Contact Support
                </SecondaryButton>
              </ButtonGroup>
            </ModalContainer>
          </Overlay>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AccessDeniedModal;