import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MdLockOutline } from 'react-icons/md';

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: ${({ theme }) => theme.colors.loadingBackground || "rgba(0, 0, 0, 0.3)"};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: ${({ theme }) => theme.zIndex.loadingScreen || 1000};
`;

const ModalContainer = styled(motion.div)`
  background: ${({ theme }) => theme.colors.lightBackground};
  padding: ${({ theme }) => `${theme.spacing.large} ${theme.spacing.medium}`};
  border-radius: ${({ theme }) => theme.borderRadius.xlarge};
  max-width: 320px;
  width: 100%;
  text-align: center;
  position: relative;
  box-shadow: ${({ theme }) => theme.colors.boxShadow};
`;

const IconWrapper = styled.div`
  background: ${({ theme }) => theme.colors.itemBackground || "#f1f5f9"};
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto ${({ theme }) => theme.spacing.medium};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.medium};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.spacing.xsmall};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.large};
`;

const ActionButton = styled.button`
  background-color: ${({ theme }) => theme.mainColors.blue};
  color: ${({ theme }) => theme.mainColors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => `${theme.spacing.small} ${theme.spacing.medium}`};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xsmall};
  width: 100%;
  justify-content: center;
  font-family: ${({ theme }) => theme.fonts.medium};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.mainColors.lightBlue || "#1d4ed8"};
  }
`;

const animationVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const AccessDeniedModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay onClick={onClose}>
          <ModalContainer
            variants={animationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <IconWrapper>
              <MdLockOutline size={22} color="#FF3333" />
            </IconWrapper>

            <Title>Access Denied</Title>
            <Description>
              You need to be logged in to access this page. Please log in and try again.
            </Description>

            <ActionButton onClick={onClose}>
              Login Now
            </ActionButton>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default AccessDeniedModal;
