import styled from 'styled-components';

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.colors.loadingBackground || "rgba(0, 0, 0, 0.4)"};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

export const ModalContainer = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.lightBackground};
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalSlideIn 0.3s ease-out;

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

export const ModalHeader = styled.div`
  padding: 24px 24px 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
`;

export const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: #6b7280;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

export const ModalBody = styled.div`
  padding: 0 24px 24px 24px;
`;

export const Section = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

export const FieldLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const FieldInput = styled.input`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: ${({ theme }) => theme.colors.lightBackground};
  color: #6b7280;
  cursor: not-allowed;
  
  &:focus {
    outline: none;
    border-color: #d1d5db;
  }
`;

export const DropZone = styled.div`
  border: 2px dashed ${props => props.$isDragActive ? '#3b82f6' : props.$hasFile ? '#10b981' : '#d1d5db'};
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  background: ${({ isDarkMode, $isDragActive, $hasFile }) =>
    $isDragActive
      ? isDarkMode
        ? '#1e293b' // Dark mode active drag
        : '#eff6ff' // Light mode active drag
      : $hasFile
        ? isDarkMode
          ? '#374151' // Dark mode file selected
          : '#f0fdf4' // Light mode file selected
        : isDarkMode
          ? '#2c3e50' // Dark mode default
          : '#fafafa' // Light mode default
  };
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;

  &:hover {
    border-color: ${({ $hasFile }) => ($hasFile ? '#10b981' : '#3b82f6')};
    background: ${({ isDarkMode, $hasFile }) =>
    $hasFile
      ? isDarkMode
        ? '#3c556e'  // Dark mode file selected hover
        : '#f0f7fdff'  // Light mode file selected hover (can be customized)
      : isDarkMode
        ? '#3e4a59'  // Dark mode hover
        : '#f0f7fdff'  // Light mode hover (remains same)
  };
  }
`;

export const DropZoneIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  
  svg {
    width: 48px;
    height: 48px;
    color: ${props => props.$hasFile ? '#10b981' : '#6b7280'};
  }
`;

export const DropZoneText = styled.div`
  h4 {
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme, $hasFile, isDarkMode }) =>
    $hasFile
      ? isDarkMode
        ? '#059669' // Dark mode file selected
        : '#10b981' // Light mode file selected
      : theme.colors.textPrimary // Default text color from the theme
  };
    margin: 0 0 8px 0;
  }
  
  p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }
`;

export const FileInfo = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const FileIcon = styled.div`
  background: #10b981;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 20px;
    height: 20px;
    color: white;
  }
`;

export const FileDetails = styled.div`
  flex: 1;
  
  h5 {
    font-size: 14px;
    font-weight: 600;
    color: #065f46;
    margin: 0 0 4px 0;
  }
  
  p {
    font-size: 12px;
    color: #6b7280;
    margin: 0;
  }
`;

export const RemoveFileButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #6b7280;
  transition: all 0.2s ease;

  &:hover {
    background: #fee2e2;
    color: #dc2626;
  }
`;

export const HiddenFileInput = styled.input`
  display: none;
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

export const Button = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  ${props => props.$variant === 'primary' ? `
    background: #3b82f6;
    color: white;
    border: 2px solid #3b82f6;
    
    &:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }
    
    &:disabled {
      background: #9ca3af;
      border-color: #9ca3af;
      cursor: not-allowed;
    }
  ` : `
    background: white;
    color: #374151;
    border: 2px solid #d1d5db;
    
    &:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }
  `}
`;

export const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #dc2626;
  font-size: 14px;
  
  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

export const BrowseButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 12px;
  transition: background 0.2s ease;

  &:hover {
    background: #2563eb;
  }
`;