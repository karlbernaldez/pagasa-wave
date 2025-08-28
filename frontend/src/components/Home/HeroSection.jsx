import React from 'react';
import styled from 'styled-components';
import { ArrowRight, Play, Cloud, Thermometer, Wind } from 'lucide-react';

// Hero Section Styled Components
const HeroContainer = styled.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: ${props => props.isDarkMode
    ? 'linear-gradient(135deg, #111827 0%, #1e3a8a 20%, #111827 100%)'
    : 'linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #e0f2fe 100%)'};
  padding-top: 4rem; /* Account for fixed header */
`;

const BackgroundElements = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
`;

const FloatingElement = styled.div`
  position: absolute;
  border-radius: 50%;
  opacity: 0.6;
  
  &.dot-1 {
    top: 5rem;
    left: 2.5rem;
    width: 0.5rem;
    height: 0.5rem;
    background: ${props => props.isDarkMode ? '#60a5fa' : '#0ea5e9'};
    animation: pulse 2s infinite;
  }
  
  &.dot-2 {
    top: 10rem;
    right: 5rem;
    width: 0.75rem;
    height: 0.75rem;
    background: ${props => props.isDarkMode ? '#93c5fd' : '#2563eb'};
    animation: bounce 3s infinite;
  }
  
  &.dot-3 {
    bottom: 10rem;
    left: 5rem;
    width: 1rem;
    height: 1rem;
    background: ${props => props.isDarkMode ? '#3b82f6' : '#0ea5e9'};
    animation: ping 4s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.1); }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes ping {
    0% { transform: scale(1); opacity: 0.6; }
    75%, 100% { transform: scale(2); opacity: 0; }
  }
`;

const GradientOrb = styled.div`
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  animation: float 6s ease-in-out infinite;
  
  &.orb-1 {
    top: -10rem;
    right: -10rem;
    width: 20rem;
    height: 20rem;
    background: ${props => props.isDarkMode 
      ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(37, 99, 235, 0.15))'
      : 'linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(37, 99, 235, 0.08))'};
    animation-delay: 0s;
  }
  
  &.orb-2 {
    bottom: -10rem;
    left: -10rem;
    width: 24rem;
    height: 24rem;
    background: ${props => props.isDarkMode 
      ? 'linear-gradient(45deg, rgba(59, 130, 246, 0.15), rgba(14, 165, 233, 0.15))'
      : 'linear-gradient(45deg, rgba(59, 130, 246, 0.08), rgba(14, 165, 233, 0.08))'};
    animation-delay: 2s;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 10;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  align-items: center;
  
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
  }
`;

const TextContent = styled.div`
  text-align: center;
  
  @media (min-width: 1024px) {
    text-align: left;
  }
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.isDarkMode
    ? 'rgba(14, 165, 233, 0.1)'
    : 'rgba(14, 165, 233, 0.08)'};
  border: 1px solid ${props => props.isDarkMode
    ? 'rgba(14, 165, 233, 0.2)'
    : 'rgba(14, 165, 233, 0.3)'};
  border-radius: 2rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.isDarkMode ? '#60a5fa' : '#0ea5e9'};
  margin-bottom: 2rem;
`;

const StatusDot = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
`;

const MainHeadline = styled.div`
  margin-bottom: 2rem;
`;

const HeadlineText = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
  color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
  margin-bottom: 1rem;
  
  @media (min-width: 640px) {
    font-size: 3rem;
  }
  
  @media (min-width: 1024px) {
    font-size: 3.75rem;
  }
`;

const GradientText = styled.span`
  display: block;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  line-height: 1.7;
  color: ${props => props.isDarkMode ? '#d1d5db' : '#4b5563'};
  max-width: 32rem;
  margin: 0 auto;
  
  @media (min-width: 1024px) {
    margin: 0;
  }
  
  @media (min-width: 640px) {
    font-size: 1.25rem;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 2rem 0;
  
  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: center;
  }
  
  @media (min-width: 1024px) {
    justify-content: flex-start;
  }
`;

const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  border: none;
  border-radius: 0.75rem;
  padding: 1rem 2rem;
  color: white;
  font-weight: 600;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
  
  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.6);
    background: linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%);
  }
  
  svg {
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: translateX(4px);
  }
`;

const SecondaryButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: transparent;
  border: 2px solid ${props => props.isDarkMode ? '#4b5563' : '#d1d5db'};
  border-radius: 0.75rem;
  padding: 1rem 2rem;
  color: ${props => props.isDarkMode ? '#d1d5db' : '#374151'};
  font-weight: 600;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
    border-color: ${props => props.isDarkMode ? '#6b7280' : '#9ca3af'};
    background: ${props => props.isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(249, 250, 251, 0.8)'};
  }
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  padding-top: 2rem;
  border-top: 1px solid ${props => props.isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)'};
  margin-top: 2rem;
`;

const StatItem = styled.div`
  text-align: center;
  
  @media (min-width: 1024px) {
    text-align: left;
  }
`;

const StatNumber = styled.div`
  font-size: 1.875rem;
  font-weight: 800;
  color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
  
  @media (min-width: 640px) {
    font-size: 2.25rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: ${props => props.isDarkMode ? '#9ca3af' : '#6b7280'};
  margin-top: 0.25rem;
`;

const WeatherCardContainer = styled.div`
  display: flex;
  justify-content: center;
  
  @media (min-width: 1024px) {
    justify-content: flex-end;
  }
`;

const WeatherCard = styled.div`
  position: relative;
  width: 100%;
  max-width: 24rem;
  padding: 2rem;
  background: ${props => props.isDarkMode
    ? 'rgba(31, 41, 55, 0.8)'
    : 'rgba(255, 255, 255, 0.9)'};
  backdrop-filter: blur(20px);
  border: 1px solid ${props => props.isDarkMode
    ? 'rgba(75, 85, 99, 0.3)'
    : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 1.5rem;
  box-shadow: ${props => props.isDarkMode
    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    : '0 25px 50px -12px rgba(0, 0, 0, 0.1)'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.02) translateY(-4px);
    box-shadow: ${props => props.isDarkMode
      ? '0 35px 60px -12px rgba(0, 0, 0, 0.6)'
      : '0 35px 60px -12px rgba(0, 0, 0, 0.15)'};
  }
`;

const WeatherHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const LocationText = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${props => props.isDarkMode ? '#d1d5db' : '#4b5563'};
  margin-bottom: 0.25rem;
`;

const DateText = styled.p`
  font-size: 0.875rem;
  color: ${props => props.isDarkMode ? '#9ca3af' : '#6b7280'};
`;

const TemperatureSection = styled.div`
  position: relative;
  text-align: center;
  margin: 2rem 0;
`;

const Temperature = styled.div`
  font-size: 4rem;
  font-weight: 800;
  color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
  line-height: 1;
`;

const WeatherIcon = styled.div`
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  
  svg {
    width: 3rem;
    height: 3rem;
    color: #0ea5e9;
    animation: bounce 3s infinite;
  }
`;

const WeatherCondition = styled.div`
  font-size: 1.125rem;
  color: ${props => props.isDarkMode ? '#d1d5db' : '#4b5563'};
  margin-top: 1rem;
`;

const WeatherDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${props => props.isDarkMode ? '#374151' : '#e5e7eb'};
`;

const WeatherDetailItem = styled.div`
  text-align: center;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    margin: 0 auto 0.5rem;
    color: ${props => {
      if (props.type === 'temperature') return props.isDarkMode ? '#ef4444' : '#dc2626';
      if (props.type === 'wind') return props.isDarkMode ? '#3b82f6' : '#2563eb';
      return props.isDarkMode ? '#6b7280' : '#4b5563';
    }};
  }
`;

const DetailLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.isDarkMode ? '#ffffff' : '#111827'};
  margin-bottom: 0.125rem;
`;

const DetailValue = styled.div`
  font-size: 0.75rem;
  color: ${props => props.isDarkMode ? '#9ca3af' : '#6b7280'};
`;

const DecorativeDot = styled.div`
  position: absolute;
  width: 1rem;
  height: 1rem;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  border-radius: 50%;
  opacity: 0.6;
  animation: pulse 3s infinite;
  
  &.top-left {
    top: -0.5rem;
    left: -0.5rem;
  }
  
  &.bottom-right {
    bottom: -0.5rem;
    right: -0.5rem;
    width: 0.75rem;
    height: 0.75rem;
  }
`;

// Hero Section Component
const HeroSection = ({ isDarkMode }) => {
  return (
    <HeroContainer isDarkMode={isDarkMode}>
      <BackgroundElements>
        <FloatingElement className="dot-1" isDarkMode={isDarkMode} />
        <FloatingElement className="dot-2" isDarkMode={isDarkMode} />
        <FloatingElement className="dot-3" isDarkMode={isDarkMode} />
        <GradientOrb className="orb-1" isDarkMode={isDarkMode} />
        <GradientOrb className="orb-2" isDarkMode={isDarkMode} />
      </BackgroundElements>

      <HeroContent>
        <HeroGrid>
          <TextContent>
            <Badge isDarkMode={isDarkMode}>
              <StatusDot />
              Live Weather Updates
            </Badge>

            <MainHeadline>
              <HeadlineText isDarkMode={isDarkMode}>
                Your Trusted
                <GradientText>Weather Partner</GradientText>
              </HeadlineText>
              <Subtitle isDarkMode={isDarkMode}>
                Get accurate weather forecasts, real-time updates, and meteorological services 
                to help you plan your day with confidence.
              </Subtitle>
            </MainHeadline>

            <CTAButtons>
              <PrimaryButton>
                Check Weather
                <ArrowRight size={20} />
              </PrimaryButton>
              
              <SecondaryButton isDarkMode={isDarkMode}>
                <Play size={20} />
                Watch Demo
              </SecondaryButton>
            </CTAButtons>

            <Stats isDarkMode={isDarkMode}>
              <StatItem>
                <StatNumber isDarkMode={isDarkMode}>99.9%</StatNumber>
                <StatLabel isDarkMode={isDarkMode}>Accuracy</StatLabel>
              </StatItem>
              <StatItem>
                <StatNumber isDarkMode={isDarkMode}>24/7</StatNumber>
                <StatLabel isDarkMode={isDarkMode}>Monitoring</StatLabel>
              </StatItem>
              <StatItem>
                <StatNumber isDarkMode={isDarkMode}>50M+</StatNumber>
                <StatLabel isDarkMode={isDarkMode}>Users</StatLabel>
              </StatItem>
            </Stats>
          </TextContent>

          <WeatherCardContainer>
            <WeatherCard isDarkMode={isDarkMode}>
              <WeatherHeader>
                <LocationText isDarkMode={isDarkMode}>Manila, Philippines</LocationText>
                <DateText isDarkMode={isDarkMode}>
                  Today, {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </DateText>
              </WeatherHeader>

              <TemperatureSection>
                <Temperature isDarkMode={isDarkMode}>32°</Temperature>
                <WeatherIcon>
                  <Cloud />
                </WeatherIcon>
              </TemperatureSection>

              <WeatherCondition isDarkMode={isDarkMode}>
                Partly Cloudy
              </WeatherCondition>

              <WeatherDetails isDarkMode={isDarkMode}>
                <WeatherDetailItem type="temperature" isDarkMode={isDarkMode}>
                  <Thermometer />
                  <DetailLabel isDarkMode={isDarkMode}>Feels like</DetailLabel>
                  <DetailValue isDarkMode={isDarkMode}>35°</DetailValue>
                </WeatherDetailItem>
                <WeatherDetailItem type="wind" isDarkMode={isDarkMode}>
                  <Wind />
                  <DetailLabel isDarkMode={isDarkMode}>Wind</DetailLabel>
                  <DetailValue isDarkMode={isDarkMode}>15 km/h</DetailValue>
                </WeatherDetailItem>
                <WeatherDetailItem type="humidity" isDarkMode={isDarkMode}>
                  <Cloud />
                  <DetailLabel isDarkMode={isDarkMode}>Humidity</DetailLabel>
                  <DetailValue isDarkMode={isDarkMode}>68%</DetailValue>
                </WeatherDetailItem>
              </WeatherDetails>

              <DecorativeDot className="top-left" />
              <DecorativeDot className="bottom-right" />
            </WeatherCard>
          </WeatherCardContainer>
        </HeroGrid>
      </HeroContent>
    </HeroContainer>
  );
};

export default HeroSection;