import React from "react";
import styled from "styled-components";
import comboChart from "../../assets/combo_chart.png";

// Function to get today's date in MMDDYYYY format
const getTodayDate = () => {
  const today = new Date();
  const month = today.getMonth() + 1; // Month is zero-indexed, so add 1
  const day = today.getDate();
  const year = today.getFullYear();

  // Pad the month and day to ensure two digits
  const formattedMonth = month < 10 ? `0${month}` : month;
  const formattedDay = day < 10 ? `0${day}` : day;

  return `${formattedMonth}${formattedDay}${year}`;
};

const getForecastDate = () => {
  const today = new Date();

  // Get today's date (current day)
  const currentDay = today.getDate();
  const currentMonth = today.toLocaleString("default", { month: "short" });
  const currentYear = today.getFullYear();

  // Increment the date by 1 to get tomorrow's date
  today.setDate(today.getDate() + 1);

  // Get tomorrow's date (after increment)
  const tomorrowDay = today.getDate();
  const tomorrowMonth = today.toLocaleString("default", { month: "short" });
  const tomorrowYear = today.getFullYear();

  // Return both today's and tomorrow's date as arrays
  return [
    [currentDay < 10 ? `0${currentDay}` : currentDay, currentMonth, currentYear], // Today's date
    [tomorrowDay < 10 ? `0${tomorrowDay}` : tomorrowDay, tomorrowMonth, tomorrowYear], // Tomorrow's date
  ];
};

const [today, tomorrow] = getForecastDate();
const [todayDay, todayMonth, todayYear] = today;
const [tomorrowDay, tomorrowMonth, tomorrowYear] = tomorrow;

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100%;
  width: 100%;
  padding: 1rem 0;
`;

const ChartContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  width: 100%;
  max-width: 1099px;

  @media (max-width: 768px) {
    margin-top: -40px;
  }
`;

const ChartBlockWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  position: relative;
  width: 45%;

  left: ${(props) => props.left || 0}px;
  top: ${(props) => props.top || 0}px;

  @media (max-width: 768px) {
    width: 100%;
    margin-bottom: 20px;
  }
`;

const ChartTitle = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 2px;
  position: relative;
  margin-top: 20px;
`;

const ComboChart = styled.img`
  height: 26px;
  position: relative;
  width: 26px;
  top: -6px;
`;

const TextWrapper = styled.div`
  color: #008ec1;
  font-family: "Roboto-Regular", Helvetica;
  font-size: 16px;
  font-weight: 400;
  height: 26px;
  width: 250px;
`;

const ChartImage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 17px;
  background-color: #d9d9d9;
  width: 100%;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

// Container that forces the image into a square
const ImageContainer = styled.div`
  width: 100%;
  padding-top: 100%; /* 1:1 aspect ratio (square) */
  position: relative;
  background-color: #d9d9d9;
  overflow: hidden; /* Prevents the image from overflowing */
`;

// Styled component for text overlay
const TextOverlay = styled.div`
  position: absolute;
  top: 2%;
  left: 2%;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: 10px;
  font-weight: 400;
  white-space: pre-line; /* Allows text to break into multiple lines */
  line-height: 1.5;
  max-width: 90%; /* Limit width to prevent overflow */
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7); /* Adds a subtle shadow to the text for better readability */
  padding: 5px; /* Optional: adds some space around the text */
  text-align: justify; /* Justify text alignment */
  background-color: ${({ theme }) => theme.colors.textBackground};
  border-radius: 8px;
`;

const Image = styled.img`
  position: absolute;
  top: ${(props) => props.top || '50%'}; /* Move image vertically */
  left: ${(props) => props.left || '50%'}; /* Move image horizontally */
  transform: translate(-50%, -50%); /* Centers the image */
  width: 100%;
  height: 100%;
  object-fit: cover; /* Zooms and crops to fill the square */
  object-position: ${(props) => `${props.left || '40%'} ${props.top || '70%'}`}; /* Allows dynamic position */
`;

const ChartBlock = ({ title, selected }) => {
  const generateImageSrc = (title) => {
    const dateFormatted = getTodayDate(); // Get today's date

    // Define different base URLs for each type
    const baseURLWave = "https://storage.googleapis.com/votewave/wave_charts/";
    const baseURLWaveWind = "https://storage.googleapis.com/votewave/wave_wind_charts/";

    // Logic to determine which baseURL to use and construct the image path
    if (title === "Wave Analysis" && selected.wave) {
      return `${baseURLWave}WA_${dateFormatted}.png`; // For "Wave Analysis"
    } else if (title === "24-h Prognostic Wave Chart" && selected.wave) {
      return `${baseURLWave}24PWC_${dateFormatted}.png`; // For "24-h Prognostic Wave Chart"
    } else if (title === "36-h Prognostic Wave Chart" && selected.wave) {
      return `${baseURLWave}36PWC_${dateFormatted}.png`; // For "36-h Prognostic Wave Chart"
    } else if (title === "48-h Prognostic Wave Chart" && selected.wave) {
      return `${baseURLWave}48PWC_${dateFormatted}.png`; // For "48-h Prognostic Wave Chart"
    }

    // Logic for "Wave & Wind" (selected.waveWind)
    if (selected.waveWind) {
      if (title === "Wave Analysis") {
        return `${baseURLWaveWind}WA_${dateFormatted}.png`; // For "Wave & Wind Analysis"
      } else if (title === "24-h Prognostic Wave Chart") {
        return `${baseURLWaveWind}24PWC_${dateFormatted}.png`; // For "24-h Prognostic Wave Chart (Wave & Wind)"
      } else if (title === "36-h Prognostic Wave Chart") {
        return `${baseURLWaveWind}36PWC_${dateFormatted}.png`; // For "36-h Prognostic Wave Chart (Wave & Wind)"
      } else if (title === "48-h Prognostic Wave Chart") {
        return `${baseURLWaveWind}48PWC_${dateFormatted}.png`; // For "48-h Prognostic Wave Chart (Wave & Wind)"
      }
    }

    // Logic for "Color Impaired" (selected.colorImpaired)
    if (selected.colorImpaired) {
      if (title === "Wave Analysis") {
        return `${baseURLWaveWind}WA_${dateFormatted}.png`; // For "Color Impaired Wave Analysis"
      } else if (title === "24-h Prognostic Wave Chart") {
        return `${baseURLWaveWind}24PWC_${dateFormatted}.png`; // For "24-h Prognostic Wave Chart (Color Impaired)"
      } else if (title === "36-h Prognostic Wave Chart") {
        return `${baseURLWaveWind}36PWC_${dateFormatted}.png`; // For "36-h Prognostic Wave Chart (Color Impaired)"
      } else if (title === "48-h Prognostic Wave Chart") {
        return `${baseURLWaveWind}48PWC_${dateFormatted}.png`; // For "48-h Prognostic Wave Chart (Color Impaired)"
      }
    }

    return ""; // Default empty if no match found
  };

  const imageSrc = generateImageSrc(title); // Dynamically generate image URL based on title

  // Apply sepia filter for "Color Impaired" charts (color-blindness simulation)
  const imageFilter = selected.colorImpaired
    ? "sepia(200%) saturate(200%) contrast(110%) brightness(140%)" // Apply warm, yellowish tint
    : "none"; // No filter applied for non-color-impaired charts

  // Define the overlay text for each chart
  let overlayText = "";
  if (title === "Wave Analysis") {
    overlayText = `AWAS RCTP BMF\n020000 UTC Jul 2025\nWAVE ANALYSIS`;
  } else if (title === "24-h Prognostic Wave Chart") {
    const forecastTime24 = getForecastDate(24); // 24 hours forecast
    overlayText = `FWAS RCTP BMF\n020000UTC ${todayMonth} ${todayYear}\nFCST FOR ${todayDay}0000UTC\n24H WAVE PROG`;
  } else if (title === "36-h Prognostic Wave Chart") {
    const forecastTime36 = getForecastDate(36); // 36 hours forecast
    overlayText = `FWAS RCTP BMF\n020000UTC ${todayMonth} ${todayYear}\nFCST FOR ${todayDay}1200UTC\n36H WAVE PROG`;
  } else if (title === "48-h Prognostic Wave Chart") {
    const forecastTime48 = getForecastDate(48); // 48 hours forecast
    overlayText = `FWAS RCTP BMF\n020000UTC ${tomorrowMonth} ${tomorrowYear}\nFCST FOR ${tomorrowDay}0000UTC\n48H WAVE PROG`;
  }

  return (
    <ChartBlockWrapper>
      <ChartTitle>
        <ComboChart alt="Combo chart" src={comboChart} />
        <TextWrapper>{title}</TextWrapper>
      </ChartTitle>
      <ChartImage>
        {/* Only show image if it's a valid URL */}
        {imageSrc && (
          <ImageContainer>
            <Image alt="Chart" src={imageSrc} style={{ filter: imageFilter }} />
            {/* Display text overlay */}
            <TextOverlay>{overlayText}</TextOverlay>
          </ImageContainer>
        )}
      </ChartImage>
    </ChartBlockWrapper>
  );
};

export const Charts = ({ selected }) => {
  return (
    <Wrapper>
      <ChartContainer>
        <ChartBlock title="Wave Analysis" selected={selected} />
        <ChartBlock title="24-h Prognostic Wave Chart" selected={selected} />
        <ChartBlock title="36-h Prognostic Wave Chart" selected={selected} />
        <ChartBlock title="48-h Prognostic Wave Chart" selected={selected} />
      </ChartContainer>
    </Wrapper>
  );
};
