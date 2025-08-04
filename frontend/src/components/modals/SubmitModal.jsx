import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Upload, X, File, Calendar, Type, FileText, AlertCircle } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
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

const ModalHeader = styled.div`
  padding: 24px 24px 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CloseButton = styled.button`
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

const ModalBody = styled.div`
  padding: 0 24px 24px 24px;
`;

const Section = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const FieldLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const FieldInput = styled.input`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
  
  &:focus {
    outline: none;
    border-color: #d1d5db;
  }
`;

const DropZone = styled.div`
  border: 2px dashed ${props => props.$isDragActive ? '#3b82f6' : props.$hasFile ? '#10b981' : '#d1d5db'};
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  background: ${props => props.$isDragActive ? '#eff6ff' : props.$hasFile ? '#f0fdf4' : '#fafafa'};
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;

  &:hover {
    border-color: ${props => props.$hasFile ? '#10b981' : '#3b82f6'};
    background: ${props => props.$hasFile ? '#f0fdf4' : '#eff6ff'};
  }
`;

const DropZoneIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  
  svg {
    width: 48px;
    height: 48px;
    color: ${props => props.$hasFile ? '#10b981' : '#6b7280'};
  }
`;

const DropZoneText = styled.div`
  h4 {
    font-size: 18px;
    font-weight: 600;
    color: ${props => props.$hasFile ? '#059669' : '#374151'};
    margin: 0 0 8px 0;
  }
  
  p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }
`;

const FileInfo = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FileIcon = styled.div`
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

const FileDetails = styled.div`
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

const RemoveFileButton = styled.button`
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

const HiddenFileInput = styled.input`
  display: none;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
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

const ErrorMessage = styled.div`
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

const BrowseButton = styled.button`
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

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const SubmitProjectModal = ({ 
  visible, 
  onClose, 
  onSubmit,
  projectTitle = '',
  projectType = '',
  forecastDate = '',
  isSubmitting = false 
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!visible) return null;

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFileSelection(files[0]);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelection(file);
  };

  const handleFileSelection = (file) => {
    setError('');
    
    if (!file) return;

    // Validate file type (only ZIP files)
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Please select a ZIP file only.');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File size must be less than 50MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      setError('Please select a ZIP file to submit.');
      return;
    }

    onSubmit(selectedFile);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && handleCancel()}>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>
            <Upload size={28} />
            Submit Project
          </ModalTitle>
          <CloseButton onClick={handleCancel}>
            <X size={24} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {/* Project Information Section */}
          <Section>
            <SectionTitle>
              <FileText size={20} />
              Project Information
            </SectionTitle>
            
            <FieldGrid>
              <FieldGroup>
                <FieldLabel>
                  <Type size={16} />
                  Title
                </FieldLabel>
                <FieldInput 
                  type="text" 
                  value={projectTitle} 
                  readOnly 
                  disabled
                />
              </FieldGroup>
              
              <FieldGroup>
                <FieldLabel>
                  <FileText size={16} />
                  Type
                </FieldLabel>
                <FieldInput 
                  type="text" 
                  value={projectType} 
                  readOnly 
                  disabled
                />
              </FieldGroup>
              
              <FieldGroup>
                <FieldLabel>
                  <Calendar size={16} />
                  Forecast Date
                </FieldLabel>
                <FieldInput 
                  type="text" 
                  value={forecastDate} 
                  readOnly 
                  disabled
                />
              </FieldGroup>
            </FieldGrid>
          </Section>

          {/* File Upload Section */}
          <Section>
            <SectionTitle>
              <Upload size={20} />
              Upload Project File
            </SectionTitle>
            
            <DropZone
              $isDragActive={isDragActive}
              $hasFile={!!selectedFile}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >
              <DropZoneIcon $hasFile={!!selectedFile}>
                {selectedFile ? <File /> : <Upload />}
              </DropZoneIcon>
              
              <DropZoneText $hasFile={!!selectedFile}>
                {selectedFile ? (
                  <>
                    <h4>File Ready for Upload</h4>
                    <p>Click to change file or drag a new one here</p>
                  </>
                ) : (
                  <>
                    <h4>Drop your ZIP file here</h4>
                    <p>or click to browse files (ZIP format only, max 50MB)</p>
                  </>
                )}
              </DropZoneText>
              
              {!selectedFile && (
                <BrowseButton type="button">
                  Choose File
                </BrowseButton>
              )}
            </DropZone>

            <HiddenFileInput
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileInputChange}
            />

            {selectedFile && (
              <FileInfo>
                <FileIcon>
                  <File />
                </FileIcon>
                <FileDetails>
                  <h5>{selectedFile.name}</h5>
                  <p>{formatFileSize(selectedFile.size)} • ZIP Archive</p>
                </FileDetails>
                <RemoveFileButton onClick={handleRemoveFile}>
                  <X size={16} />
                </RemoveFileButton>
              </FileInfo>
            )}

            {error && (
              <ErrorMessage>
                <AlertCircle />
                {error}
              </ErrorMessage>
            )}
          </Section>

          {/* Action Buttons */}
          <ButtonGroup>
            <Button onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              $variant="primary" 
              onClick={handleSubmit}
              disabled={!selectedFile || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Submit Project
                </>
              )}
            </Button>
          </ButtonGroup>
        </ModalBody>
      </ModalContainer>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </ModalOverlay>
  );
};

export default SubmitProjectModal;