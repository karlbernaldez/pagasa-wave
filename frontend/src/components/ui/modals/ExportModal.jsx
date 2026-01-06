import React from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  max-width: 450px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const IconWrapper = styled.div`
  width: 60px;
  height: 60px;
  margin: 0 auto 20px;
  background: rgba(72, 187, 120, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
`;

const Title = styled.h2`
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  color: #fff;
`;

const Message = styled.p`
  margin: 0 0 30px;
  font-size: 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const Button = styled.button`
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  ${props => props.$primary ? `
    background: rgba(72, 187, 120, 0.3);
    color: #fff;
    border: 1px solid rgba(72, 187, 120, 0.5);
    
    &:hover {
      background: rgba(72, 187, 120, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }
  `}
  
  &:active {
    transform: translateY(0);
  }
`;

const ExportConfirmModal = ({ visible, onConfirm, onCancel }) => {
  if (!visible) return null;

  return (
    <Overlay onClick={onCancel}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <IconWrapper>📦</IconWrapper>
        <Title>Export Project</Title>
        <Message>
          Are you sure you want to export this project? This will download all project data as a ZIP file.
        </Message>
        <ButtonGroup>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button $primary onClick={onConfirm}>
            Yes, Export
          </Button>
        </ButtonGroup>
      </ModalContainer>
    </Overlay>
  );
};

export default ExportConfirmModal;