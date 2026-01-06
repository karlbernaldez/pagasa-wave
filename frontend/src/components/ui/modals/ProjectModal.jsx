import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTheme } from 'styled-components';
import { FaChevronDown, FaCalendarAlt, FaProjectDiagram, FaFileAlt, FaChartBar } from 'react-icons/fa';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { 
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6));
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${({ theme }) => theme.zIndex?.loadingScreen || 1000};
  padding: 1rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContainer = styled.div`
  background: ${({ theme }) => theme.colors?.lightBackground || '#ffffff'};
  padding: 0;
  border-radius: 24px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 480px;
  font-family: ${({ theme }) => theme.fonts?.regular || 'system-ui, -apple-system, sans-serif'};
  overflow: hidden;
  z-index: ${({ theme }) => theme.zIndex?.loadingScreen || 1000};
  position: relative;
  animation: ${slideUp} 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 640px) {
    margin: 1rem;
    border-radius: 20px;
    max-height: 90vh;
    overflow-y: auto;
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors?.highlight || '#3b82f6'}, ${({ theme }) => theme.colors?.highlight || '#3b82f6'}dd);
  padding: 2rem 2rem 1.5rem 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    animation: ${shimmer} 3s ease-in-out infinite;
  }

  @media (max-width: 640px) {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
  }
`;

const HeaderIcon = styled.div`
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  margin-bottom: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  margin: 0.5rem 0 0 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  font-weight: 400;
`;

const FormContent = styled.div`
  padding: 2rem;

  @media (max-width: 640px) {
    padding: 1.5rem;
  }
`;

const FormControl = styled.div`
  width: 100%;
  margin-bottom: 1.5rem;

  &:last-of-type {
    margin-bottom: 2rem;
  }
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors?.textPrimary || '#1e293b'};

  svg {
    color: ${({ theme }) => theme.colors?.highlight || '#3b82f6'};
    font-size: 0.9rem;
  }
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const baseInputStyles = css`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid ${({ theme }) => theme.colors?.border || '#e2e8f0'};
  border-radius: 12px;
  font-size: 0.95rem;
  font-family: ${({ theme }) => theme.fonts?.regular || 'inherit'};
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors?.background || '#ffffff'};
  color: ${({ theme }) => theme.colors?.textPrimary || '#1e293b'};
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;

  &::placeholder {
    color: ${({ theme }) => theme.colors?.textSecondary || '#94a3b8'};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors?.highlight || '#3b82f6'};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors?.highlight || '#3b82f6'}20;
    transform: translateY(-1px);
  }

  &:hover:not(:focus) {
    border-color: ${({ theme }) => theme.colors?.highlight || '#3b82f6'}60;
  }
`;

const Input = styled.input`
  ${baseInputStyles}
`;

const TextArea = styled.textarea`
  ${baseInputStyles}
  resize: vertical;
  min-height: 80px;
  font-family: ${({ theme }) => theme.fonts?.regular || 'inherit'};
`;

const SelectWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const StyledSelect = styled.select`
  ${baseInputStyles}
  appearance: none;
  cursor: pointer;
  padding-right: 3rem;

  &:focus + svg {
    color: ${({ theme }) => theme.colors?.highlight || '#3b82f6'};
    transform: translateY(-50%) rotate(180deg);
  }
`;

const ChevronIcon = styled(FaChevronDown)`
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%) ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  color: ${({ theme }) => theme.colors?.textSecondary || '#94a3b8'};
  font-size: 0.875rem;
`;

const DatePickerWrapper = styled.div`
  .MuiTextField-root {
    width: 100%;
  }

  .MuiInputBase-root {
    background-color: ${({ theme }) => theme.colors?.background || '#ffffff'};
    border: 2px solid ${({ theme }) => theme.colors?.border || '#e2e8f0'};
    border-radius: 12px !important;
    padding: 0.875rem 1rem;
    font-family: ${({ theme }) => theme.fonts?.regular || 'inherit'};
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors?.textPrimary || '#1e293b'};
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

    &::before, &::after {
      display: none;
    }

    &:hover:not(.Mui-focused) {
      border-color: ${({ theme }) => theme.colors?.highlight || '#3b82f6'}60;
    }

    &.Mui-focused {
      border-color: ${({ theme }) => theme.colors?.highlight || '#3b82f6'};
      box-shadow: 0 0 0 3px ${({ theme }) => theme.colors?.highlight || '#3b82f6'}20;
      transform: translateY(-1px);
    }

    .MuiSvgIcon-root {
      color: ${({ theme }) => theme.colors?.highlight || '#3b82f6'};
    }
  }

  .MuiInputBase-input {
    padding: 0;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem 2rem 2rem 2rem;
  background: ${({ theme }) => theme.colors?.background || '#f8fafc'};
  border-top: 1px solid ${({ theme }) => theme.colors?.border || '#e2e8f0'};

  @media (max-width: 640px) {
    padding: 1rem 1.5rem 1.5rem 1.5rem;
    flex-direction: column-reverse;
    gap: 0.5rem;
  }
`;

const primaryButtonStyles = css`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors?.highlight || '#3b82f6'}, ${({ theme }) => theme.colors?.highlight || '#3b82f6'}dd);
  color: white;
  box-shadow: 0 4px 12px ${({ theme }) => theme.colors?.highlight || '#3b82f6'}30;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px ${({ theme }) => theme.colors?.highlight || '#3b82f6'}40;
    animation: ${pulse} 0.3s ease;
  }

  &:active {
    transform: translateY(-1px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
`;

const secondaryButtonStyles = css`
  background: ${({ theme }) => theme.colors?.lightBackground || '#ffffff'};
  color: ${({ theme }) => theme.colors?.textSecondary || '#64748b'};
  border: 2px solid ${({ theme }) => theme.colors?.border || '#e2e8f0'};

  &:hover {
    background: ${({ theme }) => theme.colors?.background || '#f1f5f9'};
    border-color: ${({ theme }) => theme.colors?.textSecondary || '#64748b'};
    transform: translateY(-1px);
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: ${({ theme }) => theme.fonts?.medium || 'inherit'};
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;

  ${({ $primary }) => $primary ? primaryButtonStyles : secondaryButtonStyles}

  @media (max-width: 640px) {
    padding: 0.875rem 1.5rem;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  @media (max-width: 640px) {
    top: 1rem;
    right: 1rem;
    width: 36px;
    height: 36px;
  }
`;

const ProjectModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  projectName, 
  setProjectName, 
  chartType, 
  setChartType, 
  description, 
  setDescription, 
  forecastDate, 
  setForecastDate 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const theme = useTheme();
  const modalRef = useRef(null);
  const datePickerRef = useRef(null);

  const handleSubmit = () => {
    const missingFields = [];

    if (!projectName.trim()) {
      missingFields.push('Project Name');
    }

    if (missingFields.length > 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: `${missingFields.join(' and ')} ${missingFields.length === 1 ? 'is' : 'are'} required!`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    onSubmit();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideModal = modalRef.current && !modalRef.current.contains(event.target);
      const isOutsideDate = datePickerRef.current && !datePickerRef.current.contains(event.target);
      if (isOutsideModal && isOutsideDate) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!visible) return null;

  return (
    <Overlay onClick={handleBackdropClick}>
      <ModalContainer ref={modalRef}>
        <CloseButton onClick={onClose} aria-label="Close modal">
          ×
        </CloseButton>

        <Header>
          <HeaderIcon>
            <FaProjectDiagram />
          </HeaderIcon>
          <Title>Create New Project</Title>
          <Subtitle>Set up your project with all the details</Subtitle>
        </Header>

        <FormContent>
          <FormControl>
            <Label htmlFor="projectName">
              <FaProjectDiagram />
              Project Name
            </Label>
            <InputWrapper>
              <Input
                id="projectName"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="Enter a descriptive project name"
                autoFocus
              />
            </InputWrapper>
          </FormControl>

          <FormControl>
            <Label htmlFor="description">
              <FaFileAlt />
              Description
            </Label>
            <InputWrapper>
              <TextArea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly describe your project goals and objectives"
              />
            </InputWrapper>
          </FormControl>

          <FormControl>
            <Label htmlFor="chartType">
              <FaChartBar />
              Chart Type
            </Label>
            <SelectWrapper>
              <StyledSelect
                id="chartType"
                value={chartType}
                onChange={e => setChartType(e.target.value)}
                onClick={() => setIsDropdownOpen(prev => !prev)}
                onBlur={() => setIsDropdownOpen(false)}
              >
                <option value="Wave Analysis">Wave Analysis</option>
                <option value="24">24</option>
                <option value="36">36</option>
                <option value="48">48</option>
              </StyledSelect>
              <ChevronIcon $open={isDropdownOpen} />
            </SelectWrapper>
          </FormControl>

          <FormControl>
            <Label htmlFor="forecastDate">
              <FaCalendarAlt />
              Forecast Date
            </Label>
            <DatePickerWrapper ref={datePickerRef}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={dayjs()}
                  onChange={(newDate) => setForecastDate(newDate)}
                  disabled
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'filled',
                      InputProps: {
                        disableUnderline: true,
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </DatePickerWrapper>
          </FormControl>
        </FormContent>

        <ButtonGroup>
          <Button onClick={onClose}>Cancel</Button>
          <Button $primary onClick={handleSubmit}>
            Create Project
          </Button>
        </ButtonGroup>
      </ModalContainer>
    </Overlay>
  );
};

export default ProjectModal;