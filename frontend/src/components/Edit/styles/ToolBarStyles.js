import styled from 'styled-components';

export const ToolbarContainer = styled.div`
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  align-items: center;
  background: ${({ theme }) => theme.colors.lightBackground};
  border: 1px solid #d1d5db;
  border-radius: 30px;
  padding: 0.3rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); /* small shadow added */
  z-index: 999;
  gap: 0.75rem;
`;

export const ToolButton = styled.button`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: ${({ active, theme }) =>
    active ? theme.colors.activeButtonBackground : theme.colors.lightBackground};
  color: ${({ active, theme }) =>
    active ? theme.colors.activeButtonColor : theme.colors.buttonColor};
  border: none;
  box-shadow: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: scale(1.1);
    background-color: ${({ theme }) => theme.colors.buttonHoverBackground};
  }

  &:active {
    background-color: ${({ theme }) => theme.colors.buttonActiveBackground};
  }
`;

export const CollapseToggle = styled.button`
  width: 40px;
  height: 40px;
  background: ${({ theme }) => theme.colors.lightBackground};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: none;
  color: ${({ theme }) => theme.colors.buttonColor};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  opacity: 80%;

  &:hover {
    transform: rotate(90deg);
    color: ${({ theme }) => theme.colors.buttonHoverColor};
    background-color: ${({ theme }) => theme.colors.buttonHoverBackground};
  }
`;