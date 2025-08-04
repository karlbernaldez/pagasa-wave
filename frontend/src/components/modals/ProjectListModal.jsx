import React from 'react';
import styled from 'styled-components';
import { formatDistanceToNow } from 'date-fns'; // Optional: for formatting time

const Backdrop = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: ${({ theme }) => theme.colors.loadingBackground || "rgba(0, 0, 0, 0.3)"};
  z-index: ${({ theme }) => theme.zIndex.loadingScreen};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContainer = styled.div`
  background: ${({ theme }) => theme.colors.lightBackground};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing.medium};
  width: 90%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  box-shadow: ${({ theme }) => theme.colors.boxShadow};
  font-family: ${({ theme }) => theme.fonts.regular};

  /* Scrollbar theming */
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => `${theme.colors.scrollThumb || "#ccc"} transparent`};

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.scrollThumb || "#bbb"};
    border-radius: 4px;
  }
`;

const Title = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.small};
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  position: sticky;
  top: 0;
  background: ${({ theme }) => theme.colors.lightBackground};
  padding-bottom: 0.25rem;
  z-index: 1;
`;

const ProjectItem = styled.button`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border || "#e0e0e0"};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.medium};
  margin-bottom: ${({ theme }) => theme.spacing.small};
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

  &:hover {
    background: ${({ theme }) => theme.colors.highlight}15;
    transform: scale(1.01);
    box-shadow: 0 4px 12px ${({ theme }) => theme.colors.highlight}33;
  }

  h4 {
    margin: 0 0 0.3rem;
    font-size: ${({ theme }) => theme.fontSizes.medium};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-family: ${({ theme }) => theme.fonts.medium};
  }

  p {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.small};
    color: ${({ theme }) => theme.colors.textSecondary};
    font-family: ${({ theme }) => theme.fonts.light};
  }

  small {
    font-size: ${({ theme }) => theme.fontSizes.xsmall};
    color: ${({ theme }) => theme.colors.textSecondary};
    display: block;
    margin-top: 0.4rem;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.small};
  right: ${({ theme }) => theme.spacing.small};
  background: transparent;
  border: none;
  font-size: 1.4rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.mainColors.blue};
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-family: ${({ theme }) => theme.fonts.light};
`;

const ProjectListModal = ({ visible, onClose, projects, onSelect }) => {
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

  return (
    <Backdrop onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <Title>Select a Project</Title>
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectItem key={project._id} onClick={() => handleSelect(project)}>
              <h4>{project.name}</h4>
              {project.description && <p>{project.description}</p>}
              {project.createdAt && (
                <small>
                  Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                </small>
              )}
            </ProjectItem>
          ))
        ) : (
          <EmptyMessage>No projects found.</EmptyMessage>
        )}
      </ModalContainer>
    </Backdrop>
  );
};

export default ProjectListModal;
