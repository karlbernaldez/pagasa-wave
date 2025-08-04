import styled from "styled-components";

// CONTAINER
export const MarineContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 0 1rem;
  box-sizing: border-box;
`;

// TITLE SECTION
export const TitleWrapper = styled.div`
  background-image: linear-gradient(to right, ${({ theme }) => theme.mainColors.blue}, rgb(46, 116, 223));
  height: 52px;
  width: 100%;
  max-width: 1200px;
  margin-top: ${({ theme }) => theme.spacing.medium};
  display: flex;
  align-items: center;
  padding: 0 1rem;
  box-sizing: border-box;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.2);
  
  @media (max-width: 768px) {
    border-radius: ${({ theme }) => theme.borderRadius.medium};
  }
`;

export const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const Img = styled.img`
  height: 25px;
  width: 25px;
`;

export const TextWrapper = styled.div`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.medium};
  font-size: ${({ theme }) => theme.fontSizes.xxlarge};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  white-space: nowrap;
`;

// OPTIONS BAR
export const ChartStyles = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
  gap: ${({ theme }) => theme.spacing.small};
  margin-top: 1.5rem;
  @media (max-width: 768px) {
    justify-content: center;
    gap: ${({ theme }) => theme.spacing.xsmall};
    padding: 0 0.5rem;
  }
`;

export const Line = styled.img`
  width: 100%;
  max-width: 1200px;
  height: 1px;
  margin-top: ${({ theme }) => theme.spacing.small};
`;

export const ChartWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 2rem 1rem 0 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  > * {
    width: 100%;
    max-width: 100%;
  }
  @media (max-width: 768px) {
    padding-top: 2rem;
    margin-right: 1rem;
  }
`;

export const Legend = styled.div`
  background-color: ${({ theme }) => theme.mainColors.blue};
  margin-top: 2rem;
  width: 100%;
  max-width: 1200px;
  min-height: 200px;
  padding: 1rem;
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.light};
  font-size: ${({ theme }) => theme.fontSizes.xxlarge};
  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.xlarge};
    padding: 0.75rem;
  }
`;
