import React from 'react';
import styled from 'styled-components';
import { 
  Cloud, 
  Zap, 
  Shield, 
  Smartphone, 
  Globe, 
  Bell,
  BarChart3,
  MapPin,
  Calendar,
  Thermometer,
  Wind,
  Eye
} from 'lucide-react';

// Features Section Styled Components
const FeaturesContainer = styled.section`
  position: relative;
  padding: 6rem 0;
  background: ${props => props.isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)'};
  overflow: hidden;
`;

const BackgroundPattern = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.05;
  background-image: radial-gradient(circle at 1px 1px, ${props => props.isDark ? '#60a5fa' : '#0ea5e9'} 1px, transparent 0);
  background-size: 40px 40px;
  animation: drift 20s ease-in-out infinite;
  
  @keyframes drift {
    0%, 100% { transform: translateX(0) translateY(0); }
    50% { transform: translateX(20px) translateY(-20px); }
  }
`;

const FloatingElements = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
`;

const FloatingIcon = styled.div`
  position: absolute;
  color: ${props => props.isDark ? '#3b82f6' : '#0ea5e9'};
  opacity: 0.1;
  animation: float 8s ease-in-out infinite;
  
  &.icon-1 {
    top: 10%;
    left: 5%;
    animation-delay: 0s;
  }
  
  &.icon-2 {
    top: 20%;
    right: 8%;
    animation-delay: 2s;
  }
  
  &.icon-3 {
    bottom: 30%;
    left: 10%;
    animation-delay: 4s;
  }
  
  &.icon-4 {
    bottom: 15%;
    right: 15%;
    animation-delay: 6s;
  }
  
  svg {
    width: 3rem;
    height: 3rem;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
    50% { transform: translateY(-30px) rotate(180deg); opacity: 0.2; }
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
  z-index: 10;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.isDark
    ? 'rgba(14, 165, 233, 0.1)'
    : 'rgba(14, 165, 233, 0.1)'};
  border: 1px solid ${props => props.isDark
    ? 'rgba(14, 165, 233, 0.2)'
    : 'rgba(14, 165, 233, 0.2)'};
  border-radius: 2rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.isDark ? '#60a5fa' : '#0ea5e9'};
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
  color: ${props => props.isDark ? '#ffffff' : '#111827'};
  margin-bottom: 1rem;
  
  @media (min-width: 640px) {
    font-size: 3rem;
  }
  
  @media (min-width: 1024px) {
    font-size: 3.5rem;
  }
`;

const GradientText = styled.span`
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SectionSubtitle = styled.p`
  font-size: 1.125rem;
  line-height: 1.7;
  color: ${props => props.isDark ? '#d1d5db' : '#4b5563'};
  max-width: 40rem;
  margin: 0 auto;
  
  @media (min-width: 640px) {
    font-size: 1.25rem;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 3rem;
  }
`;

const FeatureCard = styled.div`
  position: relative;
  background: ${props => props.isDark
    ? 'rgba(31, 41, 55, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'};
  backdrop-filter: blur(20px);
  border: 1px solid ${props => props.isDark
    ? 'rgba(75, 85, 99, 0.3)'
    : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 1.25rem;
  padding: 2rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      ${props => props.isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(14, 165, 233, 0.05)'}, 
      transparent
    );
    transition: left 0.6s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: ${props => props.isDark
      ? '0 25px 60px -12px rgba(59, 130, 246, 0.25)'
      : '0 25px 60px -12px rgba(14, 165, 233, 0.15)'};
    border-color: ${props => props.isDark
      ? 'rgba(59, 130, 246, 0.3)'
      : 'rgba(14, 165, 233, 0.3)'};
  }
`;

const FeatureIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background: ${props => {
    const colors = {
      primary: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
      secondary: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      accent: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      pink: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      indigo: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
    };
    return colors[props.variant] || colors.primary;
  }};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  svg {
    width: 1.75rem;
    height: 1.75rem;
    color: white;
  }
  
  ${FeatureCard}:hover & {
    transform: scale(1.1) rotateY(10deg);
    box-shadow: 0 12px 35px rgba(14, 165, 233, 0.3);
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.isDark ? '#ffffff' : '#111827'};
  margin-bottom: 0.75rem;
  transition: color 0.3s ease;
`;

const FeatureDescription = styled.p`
  font-size: 0.95rem;
  line-height: 1.6;
  color: ${props => props.isDark ? '#d1d5db' : '#4b5563'};
  transition: color 0.3s ease;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0 0 0;
`;

const FeatureListItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${props => props.isDark ? '#d1d5db' : '#4b5563'};
  margin-bottom: 0.5rem;
  
  &::before {
    content: '';
    width: 0.375rem;
    height: 0.375rem;
    background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
    border-radius: 50%;
    flex-shrink: 0;
  }
`;

const StatsSection = styled.div`
  margin-top: 5rem;
  padding: 3rem 0;
  border-top: 1px solid ${props => props.isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)'};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const StatItem = styled.div`
  text-align: center;
  padding: 1.5rem;
  background: ${props => props.isDark
    ? 'rgba(31, 41, 55, 0.5)'
    : 'rgba(255, 255, 255, 0.7)'};
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  border: 1px solid ${props => props.isDark
    ? 'rgba(75, 85, 99, 0.2)'
    : 'rgba(255, 255, 255, 0.3)'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.isDark
      ? '0 15px 35px rgba(0, 0, 0, 0.2)'
      : '0 15px 35px rgba(0, 0, 0, 0.1)'};
  }
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: ${props => props.isDark ? '#ffffff' : '#111827'};
  margin-bottom: 0.5rem;
  
  @media (min-width: 640px) {
    font-size: 2.5rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: ${props => props.isDark ? '#9ca3af' : '#6b7280'};
  font-weight: 500;
`;

// Features Section Component
const FeaturesSection = ({ isDark }) => {
  const features = [
    {
      icon: <Zap />,
      title: "Real-Time Updates",
      description: "Get instant weather updates with our advanced monitoring systems.",
      variant: "primary",
      items: [
        "Live weather data",
        "Minute-by-minute updates",
        "Push notifications",
        "Alert system"
      ]
    },
    {
      icon: <BarChart3 />,
      title: "Advanced Analytics",
      description: "Comprehensive weather analysis with detailed charts and forecasts.",
      variant: "secondary",
      items: [
        "7-day forecasts",
        "Historical data",
        "Trend analysis",
        "Weather patterns"
      ]
    },
    {
      icon: <MapPin />,
      title: "Location-Based",
      description: "Accurate weather information for your exact location worldwide.",
      variant: "accent",
      items: [
        "GPS integration",
        "Multiple locations",
        "Local forecasts",
        "Regional alerts"
      ]
    },
    {
      icon: <Shield />,
      title: "Severe Weather Alerts",
      description: "Stay protected with timely warnings for dangerous weather conditions.",
      variant: "purple",
      items: [
        "Storm warnings",
        "Emergency alerts",
        "Safety tips",
        "Evacuation notices"
      ]
    },
    {
      icon: <Smartphone />,
      title: "Mobile Ready",
      description: "Access weather information anywhere with our responsive mobile app.",
      variant: "pink",
      items: [
        "Cross-platform",
        "Offline access",
        "Widget support",
        "Dark mode"
      ]
    },
    {
      icon: <Globe />,
      title: "Global Coverage",
      description: "Weather data from thousands of stations across the Philippines and beyond.",
      variant: "indigo",
      items: [
        "National coverage",
        "International data",
        "Satellite imagery",
        "Radar maps"
      ]
    }
  ];

  const stats = [
    { number: "99.9%", label: "Accuracy Rate" },
    { number: "24/7", label: "Monitoring" },
    { number: "50M+", label: "Active Users" },
    { number: "1000+", label: "Weather Stations" }
  ];

  return (
    <FeaturesContainer isDark={isDark}>
      <BackgroundPattern isDark={isDark} />
      
      <FloatingElements>
        <FloatingIcon className="icon-1" isDark={isDark}>
          <Cloud />
        </FloatingIcon>
        <FloatingIcon className="icon-2" isDark={isDark}>
          <Thermometer />
        </FloatingIcon>
        <FloatingIcon className="icon-3" isDark={isDark}>
          <Wind />
        </FloatingIcon>
        <FloatingIcon className="icon-4" isDark={isDark}>
          <Eye />
        </FloatingIcon>
      </FloatingElements>

      <Container>
        <SectionHeader>
          <Badge isDark={isDark}>
            <Zap size={16} />
            Advanced Features
          </Badge>
          
          <SectionTitle isDark={isDark}>
            Comprehensive <GradientText>Weather Services</GradientText>
          </SectionTitle>
          
          <SectionSubtitle isDark={isDark}>
            Experience the most advanced weather forecasting technology with real-time data, 
            accurate predictions, and comprehensive coverage across the Philippines.
          </SectionSubtitle>
        </SectionHeader>

        <FeaturesGrid>
          {features.map((feature, index) => (
            <FeatureCard key={index} isDark={isDark}>
              <FeatureIcon variant={feature.variant}>
                {feature.icon}
              </FeatureIcon>
              
              <FeatureTitle isDark={isDark}>
                {feature.title}
              </FeatureTitle>
              
              <FeatureDescription isDark={isDark}>
                {feature.description}
              </FeatureDescription>
              
              <FeatureList>
                {feature.items.map((item, itemIndex) => (
                  <FeatureListItem key={itemIndex} isDark={isDark}>
                    {item}
                  </FeatureListItem>
                ))}
              </FeatureList>
            </FeatureCard>
          ))}
        </FeaturesGrid>

        <StatsSection isDark={isDark}>
          <StatsGrid>
            {stats.map((stat, index) => (
              <StatItem key={index} isDark={isDark}>
                <StatNumber isDark={isDark}>{stat.number}</StatNumber>
                <StatLabel isDark={isDark}>{stat.label}</StatLabel>
              </StatItem>
            ))}
          </StatsGrid>
        </StatsSection>
      </Container>
    </FeaturesContainer>
  );
};

export default FeaturesSection;