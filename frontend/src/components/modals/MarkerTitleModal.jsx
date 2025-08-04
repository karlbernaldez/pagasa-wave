import React, { useState, useEffect } from 'react';
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

const Input = styled.input`
  width: 90%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
  outline: none;

  &:focus {
    border-color: #2563eb;
  }
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

const MarkerTitleModal = ({ isOpen, onClose, onSave, inputValue, onInputChange }) => {

  const handleSave = () => {
    const title = inputValue || 'Untitled Marker';
    onSave(title);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave(); // Save when Enter key is pressed
    }
  };

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

            <Title>Enter Typhoon or Storm Name</Title>

            <Input
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="e.g. Kristine"
              onKeyDown={handleKeyDown}
            />

            <ActionButton onClick={handleSave}>
              Add Marker
            </ActionButton>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default MarkerTitleModal;
