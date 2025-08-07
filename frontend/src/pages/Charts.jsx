import React, { useState } from 'react';
import styled from 'styled-components';
import {
  BarChart3,
  LineChart as LineChartIcon,
  TrendingUp,
  Activity,
  Cloud,
  Thermometer,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Sun,
  CloudRain
} from 'lucide-react';

// Page Container
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.isDarkMode
    ? 'linear-gradient(135deg, #111827 0%, #1e3a8a 20%, #111827 100%)'
    : 'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #e0f2fe 100%)'};
  padding-top: 6rem;
  padding-bottom: 4rem;
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

// Header Section
const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
  margin-bottom: 1rem;
  
  @media (min-width: 640px) {
    font-size: 3rem;
  }
`;

const GradientText = styled.span`
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const PageSubtitle = styled.p`
  font-size: 1.125rem;
  color: ${props => props.isDarkMode ? '#d1d5db' : '#4b5563'};
  max-width: 600px;
  margin: 0 auto;
`;

// Chart Style Selector
const ChartSelector = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 3rem;
`;

const SelectorWrapper = styled.div`
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

const ChartOption = styled.button`
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
const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ChartCard = styled.div`
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

const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${props => props.isDarkMode
    ? 'rgba(75, 85, 99, 0.3)'
    : 'rgba(229, 231, 235, 0.5)'};
`;

const ChartIcon = styled.div`
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

const ChartTitleSection = styled.div`
  flex: 1;
`;

const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
  margin-bottom: 0.25rem;
`;

const ChartSubtitle = styled.p`
  font-size: 0.875rem;
  color: ${props => props.isDarkMode ? '#9ca3af' : '#6b7280'};
`;

// Chart Image Container
const ChartImageContainer = styled.div`
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
`;

const ChartPlaceholder = styled.div`
  text-align: center;
  color: ${props => props.isDarkMode ? '#6b7280' : '#94a3b8'};
`;

const PlaceholderIcon = styled.div`
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

const PlaceholderText = styled.p`
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const PlaceholderSubtext = styled.p`
  font-size: 0.875rem;
  opacity: 0.7;
`;

// Chart Labels
const ChartLabels = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const LabelItem = styled.div`
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

const LabelDot = styled.div`
  width: 0.75rem;
  height: 0.75rem;
  background: ${props => props.color};
  border-radius: 50%;
  box-shadow: 0 0 8px ${props => props.color}40;
`;

const LabelText = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.isDarkMode ? '#d1d5db' : '#374151'};
`;

const LabelValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
  margin-left: auto;
`;

// Legend Section
const LegendSection = styled.div`
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

const LegendTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
  margin-bottom: 1.5rem;
  text-align: center;
`;

const LegendGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const LegendCategory = styled.div`
  background: ${props => props.isDarkMode
    ? 'rgba(17, 24, 39, 0.5)'
    : 'rgba(248, 250, 252, 0.8)'};
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid ${props => props.isDarkMode
    ? 'rgba(55, 65, 81, 0.3)'
    : 'rgba(226, 232, 240, 0.5)'};
`;

const CategoryTitle = styled.h4`
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

const LegendItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const LegendColorBox = styled.div`
  width: 1rem;
  height: 1rem;
  background: ${props => props.color};
  border-radius: 0.25rem;
  box-shadow: 0 0 8px ${props => props.color}30;
`;

const LegendItemText = styled.span`
  font-size: 0.875rem;
  color: ${props => props.isDarkMode ? '#d1d5db' : '#374151'};
`;

// Main Component
const ForecastChartsPage = ({ isDarkMode }) => {
  const [activeChartType, setActiveChartType] = useState('wave-wind');

  const chartTypes = [
    { id: 'wave-wind', name: 'Wave and Wind', icon: Wind },
    { id: 'wave-only', name: 'Wave Only', icon: Activity },
    { id: 'visually-impaired', name: 'For Visually Impaired', icon: Eye }
  ];

  // Static meta info
  const chartMeta = {
    1: {
      title: 'Wave Analysis',
      subtitle: 'Current Wave Conditions & Patterns',
      icon: Activity,
      color: '#06b6d4',
      colorSecondary: '#0891b2'
    },
    2: {
      title: '24-h Prognostic Wave Chart',
      subtitle: '24-Hour Wave Height & Direction Forecast',
      icon: TrendingUp,
      color: '#10b981',
      colorSecondary: '#059669'
    },
    3: {
      title: '36-h Prognostic Wave Chart',
      subtitle: '36-Hour Extended Wave Forecast',
      icon: Wind,
      color: '#f59e0b',
      colorSecondary: '#d97706'
    },
    4: {
      title: '48-h Prognostic Wave Chart',
      subtitle: '48-Hour Long-Range Wave Forecast',
      icon: Gauge,
      color: '#8b5cf6',
      colorSecondary: '#7c3aed'
    }
  };

  // Dynamic chart labels data
  const chartData = [
    {
      id: 1,
      labels: [
        { name: 'Wave Height', value: '2.1m', color: '#06b6d4' },
        { name: 'Period', value: '8.5s', color: '#3b82f6' },
        { name: 'Direction', value: 'SW', color: '#10b981' },
        { name: 'Energy', value: 'High', color: '#f59e0b' }
      ]
    },
    {
      id: 2,
      labels: [
        { name: 'Max Height', value: '2.8m', color: '#10b981' },
        { name: 'Min Height', value: '1.5m', color: '#3b82f6' },
        { name: 'Avg Period', value: '7.2s', color: '#06b6d4' },
        { name: 'Dominant Dir', value: 'WSW', color: '#f59e0b' }
      ]
    },
    {
      id: 3,
      labels: [
        { name: 'Max Height', value: '3.2m', color: '#f59e0b' },
        { name: 'Min Height', value: '1.8m', color: '#3b82f6' },
        { name: 'Avg Period', value: '9.1s', color: '#06b6d4' },
        { name: 'Dominant Dir', value: 'W', color: '#10b981' }
      ]
    },
    {
      id: 4,
      labels: [
        { name: 'Max Height', value: '3.5m', color: '#8b5cf6' },
        { name: 'Min Height', value: '2.0m', color: '#3b82f6' },
        { name: 'Avg Period', value: '10.3s', color: '#06b6d4' },
        { name: 'Dominant Dir', value: 'WNW', color: '#ef4444' }
      ]
    }
  ];

  // Legend data (unchanged)
  const legendData = [
    {
      title: 'Temperature Scale',
      icon: Thermometer,
      color: '#ef4444',
      items: [
        { color: '#dc2626', text: 'Above 35°C - Very Hot' },
        { color: '#ef4444', text: '30-35°C - Hot' },
        { color: '#f59e0b', text: '25-30°C - Warm' },
        { color: '#10b981', text: '20-25°C - Comfortable' },
        { color: '#3b82f6', text: 'Below 20°C - Cool' }
      ]
    },
    {
      title: 'Wind Speed',
      icon: Wind,
      color: '#3b82f6',
      items: [
        { color: '#dc2626', text: 'Above 50 km/h - Strong Winds' },
        { color: '#f59e0b', text: '25-50 km/h - Moderate Winds' },
        { color: '#10b981', text: '10-25 km/h - Light Winds' },
        { color: '#3b82f6', text: 'Below 10 km/h - Calm' }
      ]
    },
    {
      title: 'Precipitation',
      icon: CloudRain,
      color: '#06b6d4',
      items: [
        { color: '#dc2626', text: 'Above 25mm - Heavy Rain' },
        { color: '#f59e0b', text: '10-25mm - Moderate Rain' },
        { color: '#10b981', text: '2-10mm - Light Rain' },
        { color: '#06b6d4', text: 'Below 2mm - Drizzle' }
      ]
    },
    {
      title: 'Weather Conditions',
      icon: Sun,
      color: '#f59e0b',
      items: [
        { color: '#f59e0b', text: 'Clear Skies' },
        { color: '#10b981', text: 'Partly Cloudy' },
        { color: '#6b7280', text: 'Overcast' },
        { color: '#3b82f6', text: 'Rainy' }
      ]
    }
  ];

  // Image sets for each chart type and mode
  const imagePaths = {
    'wave-wind': {
      light: [
        '/charts/wave-wind/analysis_light.png',
        '/charts/wave-wind/24h_light.png',
        '/charts/wave-wind/36h_light.png',
        '/charts/wave-wind/48h_light.png'
      ],
      dark: [
        '/charts/map_snapshot_dark.png',
        '/charts/wave-wind/24h_dark.png',
        '/charts/wave-wind/36h_dark.png',
        '/charts/wave-wind/48h_dark.png'
      ]
    },
    'wave-only': {
      light: [
        '/charts/wave-only/analysis_light.png',
        '/charts/wave-only/24h_light.png',
        '/charts/wave-only/36h_light.png',
        '/charts/wave-only/48h_light.png'
      ],
      dark: [
        '/charts/wave-only/analysis_dark.png',
        '/charts/wave-only/24h_dark.png',
        '/charts/wave-only/36h_dark.png',
        '/charts/wave-only/48h_dark.png'
      ]
    },
    'visually-impaired': {
      light: [
        '/charts/visually-impaired/analysis_light.png',
        '/charts/visually-impaired/24h_light.png',
        '/charts/visually-impaired/36h_light.png',
        '/charts/visually-impaired/48h_light.png'
      ],
      dark: [
        '/charts/visually-impaired/analysis_dark.png',
        '/charts/visually-impaired/24h_dark.png',
        '/charts/visually-impaired/36h_dark.png',
        '/charts/visually-impaired/48h_dark.png'
      ]
    }
  };

  // Select correct images array based on active type and dark mode
  const selectedImages = imagePaths[activeChartType][isDarkMode ? 'dark' : 'light'];

  return (
    <PageContainer isDarkMode={isDarkMode}>
      <Container>
        <PageHeader>
          <PageTitle isDarkMode={isDarkMode}>
            Wave Analysis <GradientText>Forecast Charts</GradientText>
          </PageTitle>
          <PageSubtitle isDarkMode={isDarkMode}>
            Comprehensive wave analysis and prognostic charts for marine weather forecasting
          </PageSubtitle>
        </PageHeader>

        <ChartSelector>
          <SelectorWrapper isDarkMode={isDarkMode}>
            {chartTypes.map((type) => (
              <ChartOption
                key={type.id}
                active={activeChartType === type.id}
                isDarkMode={isDarkMode}
                onClick={() => setActiveChartType(type.id)}
              >
                <type.icon />
                {type.name}
              </ChartOption>
            ))}
          </SelectorWrapper>
        </ChartSelector>

        <ChartsGrid>
          {chartData.map((chart, index) => {
            const meta = chartMeta[chart.id];
            const image = selectedImages[index];

            return (
              <ChartCard key={chart.id} isDarkMode={isDarkMode}>
                <ChartHeader isDarkMode={isDarkMode}>
                  <ChartIcon color={meta.color} colorSecondary={meta.colorSecondary}>
                    <meta.icon />
                  </ChartIcon>
                  <ChartTitleSection>
                    <ChartTitle isDarkMode={isDarkMode}>{meta.title}</ChartTitle>
                    <ChartSubtitle isDarkMode={isDarkMode}>{meta.subtitle}</ChartSubtitle>
                  </ChartTitleSection>
                </ChartHeader>

                <ChartImageContainer isDarkMode={isDarkMode}>
                  {image ? (
                    <img
                      src={image}
                      alt={meta.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '1rem'
                      }}
                    />
                  ) : (
                    <ChartPlaceholder isDarkMode={isDarkMode}>
                      <PlaceholderIcon isDarkMode={isDarkMode}>
                        <meta.icon />
                      </PlaceholderIcon>
                      <PlaceholderText>
                        {activeChartType === 'wave-wind'
                          ? 'Wave and Wind Chart'
                          : activeChartType === 'wave-only'
                            ? 'Wave Only Chart'
                            : 'Visually Impaired Accessible Chart'}
                      </PlaceholderText>
                      <PlaceholderSubtext>
                        {activeChartType === 'wave-wind'
                          ? 'Combined wave height and wind vector visualization'
                          : activeChartType === 'wave-only'
                            ? 'Wave height and direction only'
                            : 'High contrast chart with enhanced accessibility features'}
                      </PlaceholderSubtext>
                    </ChartPlaceholder>
                  )}
                </ChartImageContainer>

                <ChartLabels>
                  {chart.labels.map((label, index) => (
                    <LabelItem key={index} isDarkMode={isDarkMode}>
                      <LabelDot color={label.color} />
                      <LabelText isDarkMode={isDarkMode}>{label.name}</LabelText>
                      <LabelValue isDarkMode={isDarkMode}>{label.value}</LabelValue>
                    </LabelItem>
                  ))}
                </ChartLabels>
              </ChartCard>
            );
          })}
        </ChartsGrid>

        <LegendSection isDarkMode={isDarkMode}>
          <LegendTitle isDarkMode={isDarkMode}>Chart Legend & Reference Guide</LegendTitle>
          <LegendGrid>
            {legendData.map((category, index) => (
              <LegendCategory key={index} isDarkMode={isDarkMode}>
                <CategoryTitle isDarkMode={isDarkMode} color={category.color}>
                  <category.icon />
                  {category.title}
                </CategoryTitle>
                <LegendItems>
                  {category.items.map((item, itemIndex) => (
                    <LegendItem key={itemIndex}>
                      <LegendColorBox color={item.color} />
                      <LegendItemText isDarkMode={isDarkMode}>{item.text}</LegendItemText>
                    </LegendItem>
                  ))}
                </LegendItems>
              </LegendCategory>
            ))}
          </LegendGrid>
        </LegendSection>
      </Container>
    </PageContainer>
  );
};

export default ForecastChartsPage;