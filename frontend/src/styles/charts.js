import styled from 'styled-components';

// Page Container
export const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.isDarkMode
    ? 'linear-gradient(135deg, #111827 0%, #1e3a8a 20%, #111827 100%)'
    : 'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #e0f2fe 100%)'};
  padding-top: 6rem;
  padding-bottom: 4rem;
`;

export const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

// Header Section
export const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

export const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
  margin-bottom: 1rem;
  
  @media (min-width: 640px) {
    font-size: 3rem;
  }
`;

export const GradientText = styled.span`
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

export const PageSubtitle = styled.p`
  font-size: 1.125rem;
  color: ${props => props.isDarkMode ? '#d1d5db' : '#4b5563'};
  max-width: 600px;
  margin: 0 auto;
`;

// Chart Style Selector
export const ChartSelector = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 3rem;
`;

export const SelectorWrapper = styled.div`
  display: flex;
  background: ${props => props.isDarkMode
    ? 'rgba(31, 41, 55, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'};
  backdrop-filter: blur(20px);
  border: 1px solid ${props => props.isDarkMode
    ? 'rgba(75, 85, 99, 0.3)'
    : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 1rem;
  padding: 0.5rem;
  box-shadow: ${props => props.isDarkMode
    ? '0 10px 40px rgba(0, 0, 0, 0.3)'
    : '0 10px 40px rgba(0, 0, 0, 0.1)'};
  
  @media (max-width: 640px) {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }
`;

export const ChartOption = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background: ${props => props.active
    ? 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)'
    : 'transparent'};
  color: ${props => props.active
    ? '#ffffff'
    : props.isDarkMode ? '#d1d5db' : '#4b5563'};
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.active
    ? 'linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)'
    : props.isDarkMode
      ? 'rgba(55, 65, 81, 0.5)'
      : 'rgba(243, 244, 246, 0.8)'};
    transform: translateY(-1px);
  }
  
  svg {
    width: 1.125rem;
    height: 1.125rem;
  }
  
  @media (max-width: 640px) {
    justify-content: center;
  }
`;

// Charts Grid
export const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const ChartCard = styled.div`
  background: ${props => props.isDarkMode
    ? 'rgba(31, 41, 55, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'};
  backdrop-filter: blur(20px);
  border: 1px solid ${props => props.isDarkMode
    ? 'rgba(75, 85, 99, 0.3)'
    : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: ${props => props.isDarkMode
    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    : '0 25px 50px -12px rgba(0, 0, 0, 0.1)'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.isDarkMode
    ? '0 35px 60px -12px rgba(0, 0, 0, 0.6)'
    : '0 35px 60px -12px rgba(0, 0, 0, 0.15)'};
  }
`;

export const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${props => props.isDarkMode
    ? 'rgba(75, 85, 99, 0.3)'
    : 'rgba(229, 231, 235, 0.5)'};
`;

export const ChartIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, ${props => props.color} 0%, ${props => props.colorSecondary} 100%);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px ${props => props.color}40;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: white;
  }
`;

export const ChartTitleSection = styled.div`
  flex: 1;
`;

export const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
  margin-bottom: 0.25rem;
`;

export const ChartSubtitle = styled.p`
  font-size: 0.875rem;
  color: ${props => props.isDarkMode ? '#9ca3af' : '#6b7280'};
`;

// Chart Image Container
export const ChartImageContainer = styled.div`
  position: relative;
  height: 280px;
  background: ${props => props.isDarkMode
    ? 'linear-gradient(135deg, #1f2937 0%, #374151 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'};
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${props => props.isDarkMode
    ? 'rgba(75, 85, 99, 0.2)'
    : 'rgba(203, 213, 225, 0.3)'};
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.02);
  }
  
  /* Hover hint styling */
  & > div:last-child {
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  &:hover > div:last-child {
    opacity: 1;
  }
`;

export const ChartPlaceholder = styled.div`
  text-align: center;
  color: ${props => props.isDarkMode ? '#6b7280' : '#94a3b8'};
`;

export const PlaceholderIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background: ${props => props.isDarkMode
    ? 'rgba(55, 65, 81, 0.5)'
    : 'rgba(226, 232, 240, 0.8)'};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  
  svg {
    width: 2rem;
    height: 2rem;
    color: ${props => props.isDarkMode ? '#9ca3af' : '#64748b'};
  }
`;

export const PlaceholderText = styled.p`
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

export const PlaceholderSubtext = styled.p`
  font-size: 0.875rem;
  opacity: 0.7;
`;

// Chart Labels
export const ChartLabels = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

export const LabelItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: ${props => props.isDarkMode
    ? 'rgba(17, 24, 39, 0.5)'
    : 'rgba(248, 250, 252, 0.8)'};
  border-radius: 0.75rem;
  border: 1px solid ${props => props.isDarkMode
    ? 'rgba(55, 65, 81, 0.3)'
    : 'rgba(226, 232, 240, 0.5)'};
`;

export const LabelDot = styled.div`
  width: 0.75rem;
  height: 0.75rem;
  background: ${props => props.color};
  border-radius: 50%;
  box-shadow: 0 0 8px ${props => props.color}40;
`;

export const LabelText = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.isDarkMode ? '#d1d5db' : '#374151'};
`;

export const LabelValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
  margin-left: auto;
`;

// Legend Section
export const LegendSection = styled.div`
  background: ${props => props.isDarkMode
    ? 'rgba(31, 41, 55, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'};
  backdrop-filter: blur(20px);
  border: 1px solid ${props => props.isDarkMode
    ? 'rgba(75, 85, 99, 0.3)'
    : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: ${props => props.isDarkMode
    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    : '0 25px 50px -12px rgba(0, 0, 0, 0.1)'};
`;

export const LegendTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
  margin-bottom: 1.5rem;
  text-align: center;
`;

export const LegendGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

export const LegendCategory = styled.div`
  background: ${props => props.isDarkMode
    ? 'rgba(17, 24, 39, 0.5)'
    : 'rgba(248, 250, 252, 0.8)'};
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid ${props => props.isDarkMode
    ? 'rgba(55, 65, 81, 0.3)'
    : 'rgba(226, 232, 240, 0.5)'};
`;

export const CategoryTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${props => props.color};
  }
`;

export const LegendItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const LegendColorBox = styled.div`
  width: 1rem;
  height: 1rem;
  background: ${props => props.color};
  border-radius: 0.25rem;
  box-shadow: 0 0 8px ${props => props.color}30;
`;

export const LegendItemText = styled.span`
  font-size: 0.875rem;
  color: ${props => props.isDarkMode ? '#d1d5db' : '#374151'};
`;