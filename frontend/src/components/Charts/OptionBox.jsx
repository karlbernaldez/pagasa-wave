import React from "react";
import styled from "styled-components";

const OptionBoxStyled = styled.div`
  height: 36px;
  padding: 0 1rem;
  min-width: 100px;
  background-color: ${({ active, theme }) =>
    active ? theme.mainColors.blue : "transparent"};
  color: ${({ active, theme }) =>
    active ? theme.colors.textPrimary : theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.light};
  font-size: ${({ theme }) => theme.fontSizes.medium};
  font-weight: ${({ theme }) => theme.fontWeights.light};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.xsmall};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.highlight};
    color: ${({ theme }) => theme.colors.textPrimary};
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 20px rgba(1, 176, 239, 0.4);
  }

  @media (max-width: 768px) {
    min-width: 90px;
    font-size: ${({ theme }) => theme.fontSizes.small};
    padding: 0 0.75rem;
  }

  @media (max-width: 480px) {
    min-width: 80px;
    font-size: ${({ theme }) => theme.fontSizes.xsmall};
    padding: 0 0.5rem;
  }
`;

const OptionBox = ({ active, onClick, children }) => (
  <OptionBoxStyled active={active} onClick={onClick}>
    {children}
  </OptionBoxStyled>
);

export default OptionBox;
