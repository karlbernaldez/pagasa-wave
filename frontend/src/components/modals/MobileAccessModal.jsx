import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MdWarningAmber } from 'react-icons/md';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled(motion.div)`
  background: white;
  padding: 30px 20px;
  border-radius: 16px;
  max-width: 320px;
  width: 100%;
  text-align: center;
  position: relative;
  box-shadow: 0px 12px 30px rgba(0, 0, 0, 0.1);
`;

const IconWrapper = styled.div`
  background: #f1f5f9;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 16px;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
`;

const ActionButton = styled.button`
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;

  &:hover {
    background-color: #1d4ed8;
  }
`;

const animationVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const MobileAccessModal = ({ isOpen, onClose }) => {
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
              <MdWarningAmber size={22} color="#FF3333" />
            </IconWrapper>

            <Title>Access Restricted</Title>
            <Description>
              This feature is not available on smaller screens. Please switch to desktop or maximize your window.
            </Description>

            <ActionButton onClick={onClose}>
              Okay, got it
            </ActionButton>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default MobileAccessModal;
