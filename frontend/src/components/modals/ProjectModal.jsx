import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTheme } from 'styled-components';
import { FaChevronDown } from 'react-icons/fa';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: ${({ theme }) => theme.colors.loadingBackground || "rgba(0, 0, 0, 0.4)"};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${({ theme }) => theme.zIndex.loadingScreen};
`;

const ModalContainer = styled.div`
  background: ${({ theme }) => theme.colors.lightBackground};
  padding: ${({ theme }) => theme.spacing.large};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.colors.boxShadow};
  width: 100%;
  max-width: 400px;
  font-family: ${({ theme }) => theme.fonts.regular};
`;

const Title = styled.h2`
  margin-top: 0;
  margin-bottom: ${({ theme }) => theme.spacing.medium};
  font-size: ${({ theme }) => theme.fontSizes.large};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.small};
  margin-bottom: ${({ theme }) => theme.spacing.xsmall};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const FormControl = styled.div`
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.medium};
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.xsmall} ${theme.spacing.small}`};
  border: 1px solid ${({ theme }) => theme.colors.border || "#ccc"};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: ${({ theme }) => theme.fontSizes.medium};
  font-family: ${({ theme }) => theme.fonts.regular};
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textPrimary};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.highlight};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.highlight}33;
  }
`;

const SelectWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.xsmall} ${theme.spacing.large} ${theme.spacing.xsmall} ${theme.spacing.small}`};
  border: 1px solid ${({ theme }) => theme.colors.border || "#ccc"};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: ${({ theme }) => theme.fontSizes.medium};
  font-family: ${({ theme }) => theme.fonts.regular};
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textPrimary};
  appearance: none;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.highlight};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.highlight}33;
  }
`;

const StyledDateWrapper = styled.div`
  .MuiFilledInput-root {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.textPrimary};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    box-shadow: none;
  }

  .MuiInputBase-input {
    color: ${({ theme }) => theme.colors.textPrimary};
    padding: ${({ theme }) => `${theme.spacing.xsmall} ${theme.spacing.small}`};
    font-family: ${({ theme }) => theme.fonts.regular};
    font-size: ${({ theme }) => theme.fontSizes.medium};
  }

  .MuiInputLabel-root {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  .MuiSvgIcon-root {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  .Mui-focused .MuiInputLabel-root {
    color: ${({ theme }) => theme.colors.highlight};
  }

  .MuiFilledInput-root.Mui-focused {
    border: 1px solid ${({ theme }) => theme.colors.highlight};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.highlight}33;
  }
`;

const ChevronIcon = styled(FaChevronDown)`
  position: absolute;
  top: 50%;
  right: ${({ theme }) => theme.spacing.small};
  transform: translateY(-50%) ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.3s ease;
  pointer-events: none;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.small};
`;

const Button = styled.button`
  padding: ${({ theme }) => `${theme.spacing.xsmall} ${theme.spacing.medium}`};
  font-size: ${({ theme }) => theme.fontSizes.small};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  font-family: ${({ theme }) => theme.fonts.medium};
  background-color: ${({ theme, $primary }) =>
    $primary ? theme.mainColors.blue : theme.colors.lightBackground};
  color: ${({ theme, $primary }) =>
    $primary ? theme.mainColors.white : theme.colors.textPrimary};

  &:hover {
    background-color: ${({ theme, $primary }) =>
    $primary ? theme.mainColors.lightBlue : "#ddd"};
  }
`;

const ProjectModal = ({ visible, onClose, onSubmit, projectName, setProjectName, chartType, setChartType, description, setDescription, forecastDate, setForecastDate }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const theme = useTheme();
  const modalRef = useRef(null);
  const datePickerRef = useRef(null);

  const handleSubmit = () => {
    const missingFields = [];

    if (!projectName.trim()) {
      missingFields.push('Project Name');
    }

    if (!forecastDate) {
      missingFields.push('Forecast Date');
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

    onSubmit(); // ✅ All validations passed
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
    <Overlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <Title>Create New Project</Title>

        <FormControl>
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="Enter project name"
            autoFocus
          />
        </FormControl>

        <FormControl>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Enter project description"
          />
        </FormControl>

        <FormControl>
          <Label htmlFor="chartType">Chart Type</Label>
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
          <Label htmlFor="forecastDate">Forecast Date</Label>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={forecastDate ? dayjs(forecastDate) : null}
              onChange={(newValue) => {
                const formatted = newValue ? newValue.format('YYYY-MM-DD') : '';
                setForecastDate(formatted);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'standard',
                  InputProps: {
                    disableUnderline: true,
                    sx: {
                      backgroundColor: theme.colors.background, // ✅ direct access from useTheme
                      borderRadius: theme.borderRadius.medium,
                      fontFamily: theme.fonts.regular,
                      fontSize: theme.fontSizes.medium,
                      color: theme.colors.textPrimary,
                      height: '40px',
                      paddingLeft: theme.spacing.small,
                      border: `1px solid #ccc}`,
                      '& input': {
                        textAlign: 'left', // ✅ align MM/DD/YYYY left
                      },
                      '&:hover': {
                        borderColor: theme.colors.highlight,
                      },
                      '&.Mui-focused': {
                        borderColor: theme.colors.highlight,
                        boxShadow: `0 0 0 2px ${theme.colors.highlight}33`,
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#a0a0a0', // White calendar icon
                      },
                    },
                  },
                },
              }}
            />
          </LocalizationProvider>
        </FormControl>

        <ButtonGroup>
          <Button onClick={onClose}>Cancel</Button>
          <Button $primary onClick={handleSubmit}>Create</Button>
        </ButtonGroup>
      </ModalContainer>
    </Overlay>
  );
};

export default ProjectModal;
