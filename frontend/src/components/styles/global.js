import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    scroll-behavior: smooth;
    font-size: 16px;
  }

  body {
    font-family: 'Segoe UI', 'Roboto', 'Open Sans', sans-serif;
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    overflow-x: hidden;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
  }

  a {
    text-decoration: none;
  }
`;

export const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${({ theme, $isDarkMode }) => $isDarkMode ? theme.colors.darkBackground : theme.colors.lightBackground};
  transition: all 0.3s;
`;

export const MainContent = styled.main`
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  pointer-events: ${({ $isloading }) => ($isloading ? 'none' : 'auto')};
  opacity: ${({ $isloading }) => ($isloading ? 0.7 : 1)};
`;

export const FooterWrapper = styled.div`
  margin-top: auto;
  transition: all 0.3s;
`;

export const ErrorBoundaryFallback = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  text-align: center;
  color: '#dc3545';

  h2 {
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  p {
    margin-bottom: 1.5rem;
    opacity: 0.8;
  }

  button {
    padding: 0.75rem 1.5rem;
    background: white;
    color: white;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    }
  }
`;