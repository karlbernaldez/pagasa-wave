import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MdPlace } from 'react-icons/md';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.loadingBackground || "rgba(0, 0, 0, 0.3)"};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled(motion.div)`
  background: ${({ theme }) => theme.colors.lightBackground};
  padding: 30px 20px;
  border-radius: 16px;
  max-width: 320px;
  width: 100%;
  text-align: center;
  position: relative;
  box-shadow: ${({ theme }) => theme.colors.boxShadow};
  font-family: ${({ theme }) => theme.fonts.regular};
`;

const IconWrapper = styled.div`
  background: ${({ theme }) => theme.colors.itemBackground || "#f1f5f9"};
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 16px;
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.medium};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.spacing.small};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const ActionButton = styled.button`
  background-color: ${({ theme }) => theme.mainColors.blue};
  color: ${({ theme }) => theme.mainColors.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => `${theme.spacing.small} ${theme.spacing.medium}`};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-family: ${({ theme }) => theme.fonts.medium};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;
  margin-bottom: 10px;

  &:hover {
    background-color: ${({ theme }) => theme.mainColors.lightBlue};
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const animationVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const PointInputChoiceModal = ({ isOpen, onClose, onSelect }) => {
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
              <MdPlace size={22} color="#2563eb" />
            </IconWrapper>

            <Title>Select Marker Input Method</Title>

            <ActionButton onClick={() => onSelect('manual')}>
              Enter Latitude & Longitude
            </ActionButton>
            <ActionButton onClick={() => onSelect('map')}>
              Click on the Map
            </ActionButton>
            <ActionButton onClick={onClose}>
              Cancel
            </ActionButton>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default PointInputChoiceModal;
