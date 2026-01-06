import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Upload, X, File, Calendar, Type, FileText, AlertCircle } from 'lucide-react';
import { ModalOverlay, ModalContainer, ModalHeader, ModalTitle, CloseButton, ModalBody, Section, SectionTitle } from './styles/SubmitModal';
import { FieldGrid, FieldGroup, FieldLabel, FieldInput } from './styles/SubmitModal';
import { DropZone, DropZoneIcon, DropZoneText, FileInfo, FileIcon, FileDetails, RemoveFileButton, HiddenFileInput } from './styles/SubmitModal';
import { ButtonGroup, Button, ErrorMessage, BrowseButton} from './styles/SubmitModal';


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
  projectTitle = 'Sample Title',
  projectType = 'Wave Analysis',
  forecastDate = '',
  isSubmitting = false,
  isDarkMode
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
              isDarkMode={isDarkMode}
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