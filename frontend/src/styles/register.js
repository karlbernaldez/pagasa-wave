//register page styles
import styled, { keyframes } from 'styled-components';

// Keyframe animations
export const float = keyframes`
  0%, 100% { 
    transform: translateY(0px) rotate(0deg); 
  }
  33% { 
    transform: translateY(-10px) rotate(120deg); 
  }
  66% { 
    transform: translateY(5px) rotate(240deg); 
  }
`;

export const bounce = keyframes`
  0%, 100% { 
    transform: translateY(0px); 
  }
  50% { 
    transform: translateY(-20px); 
  }
`;

export const pulse = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
`;

export const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const slideInRight = keyframes`
  from { 
    transform: translateX(20px); 
    opacity: 0; 
  }
  to { 
    transform: translateX(0); 
    opacity: 1; 
  }
`;

export const slideInLeft = keyframes`
  from { 
    transform: translateX(-20px); 
    opacity: 0; 
  }
  to { 
    transform: translateX(0); 
    opacity: 1; 
  }
`;

// Styled components
export const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0891b2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  box-sizing: border-box;
`;

export const WeatherElement = styled.div`
  position: absolute;
  color: rgba(255, 255, 255, 0.2);
  pointer-events: none;
  
  &.cloud-1 {
    top: 2.5rem;
    left: 2.5rem;
    animation: ${bounce} 3s ease-in-out infinite;
  }
  
  &.cloud-2 {
    top: 5rem;
    right: 5rem;
    opacity: 0.15;
    animation: ${bounce} 4s ease-in-out infinite;
    animation-delay: 1s;
  }
  
  &.cloud-rain {
    bottom: 5rem;
    left: 25%;
    opacity: 0.1;
    animation: ${bounce} 5s ease-in-out infinite;
    animation-delay: 2s;
  }
  
  &.sun {
    top: 4rem;
    right: 25%;
    color: rgba(253, 224, 71, 0.3);
    animation: ${spin} 20s linear infinite;
  }
  
  &.lightning-1 {
    bottom: 33%;
    right: 2.5rem;
    color: rgba(254, 240, 138, 0.2);
    animation: ${pulse} 2s ease-in-out infinite;
  }
  
  &.lightning-2 {
    top: 33%;
    left: 4rem;
    color: rgba(254, 240, 138, 0.15);
    animation: ${pulse} 2.5s ease-in-out infinite;
    animation-delay: 1s;
  }
  
  &.wind {
    bottom: 2.5rem;
    right: 33%;
    animation: ${pulse} 3s ease-in-out infinite;
  }
`;

export const FloatingParticle = styled.div`
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: ${bounce} ${props => 3 + Math.random() * 2}s ease-in-out infinite;
  animation-delay: ${props => Math.random() * 3}s;
  left: ${props => Math.random() * 100}%;
  top: ${props => Math.random() * 100}%;
`;

export const GradientOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(30, 58, 138, 0.2) 0%, transparent 50%, rgba(6, 182, 212, 0.1) 100%);
  pointer-events: none;
`;

export const FormWrapper = styled.div`
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 28rem;
`;

export const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

export const LogoContainer = styled.div`
  width: 5rem;
  height: 5rem;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #ffffffff, #8eb6f7ff);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
`;

export const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: transparent;
  background: linear-gradient(135deg, #67e8f9, #93c5fd);
  background-clip: text;
  -webkit-background-clip: text;
  margin-bottom: 0.5rem;
`;

export const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  max-width: 20rem;
  margin: 0 auto;
  line-height: 1.5;
`;

export const ProgressContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
`;

export const ProgressWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const ProgressStep = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  transition: all 0.3s ease;
  background: ${props => props.active
    ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
    : 'rgba(255, 255, 255, 0.2)'};
  color: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.6)'};
`;

export const ProgressLine = styled.div`
  width: 3rem;
  height: 4px;
  border-radius: 2px;
  transition: all 0.3s ease;
  background: ${props => props.active
    ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
    : 'rgba(255, 255, 255, 0.2)'};
`;

export const FormContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;

export const FormContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${props => props.direction === 'right' ? slideInRight : slideInLeft} 0.3s ease-out;
`;

export const StepTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin-bottom: 1rem;
`;

export const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const InputGroup = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
`;

export const InputWrapper = styled.div`
  position: relative;
  width: 100%;
  box-sizing: border-box;
`;

export const IconWrapper = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.3s ease;

  ${InputWrapper}:focus-within & {
    color: rgba(255, 255, 255, 0.8);
  }
`;

export const StyledInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 1rem 1rem 1rem 3rem;
  padding-right: ${props => props.hasRightIcon ? '3rem' : '1rem'};
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid ${props =>
    props.hasError ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 1rem;
  color: white;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  min-width: 0;
  max-width: 100%;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  /* Date input specific styles */
  &[type="date"] {
    &::-webkit-calendar-picker-indicator {
      filter: invert(1);
      opacity: 0.6;
      cursor: pointer;
    }
    
    &::-webkit-datetime-edit {
      color: white;
    }
    
    &::-webkit-datetime-edit-fields-wrapper {
      padding: 0;
    }
    
    &::-webkit-datetime-edit-text {
      color: rgba(255, 255, 255, 0.6);
      padding: 0 0.2em;
    }
    
    &::-webkit-datetime-edit-month-field,
    &::-webkit-datetime-edit-day-field,
    &::-webkit-datetime-edit-year-field {
      padding: 0;
      color: white;
    }
  }
`;

export const RightIconWrapper = styled.div`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.success ? '#4ade80' : props.error ? '#ef4444' : 'rgba(255, 255, 255, 0.6)'};
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  transition: color 0.3s ease;

  &:hover {
    color: ${props => props.clickable ? 'rgba(255, 255, 255, 0.8)' : undefined};
  }
`;

export const ErrorMessage = styled.p`
  color: #fca5a5;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
`;

export const Button = styled.button`
  flex: ${props => props.flex || '1'};
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;

  ${props => props.primary ? `
    background: linear-gradient(135deg, #06b6d4, #3b82f6);
    color: white;
    box-shadow: 0 10px 25px rgba(6, 182, 212, 0.3);

    &:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 15px 35px rgba(6, 182, 212, 0.4);
      background: linear-gradient(135deg, #0891b2, #2563eb);
    }

    &:focus {
      box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.5);
    }

    &:active {
      transform: translateY(0) scale(1);
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
  `}
`;

export const FooterText = styled.div`
  text-align: center;
  margin-top: 2rem;
`;

export const FooterLink = styled.button`
  background: none;
  border: none;
  color: #67e8f9;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #93c5fd;
  }
`;
