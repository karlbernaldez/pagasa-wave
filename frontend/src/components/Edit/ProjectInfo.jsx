import React, { useEffect, useState } from 'react';
import styled, { useTheme, css, keyframes } from 'styled-components';
import { fetchProjectById } from '../../api/projectAPI';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { updateProjectById, deleteProjectById } from '../../api/projectAPI';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import { FaChevronDown } from 'react-icons/fa';

// Breakpoint constants for desktop responsiveness
const DESKTOP_BREAKPOINTS = {
  small: '1024px',
  medium: '1280px',
  large: '1440px',
  xlarge: '1920px'
};

const InfoContainer = styled.div`
  position: fixed;
  top: clamp(4.5rem, 5vw, 5.5rem);
  left: clamp(1rem, 2vw, 1.5rem);
  background: ${({ theme }) => theme.colors.lightBackground};
  border: 1px solid ${({ theme }) => theme.colors.border || '#ccc'};
  padding: clamp(0.5rem, 1.5vw, 1rem) clamp(0.8rem, 2vw, 1.2rem);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
  color: ${({ theme }) => theme.colors.textPrimary};
  box-shadow: ${({ theme }) => theme.colors.boxShadow};
  z-index: 200;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: clamp(200px, 25vw, 280px);
  max-width: clamp(280px, 30vw, 350px);

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.colors.boxShadow}, 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: ${DESKTOP_BREAKPOINTS.small}) {
    top: 5rem;
    left: 1rem;
    font-size: 0.75rem;
    padding: 0.5rem 0.8rem;
    min-width: 200px;
  }
  
  @media (max-width: ${DESKTOP_BREAKPOINTS.medium}) {
    top: 5rem;
  }

  @media (max-width: ${DESKTOP_BREAKPOINTS.large}) {
    top: 5rem;
  }

  @media (min-width: ${DESKTOP_BREAKPOINTS.xlarge}) {
    top: 6rem;
    left: 2rem;
    font-size: 1rem;
    padding: 1.2rem 1.5rem;
  }
`;

const Label = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin-right: clamp(0.25rem, 0.8vw, 0.5rem);
  color: ${({ theme }) => theme.colors.textSecondary};
  display: inline-block;
  min-width: clamp(3rem, 8vw, 4rem);
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: ${({ theme }) => theme.colors.loadingBackground || 'rgba(0, 0, 0, 0.4)'};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: ${({ theme }) => theme.zIndex.modal || 1000};
  backdrop-filter: blur(2px);
  transition: all 0.3s ease;
`;

const ModalContainer = styled.div`
  background: ${({ theme }) => theme.colors.lightBackground};
  padding: clamp(1.5rem, 3vw, 2rem);
  border-radius: ${({ theme }) => theme.borderRadius.large};
  width: 100%;
  max-width: clamp(350px, 40vw, 480px);
  min-width: 320px;
  box-shadow: ${({ theme }) => theme.colors.boxShadow};
  font-family: ${({ theme }) => theme.fonts.regular};
  color: ${({ theme }) => theme.colors.textPrimary};
  transform: scale(0.9);
  animation: modalIn 0.3s ease forwards;
  
  @keyframes modalIn {
    to {
      transform: scale(1);
    }
  }

  h2, h3 {
    margin: 0 0 clamp(1rem, 2vw, 1.5rem) 0;
    font-size: clamp(1.1rem, 2vw, 1.3rem);
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }

  p {
    margin: 0 0 clamp(0.8rem, 1.5vw, 1rem) 0;
    font-size: clamp(0.85rem, 1.2vw, 0.95rem);
    line-height: 1.5;
  }

  @media (max-width: ${DESKTOP_BREAKPOINTS.small}) {
    max-width: 350px;
    padding: 1.5rem;
  }

  @media (min-width: ${DESKTOP_BREAKPOINTS.xlarge}) {
    max-width: 520px;
    padding: 2.5rem;
  }
`;

const Field = styled.div`
  margin-bottom: clamp(1rem, 2vw, 1.5rem);

  label {
    display: block;
    margin-bottom: clamp(0.3rem, 0.8vw, 0.5rem);
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    font-size: clamp(0.8rem, 1.2vw, 0.9rem);
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: clamp(0.5rem, 1.2vw, 0.75rem) clamp(0.6rem, 1.5vw, 0.8rem);
  font-size: clamp(0.85rem, 1.2vw, 0.95rem);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 1px solid ${({ theme }) => theme.colors.border || '#ccc'};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.regular};
  box-sizing: border-box;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.highlight};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.highlight}33;
    transform: translateY(-1px);
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.highlight};
  }

  @media (max-width: ${DESKTOP_BREAKPOINTS.small}) {
    padding: 0.5rem 0.6rem;
    font-size: 0.85rem;
  }

  @media (min-width: ${DESKTOP_BREAKPOINTS.xlarge}) {
    padding: 0.8rem 1rem;
    font-size: 1rem;
  }
`;

const SelectWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: clamp(0.5rem, 1.2vw, 0.75rem) clamp(2rem, 4vw, 2.5rem) clamp(0.5rem, 1.2vw, 0.75rem) clamp(0.6rem, 1.5vw, 0.8rem);
  border: 1px solid ${({ theme }) => theme.colors.border || "#ccc"};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: clamp(0.85rem, 1.2vw, 0.95rem);
  font-family: ${({ theme }) => theme.fonts.regular};
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textPrimary};
  appearance: none;
  transition: all 0.3s ease;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.highlight};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.highlight}33;
    transform: translateY(-1px);
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.highlight};
  }

  @media (max-width: ${DESKTOP_BREAKPOINTS.small}) {
    padding: 0.5rem 2rem 0.5rem 0.6rem;
    font-size: 0.85rem;
  }

  @media (min-width: ${DESKTOP_BREAKPOINTS.xlarge}) {
    padding: 0.8rem 2.5rem 0.8rem 1rem;
    font-size: 1rem;
  }
`;

const ChevronIcon = styled(FaChevronDown)`
  position: absolute;
  top: 50%;
  right: clamp(0.5rem, 1.2vw, 0.8rem);
  transform: translateY(-50%) ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.3s ease;
  pointer-events: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: clamp(0.7rem, 1vw, 0.8rem);

  @media (max-width: ${DESKTOP_BREAKPOINTS.small}) {
    right: 0.5rem;
    font-size: 0.7rem;
  }

  @media (min-width: ${DESKTOP_BREAKPOINTS.xlarge}) {
    right: 1rem;
    font-size: 0.9rem;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: clamp(0.8rem, 2vw, 1.2rem);
  margin-top: clamp(1.5rem, 3vw, 2rem);

  @media (max-width: ${DESKTOP_BREAKPOINTS.small}) {
    flex-direction: column;
    gap: 0.8rem;
  }

  @media (min-width: ${DESKTOP_BREAKPOINTS.medium}) {
    flex-direction: row;
  }
`;

const Button = styled.button`
  padding: clamp(0.5rem, 1.2vw, 0.75rem) clamp(1rem, 2.5vw, 1.5rem);
  font-size: clamp(0.8rem, 1.2vw, 0.9rem);
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-family: ${({ theme }) => theme.fonts.medium};
  color: ${({ disabled, danger, theme }) =>
    disabled ? '#ccc' : danger ? theme.mainColors.white : theme.colors.textPrimary};
  background-color: ${({ disabled, danger, theme }) =>
    disabled ? '#e0e0e0' : danger ? '#e74c3c' : theme.mainColors.blue};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.3s ease;
  flex: 1;
  min-height: clamp(36px, 5vw, 44px);
  font-weight: ${({ theme }) => theme.fontWeights.medium};

  &:hover {
    opacity: ${({ disabled }) => (disabled ? 1 : 0.9)};
    transform: ${({ disabled }) => (disabled ? 'none' : 'translateY(-1px)')};
  }

  &:active {
    transform: ${({ disabled }) => (disabled ? 'none' : 'translateY(0)')};
  }

  @media (max-width: ${DESKTOP_BREAKPOINTS.small}) {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    min-height: 36px;
  }

  @media (min-width: ${DESKTOP_BREAKPOINTS.xlarge}) {
    padding: 0.8rem 2rem;
    font-size: 1rem;
    min-height: 48px;
  }
`;

const ProjectInfo = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [chartType, setChartType] = useState('');
  const [forecastDate, setForecastDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedChart, setEditedChart] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      const projectId = localStorage.getItem('projectId');
      const token = localStorage.getItem('authToken');

      try {
        const project = await fetchProjectById(projectId, token);
        if (project) {
          setProjectName(project.name);
          setChartType(project.chartType);
          const date = new Date(project.forecastDate);
          const formatted = date.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          setForecastDate(formatted);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    };

    fetchData();
  }, []);

  const openModal = () => {
    setEditedName(projectName);
    setEditedChart(chartType);
    setEditedDate(forecastDate);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const projectId = localStorage.getItem('projectId');

      if (!token || !projectId) {
        console.error('Missing token or project ID');
        return;
      }

      const projectData = {
        name: editedName,
        chartType: editedChart,
        forecastDate: editedDate,
      };

      const updatedProject = await updateProjectById(projectId, projectData, token);

      setProjectName(updatedProject.name);
      setChartType(updatedProject.chartType);
      setForecastDate(updatedProject.forecastDate);

      setModalOpen(false);

      Swal.fire({
        icon: 'success',
        title: 'Project updated successfully!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      }).then(() => {
        window.location.reload();
      });

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error updating project',
        text: error.message || 'An unexpected error occurred',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      console.error('Error updating project:', error);
    }
  };

  const handleDelete = () => {
    setDeleteInput('');
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteInput === projectName) {
      try {
        const token = localStorage.getItem('authToken');
        const projectId = localStorage.getItem('projectId');

        // Delete the project using the API
        await deleteProjectById(projectId, token);

        // Show success toast
        Swal.fire({
          icon: 'success',
          title: 'Project deleted successfully!',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        }).then(() => {
          // Clear localStorage values related to the project
          localStorage.removeItem('projectId');
          localStorage.removeItem('projectName');
          localStorage.removeItem('chartType');
          localStorage.removeItem('forecastDate');

          // Optionally reload or redirect the page after successful deletion
          window.location.reload();
        });

        // Close the delete confirmation modal
        setShowDeleteConfirm(false);
      } catch (error) {
        // Show error toast in case of failure
        Swal.fire({
          icon: 'error',
          title: 'Error deleting project',
          text: error.message || 'An unexpected error occurred',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      }
    } else {
      // Show warning if project name does not match
      Swal.fire({
        icon: 'warning',
        title: 'Confirmation failed',
        text: 'Project name does not match. Please try again.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  if (!projectName) return null;

  return (
    <>
      <InfoContainer onClick={openModal}>
        <div><Label>Project:</Label>{projectName}</div>
        <div><Label>Chart Type:</Label>{chartType || 'N/A'}</div>
        <div><Label>Forecast Date:</Label>{forecastDate || 'N/A'}</div>
      </InfoContainer>

      {modalOpen && (
        <Overlay onClick={() => setModalOpen(false)}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <h2>Edit Project Info</h2>
            <Field>
              <label>Project Name</label>
              <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} />
            </Field>
            <Field>
              <label>Chart Type</label>
              <SelectWrapper>
                <StyledSelect
                  id="chartType"
                  value={editedChart}
                  onChange={(e) => setEditedChart(e.target.value)}
                >
                  <option value="Wave Analysis">Wave Analysis</option>
                  <option value="24">24</option>
                  <option value="36">36</option>
                  <option value="48">48</option>
                </StyledSelect>
                <ChevronIcon />
              </SelectWrapper>
            </Field>
            <Field>
              <label>Forecast Date</label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={dayjs(new Date(editedDate))}
                  onChange={(newValue) => {
                    if (newValue) {
                      const formatted = new Date(newValue).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      });
                      setEditedDate(formatted);
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'standard',
                      InputProps: {
                        disableUnderline: true,
                        sx: {
                          backgroundColor: theme.colors.background,
                          borderRadius: theme.borderRadius.medium,
                          fontFamily: theme.fonts.regular,
                          fontSize: 'clamp(0.85rem, 1.2vw, 0.95rem)',
                          color: theme.colors.textPrimary,
                          height: 'clamp(36px, 5vw, 44px)',
                          paddingLeft: 'clamp(0.6rem, 1.5vw, 0.8rem)',
                          border: `1px solid #ccc`,
                          transition: 'all 0.3s ease',
                          '& input': {
                            textAlign: 'left',
                          },
                          '&:hover': {
                            borderColor: theme.colors.highlight,
                          },
                          '&.Mui-focused': {
                            borderColor: theme.colors.highlight,
                            boxShadow: `0 0 0 2px ${theme.colors.highlight}33`,
                            transform: 'translateY(-1px)',
                          },
                          '& .MuiSvgIcon-root': {
                            color: '#a0a0a0',
                          },
                        },
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </Field>
            <ButtonRow>
              <Button type="button" onClick={handleSave}>Save Changes</Button>
              <Button type="button" danger onClick={handleDelete}>Delete Project</Button>
            </ButtonRow>
          </ModalContainer>
        </Overlay>
      )}

      {showDeleteConfirm && (
        <Overlay onClick={() => setShowDeleteConfirm(false)}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Deletion</h3>
            <p>Type <strong>{projectName}</strong> to confirm deletion.</p>
            <Field>
              <Input
                placeholder="Enter project name"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
              />
            </Field>
            <ButtonRow>
              <Button onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button
                danger
                disabled={deleteInput !== projectName}
                onClick={handleConfirmDelete}
              >
                Confirm Delete
              </Button>
            </ButtonRow>
          </ModalContainer>
        </Overlay>
      )}
    </>
  );
};

export default ProjectInfo;