// src/components/menu/ProjectMenu.styles.js

import styled from 'styled-components';

export const Wrapper = styled.div`
  position: fixed;
  top: 1.15rem;
  left: 1.5rem;
  z-index: ${({ theme }) => theme.zIndex.stickyHeader};
  font-family: ${({ theme }) => theme.fonts.regular};
`;

export const MenuButton = styled.button`
  background: ${({ theme }) => theme.colors.lightBackground};
  color: ${({ theme }) => theme.colors.textPrimary};
  border: 1px solid ${({ theme }) => theme.colors.border || '#ccc'};
  padding: 0.45rem 0.9rem;
  font-size: 0.95rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.colors.boxShadow};
  transition: all 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.background};
    transform: scale(1.03);
  }
`;

export const Dropdown = styled.div`
  margin-top: 0.5rem;
  background: ${({ theme }) => theme.colors.lightBackground};
  border: 1px solid ${({ theme }) => theme.colors.border || '#ddd'};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  min-width: 180px;
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => theme.colors.boxShadow};
`;

export const MenuItem = styled.button`
  background: transparent;
  border: none;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  text-align: left;
  cursor: pointer;
  color: ${({ $danger, theme }) =>
    $danger ? theme.mainColors.blue : theme.colors.textPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: background-color 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

export const SubDropdown = styled.div`
  position: absolute;
  top: 3.5rem;
  left: 100%;
  margin-left: 0.5rem;
  background: ${({ theme }) => theme.colors.lightBackground};
  border: 1px solid ${({ theme }) => theme.colors.border || '#ccc'};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  display: flex;
  flex-direction: column;
  min-width: 160px;
  box-shadow: ${({ theme }) => theme.colors.boxShadow};
`;

export const SubMenuItem = styled(MenuItem)`
  padding: 0.65rem 1rem;
`;

export const LoadingModal = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: ${({ theme }) => theme.colors.loadingBackground};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: ${({ theme }) => theme.zIndex.loadingScreen};
  color: ${({ theme }) => theme.colors.loadingText};
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  user-select: none;
`;
