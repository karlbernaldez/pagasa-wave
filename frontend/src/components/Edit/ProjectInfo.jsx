import React, { useEffect, useState, useRef } from 'react';
import styled, { useTheme, css, keyframes } from 'styled-components';
import { fetchProjectById, fetchUserProjects, updateProjectById, deleteProjectById } from '../../api/projectAPI';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { FaChevronDown, FaEdit, FaTrash, FaCalendarAlt, FaChartBar, FaFolder, FaBars, FaPlus, FaFileExport, FaSignOutAlt, FaPaperPlane, FaEye } from 'react-icons/fa';
import ProjectModal from '../modals/ProjectModal';
import SubmitModal from '../modals/SubmitModal';
import ProjectListModal from '../modals/ProjectListModal';
import { logout, handleCreateProject as createProjectHandler, downloadCachedSnapshotZip } from './utils/ProjectUtils';

const MySwal = withReactContent(Swal);

// Enhanced animations
const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const fadeInScale = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
`;

const blinkBorder = keyframes`
  0%, 100% { 
    border-color: transparent;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }
  50% { 
    border-color: rgba(255, 99, 132, 0.6);
    box-shadow: 
      0 8px 32px 0 rgba(31, 38, 135, 0.37),
      0 0 20px rgba(255, 99, 132, 0.4),
      inset 0 0 20px rgba(255, 99, 132, 0.1);
  }
`;

// Main info container with integrated menu
const InfoContainer = styled.div`
  background: ${({ theme }) => theme?.colors?.bgPrimary};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  padding: ${({ theme }) => theme.spacing.medium || "1.5rem"};
  border-radius: ${({ theme }) => theme.borderRadius.xlarge || "16px"};
  border: 1px solid ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.regular || "'Inter', sans-serif"};
  color: ${({ theme }) => theme.colors.textPrimary};

  width: 320px;
  max-width: 380px;
  max-height: clamp(400px, 55vh, 600px);
  overflow-y: auto;

  /* Hide scrollbar but keep scrolling */
  scrollbar-width: none; /* Firefox */
  ms-overflow-style: none; /* IE/Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }

  box-shadow: ${({ theme }) =>
    theme.isDark
      ? "0 25px 50px -12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)"
      : "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)"};
  
  transform: scale(1);
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: ${({ theme }) =>
    theme.isDark
      ? "0 32px 64px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)"
      : "0 32px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08)"};
    border-color: ${({ theme }) =>
    theme.isDark ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.2)"};
  }

  &:active {
    transform: translateY(-2px) scale(1.01);
  }

  /* Blink animation when no project is selected */
  ${(props) =>
    props.$shouldBlink &&
    css`
      animation: ${blinkBorder} 0.8s ease-in-out 3;
    `}

  /* Responsive */
  @media (max-width: 768px) {
    width: calc(100vw - 2rem);
    max-width: calc(100vw - 2rem);
    max-height: clamp(320px, 55vh, 500px);
    right: 1rem;
    bottom: ${({ theme }) => theme.spacing.medium || "1rem"};
    padding: 1.25rem;
  }
`;

const InfoHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding: 0 1.5rem 1rem;   /* keep inner spacing */
  margin-left: -1.5rem;     /* cancel container padding */
  margin-right: -1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const InfoTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme?.colors?.textPrimary || '#1f2937'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 3.5rem; 


`;

const MenuActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
`;

const MenuButton = styled.button`
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.2) 0%, 
    rgba(255, 255, 255, 0.1) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  
  color: ${({ theme }) => theme?.colors?.textPrimary || '#2d3748'};
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem;
  font-size: 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  box-shadow: 
    0 4px 16px 0 rgba(31, 38, 135, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 0.3) 0%, 
      rgba(255, 255, 255, 0.2) 100%
    );
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px) scale(1.05);
    box-shadow: 
      0 8px 24px 0 rgba(31, 38, 135, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }
`;

const EditButton = styled(MenuButton)`
  color: ${({ theme }) =>
    theme?.isDark
      ? '#60a5fa'
      : '#3b82f6'
  };
`;

const Dropdown = styled.div`
  display: ${({ $visible }) => ($visible ? 'block' : 'none')};
  position: absolute;
  top: 3rem;
  left: 0;
  margin-top: 0.75rem;
  min-width: 220px;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 14px;
  padding: 6px;
  
  box-shadow: 
    0 20px 80px 0 rgba(31, 38, 135, 0.45),
    0 10px 40px 0 rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  
  animation: ${fadeInScale} 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  z-index: 1001;
`;

const MenuItem = styled.button`
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  padding: 0.875rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  position: relative;
  
  color: ${({ $danger }) =>
    $danger
      ? '#ef4444'
      : 'inherit'};
  
  border-radius: 12px;
  margin: 2px 0;
  
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &:hover {
    background: linear-gradient(135deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0.1) 100%
    );
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateX(4px);
    
    box-shadow: 
      0 4px 16px 0 rgba(31, 38, 135, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);

    ${({ $danger }) =>
    $danger &&
    css`
        background: linear-gradient(135deg,
          rgba(239, 68, 68, 0.15) 0%,
          rgba(239, 68, 68, 0.05) 100%
        );
        border-color: rgba(239, 68, 68, 0.3);
        box-shadow: 
          0 4px 16px 0 rgba(239, 68, 68, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.4);
      `}
  }

  &:active {
    transform: translateX(2px) scale(0.98);
  }
`;

const SubDropdown = styled.div`
  position: absolute;
  top: 0;
  left: calc(100% - 12px);
  min-width: 200px;
  
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 14px;
  padding: 6px;
  
  box-shadow: 
    0 20px 80px 0 rgba(31, 38, 135, 0.45),
    0 10px 40px 0 rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  
  animation: ${fadeInScale} 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

const SubMenuItem = styled(MenuItem)`
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  margin: 1px 0;
  
  &:hover {
    transform: translateX(-6px);
    background: linear-gradient(135deg,
      rgba(139, 92, 246, 0.15) 0%,
      rgba(139, 92, 246, 0.05) 100%
    );
    border-color: rgba(139, 92, 246, 0.3);
    box-shadow: 
      0 4px 16px 0 rgba(139, 92, 246, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    transform: translateX(4px);
  }
`;

const InfoIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  background: ${({ iconType, theme }) => {
    const colors = {
      project: 'rgba(34, 197, 94, 0.1)',
      chart: 'rgba(168, 85, 247, 0.1)',
      date: 'rgba(59, 130, 246, 0.1)'
    };
    return colors[iconType] || colors.project;
  }};
  color: ${({ iconType, theme }) => {
    const colors = {
      project: '#22c55e',
      chart: '#8b5cf6',
      date: '#3b82f6'
    };
    return colors[iconType] || colors.project;
  }};
  margin-right: 0.75rem;
  flex-shrink: 0;
`;

const InfoContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
    color: ${({ theme }) => theme.colors.textPrimary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  font-size: 0.95rem;
  font-weight: 500;
  color: ${({ theme }) => theme?.colors?.textPrimary || '#1f2937'};
  word-break: break-word;
  line-height: 1.4;
`;

// Modal styles (keeping existing ones from ProjectInfo)
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
  animation: ${fadeInScale} 0.3s ease-out;
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.85) 100%
  );
  backdrop-filter: blur(20px);
  padding: 2rem;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  margin: 1rem;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #1f2937;
  transform: scale(0.95);
  animation: ${fadeInScale} 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;

  h2, h3 {
    margin: 0 0 1.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    margin: 0.5rem;
  }
`;

const LoadingModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  
  color: #1f2937;
  font-size: 1.8rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  user-select: none;
  
  animation: ${pulseGlow} 2s ease-in-out infinite;
  
  text-shadow: 
    0 2px 10px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(255, 255, 255, 0.5);
`;

// Form components (simplified versions)
const Field = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    font-size: 0.875rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  font-size: 0.95rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(248, 250, 252, 0.8);
  color: #1f2937;
  box-sizing: border-box;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.9);
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  padding: 1rem 1.5rem;
  font-size: 0.9rem;
  border: none;
  border-radius: 12px;
  font-weight: 500;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex: 1;
  min-height: 48px;
  position: relative;
  overflow: hidden;
  
  ${({ disabled, danger }) => {
    if (disabled) {
      return css`
        background: rgba(148, 163, 184, 0.3);
        color: #94a3b8;
      `;
    }
    if (danger) {
      return css`
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        border: 1px solid rgba(239, 68, 68, 0.3);
        
        &:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        }
      `;
    }
    return css`
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      border: 1px solid rgba(59, 130, 246, 0.3);
      
      &:hover {
        background: linear-gradient(135deg, #1d4ed8, #1e40af);
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
      }
    `;
  }}

  &:hover {
    transform: ${({ disabled }) => (disabled ? 'none' : 'translateY(-2px)')};
  }
`;

const ProjectInfo = ({ blink, setBlink, projectId, onNew, onSave, onView, features, isDarkMode, setIsDarkMode, isLoading }) => {
  // Menu state
  const [mainOpen, setMainOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showProjectList, setShowProjectList] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef(null);
  const [forecastDate, setForecastDate] = useState(dayjs());

  // Project info state
  const [projectName, setProjectName] = useState('');
  const [chartType, setChartType] = useState('');
  const [description, setDescription] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedChart, setEditedChart] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const theme = useTheme();

  useEffect(() => {
    console.log("projectOpen state:", projectOpen);
  }, [projectOpen]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMainOpen(false);
        setProjectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch project data
  useEffect(() => {
    const fetchData = async () => {
      const projectId = localStorage.getItem('projectId');

      if (!projectId) return;

      try {
        const project = await fetchProjectById(projectId);
        if (project) {
          setProjectName(project.name);
          setChartType(project.chartType);
          setDescription(project.description || '');
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
  }, [projectId]);

  // Menu handlers
  const handleSubmit = async (file) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('projectFile', file);
      formData.append('projectId', localStorage.getItem('projectId'));

      console.log('Submitting file:', file);
      setShowSubmitModal(false);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit handlers
  const openEditModal = (e) => {
    if (e) e.stopPropagation();
    setEditedName(projectName);
    setEditedChart(chartType);
    setEditedDate(forecastDate);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const projectId = localStorage.getItem('projectId');

      const projectData = {
        name: editedName,
        chartType: editedChart,
        forecastDate: editedDate,
      };

      const updatedProject = await updateProjectById(projectId, projectData);

      setProjectName(updatedProject.name);
      setChartType(updatedProject.chartType);
      setForecastDate(updatedProject.forecastDate);

      setEditModalOpen(false);

      Swal.fire({
        icon: 'success',
        title: 'Project updated successfully!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
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
      });
    }
  };

  const handleDelete = async () => {
    if (deleteInput === projectName) {
      try {
        const projectId = localStorage.getItem('projectId');
        await deleteProjectById(projectId);

        localStorage.removeItem('projectId');
        localStorage.removeItem('projectName');
        localStorage.removeItem('chartType');
        localStorage.removeItem('forecastDate');

        Swal.fire({
          icon: 'success',
          title: 'Project deleted successfully!',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        }).then(() => {
          window.location.reload();
        });

        setShowDeleteConfirm(false);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error deleting project',
          text: error.message || 'An unexpected error occurred',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
      }
    }
  };

  if (!projectName) {
    return (
      <InfoContainer ref={menuRef} $shouldBlink={blink && !projectId} >
        <InfoHeader>
          <InfoTitle>
            <FaFolder />
            No Project Selected
          </InfoTitle>
          {/* <MenuActions>
            <MenuButton onClick={() => {
              setMainOpen(!mainOpen);
              setProjectOpen(false);
            }}>
              <FaBars />
            </MenuButton>
          </MenuActions> */}
        </InfoHeader>

        {mainOpen && (
          <Dropdown>
            <MenuItem onClick={() => setProjectOpen(!projectOpen)} aria-expanded={projectOpen}>
              <FaFolder />
              Project
            </MenuItem>
            {projectOpen && (
              <SubDropdown>
                <SubMenuItem onClick={() => setShowModal(true)}>
                  <FaPlus />
                  New Project
                </SubMenuItem>
                <SubMenuItem onClick={async () => {
                  try {
                    const userProjects = await fetchUserProjects();
                    setProjects(userProjects);
                    setShowProjectList(true);
                  } catch (err) {
                    Swal.fire({
                      toast: true,
                      position: 'top-end',
                      icon: 'error',
                      title: 'Failed to load projects',
                      showConfirmButton: false,
                      timer: 2500,
                    });
                  }
                }}>
                  <FaFolder />
                  Open Project
                </SubMenuItem>
                <SubMenuItem onClick={async () => {
                  downloadCachedSnapshotZip(setIsDarkMode, features);
                }}>
                  <FaFileExport />
                  Export Project
                </SubMenuItem>
              </SubDropdown>
            )}
            <MenuItem onClick={onView}>
              <FaEye />
              View
            </MenuItem>
            <MenuItem onClick={() => setShowSubmitModal(true)}>
              <FaPaperPlane />
              Submit
            </MenuItem>
            <MenuItem onClick={logout} $danger>
              <FaSignOutAlt />
              Logout
            </MenuItem>
          </Dropdown>
        )}

        <InfoItem>
          <InfoIcon iconType="project">
            <FaFolder />
          </InfoIcon>
          <InfoContent>
            <InfoLabel>Status</InfoLabel>
            <InfoValue>Please create or select a project to get started</InfoValue>
          </InfoContent>
        </InfoItem>

        {/* All modals */}
        {showModal && (
          <ProjectModal
            visible={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={() =>
              createProjectHandler({
                projectName,
                chartType,
                description,
                forecastDate,
                onNew,
                setShowModal,
                setMainOpen,
                setProjectOpen,
                setProjectName,
                setChartType,
                setDescription
              })
            }
            projectName={projectName}
            setProjectName={setProjectName}
            chartType={chartType}
            setChartType={setChartType}
            description={description}
            setDescription={setDescription}
            forecastDate={forecastDate}
            setForecastDate={setForecastDate}
          />
        )}

        {showProjectList && (
          <ProjectListModal
            visible={showProjectList}
            projects={projects}
            onClose={() => setShowProjectList(false)}
            onSelect={(proj) => {
              console.log("Selected project:", proj);
              localStorage.setItem("projectId", proj._id);
              localStorage.setItem("projectName", proj.name);
              localStorage.setItem("chartType", proj.chartType || '12');

              if (onSave) onSave(proj);

              setMainOpen(false);
              setProjectOpen(false);
              setShowProjectList(false);
            }}
          />
        )}

        {isExporting && (
          <LoadingModal>
            Exporting map, please wait...
          </LoadingModal>
        )}

        {showSubmitModal && (
          <SubmitModal
            visible={showSubmitModal}
            onClose={() => setShowSubmitModal(false)}
            onSubmit={handleSubmit}
            projectTitle={localStorage.getItem('projectName') || 'Untitled Project'}
            projectType={localStorage.getItem('chartType') || 'Wave Analysis'}
            forecastDate={forecastDate || 'Not set'}
            isSubmitting={isSubmitting}
            isDarkMode={isDarkMode}
          />
        )}
      </InfoContainer>
    );
  }

  return (
    <>
      {/* <Dropdown $visible={mainOpen}>
        <MenuItem onClick={() => setProjectOpen(!projectOpen)} aria-expanded={projectOpen} >
          <FaFolder />
          Project
        </MenuItem>
        {projectOpen && (
          <SubDropdown>
            <SubMenuItem onClick={() => setShowModal(true)}>
              <FaPlus />
              New Project
            </SubMenuItem>
            <SubMenuItem onClick={async () => {
              try {
                const userProjects = await fetchUserProjects();
                setProjects(userProjects);
                setShowProjectList(true);
              } catch (err) {
                Swal.fire({
                  toast: true,
                  position: 'top-end',
                  icon: 'error',
                  title: 'Failed to load projects',
                  showConfirmButton: false,
                  timer: 2500,
                });
              }
            }}>
              <FaFolder />
              Open Project
            </SubMenuItem>
            <SubMenuItem onClick={async () => {
              downloadCachedSnapshotZip(setIsDarkMode, features);
            }}>
              <FaFileExport />
              Export Project
            </SubMenuItem>
          </SubDropdown>
        )}
        <MenuItem onClick={onView}>
          <FaEye />
          View
        </MenuItem>
        <MenuItem onClick={() => setShowSubmitModal(true)}>
          <FaPaperPlane />
          Submit
        </MenuItem>
        <MenuItem onClick={logout} $danger>
          <FaSignOutAlt />
          Logout
        </MenuItem>
      </Dropdown> */}

      <InfoContainer ref={menuRef}>
        <InfoHeader>
          {/* <MenuButton onClick={() => {
            setMainOpen(!mainOpen);
            setProjectOpen(false);
          }}>
            <FaBars />
          </MenuButton> */}
          <InfoTitle>
            <FaFolder />
            Project Details
          </InfoTitle>
          <MenuActions>
            <EditButton onClick={openEditModal}>
              <FaEdit />
            </EditButton>
          </MenuActions>
        </InfoHeader>

        <InfoItem>
          <InfoIcon iconType="project">
            <FaFolder />
          </InfoIcon>
          <InfoContent>
            <InfoLabel>Project Name</InfoLabel>
            <InfoValue>{projectName}</InfoValue>
          </InfoContent>
        </InfoItem>

        <InfoItem>
          <InfoIcon iconType="chart">
            <FaChartBar />
          </InfoIcon>
          <InfoContent>
            <InfoLabel>Chart Type</InfoLabel>
            <InfoValue>{chartType || 'Not specified'}</InfoValue>
          </InfoContent>
        </InfoItem>

        <InfoItem>
          <InfoIcon iconType="date">
            <FaCalendarAlt />
          </InfoIcon>
          <InfoContent>
            <InfoLabel>Forecast Date</InfoLabel>
            <InfoValue>{forecastDate || 'Not set'}</InfoValue>
          </InfoContent>
        </InfoItem>
      </InfoContainer>

      {/* Edit Project Modal */}
      {editModalOpen && (
        <Overlay onClick={() => setEditModalOpen(false)}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <h2>Edit Project Details</h2>
            <Field>
              <label>Project Name</label>
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter project name"
              />
            </Field>
            <Field>
              <label>Chart Type</label>
              <Input
                value={editedChart}
                onChange={(e) => setEditedChart(e.target.value)}
                placeholder="Enter chart type"
              />
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
                          backgroundColor: 'rgba(248, 250, 252, 0.8)',
                          borderRadius: '12px',
                          fontSize: '0.95rem',
                          color: '#1f2937',
                          height: '56px',
                          paddingLeft: '1rem',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            borderColor: 'rgba(0, 0, 0, 0.15)',
                          },
                          '&.Mui-focused': {
                            borderColor: '#3b82f6',
                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                            transform: 'translateY(-2px)',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          },
                        },
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </Field>
            <ButtonRow>
              <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </ButtonRow>
          </ModalContainer>
        </Overlay>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Overlay onClick={() => setShowDeleteConfirm(false)}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Confirm Deletion</h3>
            <p>
              This action cannot be undone. To confirm deletion of this project,
              please type <strong>"{projectName}"</strong> in the field below.
            </p>
            <Field>
              <Input
                placeholder={`Type "${projectName}" to confirm`}
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
              />
            </Field>
            <ButtonRow>
              <Button onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button
                danger
                disabled={deleteInput !== projectName}
                onClick={handleDelete}
              >
                <FaTrash style={{ marginRight: '0.5rem' }} />
                Confirm Delete
              </Button>
            </ButtonRow>
          </ModalContainer>
        </Overlay>
      )}

      {/* All Project Menu Modals */}
      {showModal && (
        <ProjectModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={() =>
            createProjectHandler({
              projectName,
              chartType,
              description,
              forecastDate,
              onNew,
              setShowModal,
              setMainOpen,
              setProjectOpen,
              setProjectName,
              setChartType,
              setDescription
            })
          }
          projectName={projectName}
          setProjectName={setProjectName}
          chartType={chartType}
          setChartType={setChartType}
          description={description}
          setDescription={setDescription}
          forecastDate={forecastDate}
          setForecastDate={setForecastDate}
        />
      )}

      {showProjectList && (
        <ProjectListModal
          visible={showProjectList}
          projects={projects}
          onClose={() => setShowProjectList(false)}
          onSelect={(proj) => {
            console.log("Selected project:", proj);
            localStorage.setItem("projectId", proj._id);
            localStorage.setItem("projectName", proj.name);
            localStorage.setItem("chartType", proj.chartType || '12');

            if (onSave) onSave(proj);

            setMainOpen(false);
            setProjectOpen(false);
            setShowProjectList(false);
          }}
        />
      )}

      {isExporting && (
        <LoadingModal>
          Exporting map, please wait...
        </LoadingModal>
      )}

      {showSubmitModal && (
        <SubmitModal
          visible={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onSubmit={handleSubmit}
          projectTitle={localStorage.getItem('projectName') || 'Untitled Project'}
          projectType={localStorage.getItem('chartType') || 'Wave Analysis'}
          forecastDate={forecastDate || 'Not set'}
          isSubmitting={isSubmitting}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
};

export default ProjectInfo;