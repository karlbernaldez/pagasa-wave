import styled from 'styled-components';

export const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: ${({ theme, $isDarkMode }) =>
    $isDarkMode
      ? 'rgba(15, 15, 35, 0.95)'
      : 'rgba(255, 255, 255, 0.95)'
  };
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: ${({ theme }) => theme.zIndex.loadingScreen || 9999};
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

export const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  border-radius: 16px;
  background: ${({ theme, $isDarkMode }) =>
    $isDarkMode
      ? 'rgba(30, 30, 50, 0.8)'
      : 'rgba(255, 255, 255, 0.8)'
  };
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme, $isDarkMode }) =>
    $isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  };
  box-shadow: ${({ theme, $isDarkMode }) =>
    $isDarkMode
      ? '0 20px 40px rgba(0, 0, 0, 0.3)'
      : '0 20px 40px rgba(0, 0, 0, 0.1)'
  };
`;

export const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid ${({ theme, $isDarkMode }) =>
    $isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  };
  border-top: 3px solid ${({ theme }) => theme.colors.primary || '#007bff'};
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const LoadingText = styled.div`
  color: ${({ theme, $isDarkMode }) =>
    $isDarkMode ? theme.colors.lightText : theme.colors.darkText
  };
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  letter-spacing: 0.5px;
`;