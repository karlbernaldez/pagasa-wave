import React from 'react';
import styled from 'styled-components';
import LightModeImage from '../../assets/meteorologist.png';  // Image for light mode
import DarkModeImage from '../../assets/meteorologist_dark.png';    // Image for dark mode

const HeroSectionContainer = styled.div`
  width: 100%;
  height: 58rem;
  position: relative;
  overflow: hidden;

  @media (max-width: 480px) {
    width: clamp(80%, 90vw, 90%);
    height: clamp(10rem, 25vh, 12rem) !important;
    margin: clamp(1rem, 4vw, 1.5rem) auto 0;
    border-radius: ${({ theme }) => theme.borderRadius.xlarge};
    overflow: hidden;
  }

`;

const BackgroundWrapper = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
`;

const BackgroundImage = styled.div`
  background-image: url(${({ theme }) => theme.backgroundImage});
  background-size: 115%;  /* Zoom effect */
  background-position: left center;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  filter: ${({ theme }) => theme.name === 'dark' ? 'brightness(0.6)' : 'brightness(1)'};

  @media (max-width: 768px) {
    background-size: cover;
    background-position: center;
  }

  @media (max-width: 480px) {
    background-size: cover;
  }
`;

const Gradient = styled.div`
  background: ${({ theme }) => theme.gradients.background};
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;

  @media (max-width: 768px) {
    background: ${({ theme }) => theme.gradients.backgroundMobile};
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
  position: absolute;
  top: clamp(150px, 28vh, 300px); /* dynamic vertical position */
  left: clamp(10px, 3vw, 20px);
  right: clamp(10px, 3vw, 20px);
  width: auto;
  text-align: left;

  @media (max-width: 480px) {
    top: clamp(100px, 25vh, 150px);
    left: clamp(5px, 4vw, 10px);
    right: clamp(5px, 4vw, 10px);
  }
`;

const Heading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.625rem;
  width: clamp(300px, 50vw, 750px);
  margin-left: 6rem;
  max-width: 45rem;

  @media (max-width: 768px) {
    margin: 0 auto;
    width: 90%;
    align-items: center;
    text-align: center;
  }

  @media (max-width: 480px) {
    margin-top: -8rem;
    margin-left: 1rem;
    margin-right: auto;
    width: 13rem;
    align-items: center;
    text-align: center;
  }
`;

const Title = styled.p`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.bold};
  font-size: clamp(3.5rem, 4vw, ${({ theme }) => theme.fontSizes.heading});
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-top: 0;
  line-height: 1.2;
  position: relative;
  text-align: left;

  
  @media (max-width: 1024px) {
    font-size: clamp(2.5rem, 6vw, 3rem);
  }

  @media (max-width: 768px) {
    text-align: center;
    line-height: 1.5;
    font-size: clamp(2.5rem, 6vw, 3rem);
  }

  @media (max-width: 480px) {
    font-size: clamp(1.1rem, 4vw, 2rem);
    text-align: left;
  }
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: clamp(0.9rem, 2.5vw, 1.25rem); /* Clamped font-size */
  font-weight: 400;
  line-height: 1.4;
  margin: clamp(-2rem, -4vw, -3rem) 0 clamp(1rem, 2vw, 1.5rem) 0; /* Clamped margin */
  width: 95%;
  text-align: left;

  @media (max-width: 1024px) {
    font-size: clamp(.7rem, 1.6vw, 2rem);
  }


  @media (max-width: 768px) {
    font-size: clamp(1rem, 3vw, 1.2rem); /* Clamped font-size for tablet */
    text-align: center;
    margin: clamp(-1.5rem, -3vw, -2rem) 0 clamp(0.5rem, 1vw, 1rem) 0; /* Clamped margin for tablet */
  }

  @media (max-width: 480px) {
    font-size: clamp(0.7rem, 1vw, 1rem); /* Clamped font-size for mobile */
    text-align: left;
    width: 85%;
    margin-left: clamp(-2rem, -3vw, -2.2rem); /* Clamped margin for mobile */
    margin-top: clamp(-1.5rem, -3vw, -1rem); /* Clamped margin-top */
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: clamp(0.5rem, 2vw, 1.25rem); /* Clamped gap */
  position: relative;
  width: auto;

  @media (max-width: 768px) {
    gap: clamp(0.4rem, 1.5vw, 1rem); /* Clamped gap for tablets */
  }

  @media (max-width: 480px) {
    flex-direction: column;
    margin-top: clamp(-.8rem, -1vw, -1.2rem); /* Clamped margin-top for mobile */
    margin-left: clamp(-8rem, -15vw, -7.8rem); /* Clamped margin-left for mobile */
  }
`;

const Button = styled.button`
  background-color: ${({ $primary, theme }) => ($primary ? theme.colors.highlight : 'transparent')};
  color: ${({ $primary, theme }) => ($primary ? theme.colors.white : theme.colors.highlight)};
  font-family: ${({ theme }) => theme.fonts.medium};
  font-size: 1rem;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  border: ${({ $primary, theme }) => ($primary ? 'none' : `2px solid ${theme.colors.highlight}`)};
  cursor: pointer;
  transition: background-color 0.3s ease, border 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;

  &:hover {
    background-color: ${({ $primary }) => ($primary ? '#0088cc' : '#e0f7f7')};
    border-color: #0088cc;
  }

  @media (max-width: 768px) {
    font-size: 1.2rem;
    padding: 1.5rem 2.5rem;
    width: 100%;
    height: 40px;
    margin: 5px 0;
    border-radius: 24px;
  }

  @media (max-width: 480px) {
    font-size: 0.625rem;
    padding: 0.25rem 0.875rem;
    width: fit-content;
    height: 30px;
    margin: 5px 0;
    justify-content: flex-start;
    text-align: left;
  }
`;

const LiveMapButton = styled(Button)`
  @media (max-width: 768px) {
    display: none;
  }
`;

const GlassyCircle = styled.div`
  position: absolute;
  top: 6.5rem;
  left: 90rem;
  transform: translateX(-50%);
  width: 45rem;
  height: 45rem;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  justify-content: center; /* Center the image horizontally */
  align-items: center; /* Center the image vertically */
  overflow  : hidden;

  @media (max-width: 1170px) {
    width: 25rem;
    height: 25rem;
    left: 55rem;
    top: 12rem;
    overflow: hidden;
  }

  @media (max-width: 1024px) {
    width: 20rem;
    height: 20rem;
    left: 52rem;
    top: 12rem;
  }

  @media (max-width: 768px) {
    display: none; /* Hide on smaller screens */
  }

  @media (max-width: 480px) {
    display: flex; /* Ensure it appears */
    width: clamp(8.5rem, 20vw, 16rem);
    height: clamp(8.5rem, 20vw, 16rem);
    top: clamp(4.8rem, 10vh, 6.5rem);
    left: 20rem;
    transform: translate(-50%, -50%); /* Adjust the transform for better positioning */
  }

  @media (max-width: 440px) {
    display: flex; /* Ensure it appears */
    width: clamp(8.5rem, 20vw, 16rem);
    height: clamp(8.5rem, 20vw, 16rem);
    top: clamp(4.8rem, 10vh, 6.5rem);
    left: 18.5rem;
    transform: translate(-50%, -50%); /* Adjust the transform for better positioning */
  }

  @media (max-width: 400px) {
    display: flex; /* Ensure it appears */
    width: clamp(7rem, 20vw, 16rem);
    height: clamp(7rem, 20vw, 16rem);
    top: clamp(5rem, 10vh, 6.5rem);
    left: clamp(17.3rem, 10vw, 32rem);
    transform: translate(-50%, -50%); /* Adjust the transform for better positioning */
  }
`;

const Meteorologist = styled.img`
  width: 100%;
  max-width: 45rem;
  height: auto;
  z-index: 2;
  margin-left: 10px;

  @media (max-width: 1366px) {
    width: 30rem;
    height: 30rem;
  }

  @media (max-width: 1024px) {
    width: 19.8rem;
    height: 19.8rem;
  }

  @media (max-width: 480px) {
    width: 8rem;
    height: 8rem;
  }
  
  @media (max-width: 400px) {
    width: 6.8rem;
    height: 6.8rem;
  }
`;

const HeroSection = ({ isDarkMode }) => {
  // Use dark or light image based on the theme
  const meteorologistImage = isDarkMode ? DarkModeImage : LightModeImage;

  return (
    <HeroSectionContainer>
      <BackgroundWrapper>
        <Gradient />
      </BackgroundWrapper>
      <ContentContainer>
        <Heading>
          <Title>Visualize Weather. Forecast with Precision.</Title>
          <Subtitle>
            Interactive tools for meteorologists, researchers, and enthusiasts.
          </Subtitle>
          <ButtonsContainer>
            <Button $primary>Get Forecast</Button>
            <LiveMapButton>Live Map</LiveMapButton>
          </ButtonsContainer>
        </Heading>
      </ContentContainer>
      <GlassyCircle>
        <Meteorologist src={meteorologistImage} alt="Meteorologist" />
      </GlassyCircle>
    </HeroSectionContainer>
  );
};

export default HeroSection;
