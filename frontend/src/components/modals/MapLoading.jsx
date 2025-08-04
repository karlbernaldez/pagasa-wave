import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaSpinner } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const rotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 15, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
`;

const Modal = styled.div`
  background: rgb(255, 255, 255);
  padding: 2rem 2.5rem;
  border-radius: 16px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  animation: ${fadeIn} 0.3s ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Spinner = styled(FaSpinner)`
  font-size: 2rem;
  color: #0077ff;
  animation: ${rotate} 1s linear infinite;
  margin-bottom: 1rem;
`;

const Text = styled.p`
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
  margin: 0;
  max-width: 300px;
`;

const loadingSteps = [
  "Initializing map...",
  "Loading map layers...",
  "Finalizing setup...",
];

const MapLoading = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [show, setShow] = useState(false); // delay modal visibility

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(true);
    }, 500); // 1 second delay before showing modal

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setStepIndex((prev) =>
        prev < loadingSteps.length - 1 ? prev + 1 : prev
      );
    }, 500); // change step every 0.5s

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  return (
    <Backdrop>
      <Modal>
        <Spinner />
        <Text>{loadingSteps[stepIndex]}</Text>
      </Modal>
    </Backdrop>
  );
};

export default MapLoading;
