import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MdHourglassEmpty } from 'react-icons/md';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Make sure it's higher than the toolbar */
  pointer-events: all;
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

const ComingSoonModal = ({ isOpen, onClose }) => {
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
                            <MdHourglassEmpty size={22} color="#F59E0B" />
                        </IconWrapper>

                        <Title>Coming Soon</Title>
                        <Description>
                            This feature is still in development. Stay tuned it’ll be available in a future update!
                        </Description>

                        <ActionButton onClick={onClose}>
                            Got it
                        </ActionButton>
                    </ModalContainer>
                </Overlay>
            )}
        </AnimatePresence>
    );
};

export default ComingSoonModal;
