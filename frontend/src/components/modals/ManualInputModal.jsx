import React, { useState } from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: ${({ theme }) => theme.colors.loadingBackground || "rgba(0, 0, 0, 0.4)"};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: ${({ theme }) => theme.zIndex.loadingScreen || 1001};
`;

const ModalContainer = styled(motion.div)`
  background: ${({ theme }) => theme.colors.lightBackground};
  padding: ${({ theme }) => `${theme.spacing.large} ${theme.spacing.medium}`};
  border-radius: ${({ theme }) => theme.borderRadius.xlarge};
  width: 90%;
  max-width: 360px;
  text-align: center;
  box-shadow: ${({ theme }) => theme.colors.boxShadow};
`;

const Title = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.medium};
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.medium};
`;

const Input = styled.input`
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.medium};
  padding: ${({ theme }) => theme.spacing.small};
  font-size: ${({ theme }) => theme.fontSizes.medium};
  border: 1px solid ${({ theme }) => theme.colors.border || "#d1d5db"};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-sizing: border-box;
  font-family: ${({ theme }) => theme.fonts.regular};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.highlight};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.highlight}33;
  }
`;

const Button = styled.button`
  background-color: ${({ theme }) => theme.mainColors.blue};
  color: ${({ theme }) => theme.mainColors.white};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.medium};
  font-size: ${({ theme }) => theme.fontSizes.medium};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  font-family: ${({ theme }) => theme.fonts.medium};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.mainColors.lightBlue};
  }
`;

const isValidFloat = (value) => {
  if (typeof value !== 'string') return false;
  if (value.trim() === '') return false;
  return !isNaN(value) && !isNaN(parseFloat(value));
};

const ManualInputModal = ({ isOpen, onClose, onSubmit }) => {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isValidFloat(lat)) {
      return alert('Please enter a valid latitude number.');
    }
    if (!isValidFloat(lng)) {
      return alert('Please enter a valid longitude number.');
    }
    if (!title.trim()) {
      return alert('Storm Title is required.');
    }

    onSubmit({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      title: title.trim(),
    });

    // Clear inputs after submit (optional)
    setLat('');
    setLng('');
    setTitle('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay onClick={onClose}>
          <ModalContainer
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <Title>Enter Storm Marker</Title>
              <Input
                type="number"
                placeholder="Latitude"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Longitude"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Storm Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Button type="submit">Submit</Button>
            </form>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default ManualInputModal;
