import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { formatDistanceToNow } from 'date-fns';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { 
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6));
  backdrop-filter: blur(8px);
  z-index: ${({ theme }) => theme.zIndex?.loadingScreen || 1000};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContainer = styled.div`
  background: ${({ theme }) => theme.colors?.lightBackground || '#ffffff'};
  border-radius: 20px;
  padding: 0;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  position: relative;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  font-family: ${({ theme }) => theme.fonts?.regular || 'system-ui, -apple-system, sans-serif'};
  overflow: hidden;
  animation: ${slideUp} 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 640px) {
    margin: 1rem;
    max-height: 90vh;
    border-radius: 16px;
  }
`;

const Header = styled.div`
  padding: 2rem 2rem 1rem 2rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors?.lightBackground || '#ffffff'} 0%, ${({ theme }) => theme.colors?.background || '#f8fafc'} 100%);
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border || 'rgba(0, 0, 0, 0.08)'};
  position: sticky;
  top: 0;
  z-index: 10;

  @media (max-width: 640px) {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors?.textPrimary || '#1a202c'}, ${({ theme }) => theme.colors?.textSecondary || '#4a5568'});
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  margin: 0.5rem 0 0 0;
  color: ${({ theme }) => theme.colors?.textSecondary || '#64748b'};
  font-size: 0.95rem;
  font-weight: 400;
`;

const ProjectList = styled.div`
  padding: 0 2rem 2rem 2rem;
  max-height: calc(85vh - 140px);
  overflow-y: auto;
  
  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.colors?.scrollThumb || '#cbd5e1'} transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors?.scrollThumb || '#cbd5e1'};
    border-radius: 3px;
    
    &:hover {
      background: ${({ theme }) => theme.colors?.scrollThumbHover || '#94a3b8'};
    }
  }

  @media (max-width: 640px) {
    padding: 0 1.5rem 1.5rem 1.5rem;
  }
`;

const ProjectItem = styled.div`
  background: ${({ theme }) => theme.colors?.background || '#ffffff'};
  border: 1px solid ${({ theme }) => theme.colors?.border || '#e2e8f0'};
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  width: 100%;
  text-align: left;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.5s;
  }

  &:hover {
    background: ${({ theme }) => theme.colors?.highlight || '#3b82f6'}08;
    border-color: ${({ theme }) => theme.colors?.highlight || '#3b82f6'}40;
    transform: translateY(-2px);
    box-shadow: 
      0 10px 25px -5px rgba(0, 0, 0, 0.1),
      0 8px 10px -6px rgba(0, 0, 0, 0.1),
      0 0 0 1px ${({ theme }) => theme.colors?.highlight || '#3b82f6'}20;

    &:before {
      left: 100%;
    }
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const ProjectItemContent = styled.button`
  background: none;
  border: none;
  padding: 0;
  width: 100%;
  text-align: left;
  cursor: pointer;
  
  &:active {
    transform: translateY(-1px);
  }
`;

const ProjectHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const ProjectTitle = styled.h4`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors?.textPrimary || '#1e293b'};
  line-height: 1.4;
  flex: 1;
  padding-right: 1rem;
`;

const ProjectBadge = styled.span`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors?.highlight || '#3b82f6'}, ${({ theme }) => theme.colors?.highlight || '#3b82f6'}dd);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ProjectDescription = styled.p`
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors?.textSecondary || '#64748b'};
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProjectMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors?.textSecondary || '#94a3b8'};
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:before {
    content: '•';
    color: ${({ theme }) => theme.colors?.highlight || '#3b82f6'};
    font-weight: bold;
  }

  &:first-child:before {
    content: '🕒';
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: ${({ theme }) => theme.colors?.background || '#f1f5f9'};
  border: 1px solid ${({ theme }) => theme.colors?.border || '#e2e8f0'};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors?.textSecondary || '#64748b'};
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: ${({ theme }) => theme.colors?.highlight || '#ef4444'};
    color: white;
    border-color: ${({ theme }) => theme.colors?.highlight || '#ef4444'};
    transform: scale(1.05);
  }

  @media (max-width: 640px) {
    top: 1rem;
    right: 1rem;
    width: 36px;
    height: 36px;
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors?.deleteIcon || '#ef4444'};
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.6;
  padding: 0.5rem;
  line-height: 1;

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
`;

const ActionWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${ProjectItemContent} {
    flex-grow: 1;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${({ theme }) => theme.colors?.textSecondary || '#64748b'};
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors?.textPrimary || '#1e293b'};
`;

const EmptyMessage = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const ConfirmationModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${({ theme }) => theme.colors?.lightBackground || '#ffffff'};
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  z-index: ${({ theme }) => theme.zIndex?.modal || 1001};
  animation: ${slideUp} 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: center;
`;

const ConfirmationTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors?.textPrimary || '#1e293b'};
`;

const ConfirmationMessage = styled.p`
  margin: 0 0 1.5rem 0;
  color: ${({ theme }) => theme.colors?.textSecondary || '#64748b'};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const ConfirmButton = styled.button`
  background-color: ${({ theme }) => theme.colors?.danger || '#ef4444'};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-weight: 600;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors?.dangerHover || '#dc2626'};
  }
`;

const CancelButton = styled(ConfirmButton)`
  background-color: ${({ theme }) => theme.colors?.secondaryButton || '#e2e8f0'};
  color: ${({ theme }) => theme.colors?.textPrimary || '#1e293b'};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors?.secondaryButtonHover || '#cbd5e1'};
  }
`;

const ProjectListModal = ({ visible, onClose, projects, onSelect, onDelete }) => {
  const [projectToDelete, setProjectToDelete] = useState(null);

  if (!visible) return null;

  const handleSelect = (project) => {
    localStorage.setItem("projectId", project._id);
    localStorage.setItem("projectName", project.name);
    localStorage.setItem("chartType", project.chartType || '12');
    localStorage.setItem("forecastDate", project.forecastDate);

    if (onSelect) onSelect(project);
    onClose();
    window.location.reload();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDeleteClick = (e, project) => {
    e.stopPropagation(); // Prevents the ProjectItem from being clicked
    setProjectToDelete(project);
  };
  
  const confirmDelete = async () => {
    if (projectToDelete) {
      try {
        await onDelete(projectToDelete._id);
        setProjectToDelete(null);
        // You might want to refresh the project list here or handle it in the parent component
      } catch (error) {
        console.error("Failed to delete project:", error);
        // Handle error, maybe show a toast notification
      }
    }
  };
  
  const cancelDelete = () => {
    setProjectToDelete(null);
  };

  return (
    <Backdrop onClick={handleBackdropClick}>
      <ModalContainer>
        <CloseButton onClick={onClose} aria-label="Close modal">
          ×
        </CloseButton>
        
        <Header>
          <Title>Your Projects</Title>
          <Subtitle>Select a project to continue working</Subtitle>
        </Header>

        <ProjectList>
          {projects.length > 0 ? (
            projects.map((project) => (
              <ProjectItem key={project._id}>
                <ActionWrapper>
                  <ProjectItemContent onClick={() => handleSelect(project)}>
                    <ProjectHeader>
                      <ProjectTitle>{project.name}</ProjectTitle>
                      <ProjectBadge>Active</ProjectBadge>
                    </ProjectHeader>
                    
                    {project.description && (
                      <ProjectDescription>{project.description}</ProjectDescription>
                    )}
                    
                    <ProjectMeta>
                      {project.createdAt && (
                        <MetaItem>
                          Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                        </MetaItem>
                      )}
                      {project.chartType && (
                        <MetaItem>Chart Type {project.chartType}</MetaItem>
                      )}
                    </ProjectMeta>
                  </ProjectItemContent>
                  <DeleteButton onClick={(e) => handleDeleteClick(e, project)} aria-label={`Delete ${project.name}`}>
                    🗑️
                  </DeleteButton>
                </ActionWrapper>
              </ProjectItem>
            ))
          ) : (
            <EmptyState>
              <EmptyIcon>📁</EmptyIcon>
              <EmptyTitle>No Projects Yet</EmptyTitle>
              <EmptyMessage>
                You haven't created any projects yet.<br />
                Create your first project to get started!
              </EmptyMessage>
            </EmptyState>
          )}
        </ProjectList>
      </ModalContainer>
      
      {projectToDelete && (
        <Backdrop>
          <ConfirmationModal>
            <ConfirmationTitle>Delete Project?</ConfirmationTitle>
            <ConfirmationMessage>
              Are you sure you want to permanently delete "{projectToDelete.name}"? This action cannot be undone.
            </ConfirmationMessage>
            <ButtonGroup>
              <CancelButton onClick={cancelDelete}>Cancel</CancelButton>
              <ConfirmButton onClick={confirmDelete}>Delete</ConfirmButton>
            </ButtonGroup>
          </ConfirmationModal>
        </Backdrop>
      )}
    </Backdrop>
  );
};

export default ProjectListModal;