import React from 'react';
import styled from 'styled-components';
import { theme, darkTheme } from "../../styles/theme";

// Styled Components
const Box = styled.div`
  position: fixed;
  bottom: 0.75rem;
  left: 0.75rem;
  width: clamp(18rem, 25vw, 24rem);
  max-height: clamp(12rem, 20vh, 18rem);
  padding: 1rem 1.25rem;
  background: ${({ theme }) => theme.colors.lightBackground};
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme }) => theme.colors.border || '#e5e7eb'};
  border-radius: 0.75rem;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.04);
  z-index: 50;
  overflow-y: auto;
  transition: all 0.3s ease;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border || '#d1d5db'};
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textSecondary || '#9ca3af'};
  }

  /* Responsive breakpoints */
  @media (max-width: 1200px) {
    width: clamp(16rem, 28vw, 22rem);
    padding: 0.875rem 1rem;
    bottom: 0.5rem;
    left: 0.5rem;
  }

  @media (max-width: 768px) {
    width: clamp(14rem, 32vw, 20rem);
    padding: 0.75rem 0.875rem;
    max-height: clamp(10rem, 18vh, 15rem);
  }

  /* Dark theme enhancements */
  ${({ theme }) => theme.colors.background === darkTheme.colors.background && `
    background: ${theme.colors.lightBackground}CC;
    border-color: ${theme.colors.border || '#374151'};
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.25),
      0 2px 4px rgba(0, 0, 0, 0.15);
  `}
`;

const Title = styled.h3`
  font-weight: 600;
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 0.625rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border || '#e5e7eb'};
  padding-bottom: 0.375rem;
  letter-spacing: 0.025em;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 2rem;
    height: 2px;
    background: linear-gradient(90deg, #01a0da, #0ea5e9);
    border-radius: 1px;
  }
`;

const List = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem 0.875rem;

  @media (max-width: 1200px) {
    gap: 0.25rem 0.75rem;
  }
`;

const ListItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: clamp(0.75rem, 1.2vw, 0.825rem);
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 500;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.textSecondary || '#6b7280'};
  }

  @media (max-width: 1200px) {
    gap: 0.4rem;
    font-size: clamp(0.7rem, 1.1vw, 0.8rem);
  }
`;

const SymbolWrapper = styled.span`
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  @media (max-width: 1200px) {
    width: 1.125rem;
    height: 1.125rem;
  }
`;

const Line = styled.div`
  height: 0.25rem;
  width: 1rem;
  background-color: ${({ color }) => color};
  border-radius: ${({ rounded }) => (rounded ? '9999px' : '0.125rem')};
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const Letter = styled.span`
  font-weight: 700;
  font-size: clamp(0.875rem, 1.4vw, 1rem);
  color: ${({ color }) => color};
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const Footer = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  font-size: clamp(0.625rem, 1vw, 0.7rem);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${({ theme }) => theme.colors.textSecondary || '#6b7280'};
  border-top: 1px solid ${({ theme }) => theme.colors.border || '#f3f4f6'};
  font-weight: 500;

  strong {
    color: #01a0da;
    font-weight: 600;
    letter-spacing: 0.025em;
  }

  @media (max-width: 1200px) {
    margin-top: 0.625rem;
    padding-top: 0.375rem;
  }
`;

const IconImage = styled.img`
  width: 1.25rem;
  height: 1.25rem;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }

  @media (max-width: 1200px) {
    width: 1.125rem;
    height: 1.125rem;
  }
`;

const FrontGradient = styled.div`
  width: 1.5rem;
  height: 0.25rem;
  background-image: linear-gradient(
    to right, 
    #2563eb 25%, 
    #ef4444 25%, 
    #ef4444 50%, 
    #2563eb 50%, 
    #2563eb 75%, 
    #ef4444 75%
  );
  background-size: 100% 100%;
  border-radius: 0.125rem;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }

  @media (max-width: 1200px) {
    width: 1.25rem;
  }
`;

// Legend item component
const LegendItem = ({ label, symbol }) => (
  <ListItem>
    <SymbolWrapper>{symbol}</SymbolWrapper>
    <span>{label}</span>
  </ListItem>
);

// Enhanced LegendBox component
const LegendBox = () => {
  return (
    <Box>
      <Title>Legend</Title>
      <List>
        <LegendItem
          label="Wave Heights"
          symbol={
            <IconImage
              src="/wave.png"
              alt="Wave Height"
            />
          }
        />
        <LegendItem
          label="Tropical Cyclone"
          symbol={
            <IconImage
              src="/hurricane.png"
              alt="Tropical Cyclone"
            />
          }
        />
        <LegendItem 
          label="LPA" 
          symbol={<Letter color="#dc2626">L</Letter>} 
        />
        <LegendItem 
          label="HPA" 
          symbol={<Letter color="#2563eb">H</Letter>} 
        />
        <LegendItem 
          label="Surface Fronts"
          symbol={<FrontGradient />}
        />
      </List>
      <Footer>
        <span>Checked: <strong>RBB</strong></span>
        <span>By: <strong>MACD</strong></span>
      </Footer>
    </Box>
  );
};

export default LegendBox;