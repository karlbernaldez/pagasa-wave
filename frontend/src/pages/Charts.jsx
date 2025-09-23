import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { BarChart3, LineChart as LineChartIcon, TrendingUp, Activity, Cloud, Thermometer, Wind, Droplets, Eye, Gauge, Sun, CloudRain } from 'lucide-react';
import { PageContainer, Container, PageHeader, PageTitle, GradientText, PageSubtitle, } from '../styles/charts';
import { ChartSelector, SelectorWrapper, ChartOption, ChartsGrid, ChartCard, ChartHeader, ChartIcon, ChartTitleSection, ChartTitle, ChartSubtitle, ChartImageContainer, ChartPlaceholder, PlaceholderIcon, PlaceholderText, PlaceholderSubtext, ChartLabels, LabelItem, LabelDot, LabelText, LabelValue, LegendSection, LegendTitle, LegendGrid, LegendCategory, CategoryTitle, LegendItems, LegendItem, LegendColorBox, LegendItemText } from '../styles/charts';

// Main Component
const ForecastChartsPage = ({ isDarkMode }) => {
  const [activeChartType, setActiveChartType] = useState('wave-wind');
  const [previewImage, setPreviewImage] = useState(null);

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
        '/charts/wave-wind/light/map_snapshot_light.png',
        '/charts/wave-wind/light/map_snapshot_light.png',
        '/charts/wave-wind/light/map_snapshot_light.png',
        '/charts/wave-wind/light/map_snapshot_light.png',
      ],
      dark: [
        '/charts/wave-wind/dark/map_snapshot_dark.png',
        '/charts/wave-wind/dark/map_snapshot_dark.png',
        '/charts/wave-wind/dark/map_snapshot_dark.png',
        '/charts/wave-wind/dark/map_snapshot_dark.png',
      ]
    },
    'wave-only': {
      light: [
        '/charts/wave/light/map_snapshot_light.png',
        '/charts/wave/light/map_snapshot_light.png',
        '/charts/wave/light/map_snapshot_light.png',
        '/charts/wave/light/map_snapshot_light.png',
      ],
      dark: [
        '/charts/wave/dark/map_snapshot_dark.png',
        '/charts/wave/dark/map_snapshot_dark.png',
        '/charts/wave/dark/map_snapshot_dark.png',
        '/charts/wave/dark/map_snapshot_dark.png',
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

  const handleImageClick = (image, title) => {
    setPreviewImage({ src: image, title });
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <>
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

                  <ChartImageContainer
                    isDarkMode={isDarkMode}
                    onClick={() => handleImageClick(image, meta.title)}
                  >
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

                    {/* Add this hover hint */}
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '0.5rem',
                      padding: '0.5rem',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.75rem',
                      opacity: 0,
                      transition: 'opacity 0.2s'
                    }}
                      onMouseEnter={(e) => {
                        const hint = e.currentTarget.querySelector('div:last-child');
                        if (hint) hint.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        const hint = e.currentTarget.querySelector('div:last-child');
                        if (hint) hint.style.opacity = '0';
                      }}>
                      <ZoomIn size={12} />
                      Click to enlarge
                    </div>
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

      { previewImage && (
          <div
            onClick={closePreview}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                background: '#ffffff',
                borderRadius: '1rem',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <button
                onClick={closePreview}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  zIndex: 1001,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
              <div>
                <div style={{
                  padding: '1rem',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    {previewImage.title}
                  </h3>
                </div>
                <img
                  src={previewImage.src}
                  alt={previewImage.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                />
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default ForecastChartsPage;