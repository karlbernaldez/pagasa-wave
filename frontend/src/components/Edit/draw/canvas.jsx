import Slider from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import { Stage, Layer, Line } from 'react-konva';
import styled2 from 'styled-components';
import { useRef, useState, useEffect } from 'react';
import { saveFeature } from '../../../api/featureServices';
import { smoothPoints, convertToGeoJSON, downloadGeoJSON, handlePointerDown, handlePointerMove, handlePointerUp } from './canvasUtils';
import ProjectModal from '../../modals/ProjectModal';

const Container = styled2.div`
  position: fixed;
  z-index: 100;
  bottom: 5rem;
  left: 50%;
  margin-left: -10rem;
  transform: translateX(-50%);
  transform-origin: center bottom;
  
  background: ${({ theme }) => theme?.colors?.bgPrimary};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  padding: ${({ theme }) => theme.spacing.medium || "1.25rem"};
  border-radius: ${({ theme }) => theme.borderRadius.xlarge || "16px"};
  border: 1px solid ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fonts.regular || "'Inter', sans-serif"};
  color: ${({ theme }) => theme.colors.textPrimary};
  
  width: 320px;
  max-width: 380px;
  max-height: clamp(300px, 40vh, 500px);
  text-align: center;
  overflow-y: auto;

  /* Hide scrollbar but keep scrolling */
  scrollbar-width: none; /* Firefox */
  ms-overflow-style: none; /* IE/Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }

  box-shadow: ${({ theme }) =>
    theme.isDark
      ? "0 20px 40px -12px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05)"
      : "0 20px 40px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)"};

  transform: scale(1);
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: ${({ theme }) =>
    theme.isDark
      ? "0 32px 64px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)"
      : "0 32px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08)"};
    border-color: ${({ theme }) =>
    theme.isDark ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.2)"};
  }

  &:active {
    transform: translateY(-2px) scale(1.01);
  }

  /* Responsive */
  @media (max-width: 480px) {
    width: calc(100vw - 2rem);
    max-width: calc(100vw - 2rem);
    max-height: clamp(240px, 45vh, 400px);
    bottom: ${({ theme }) => theme.spacing.medium || "1rem"};
    padding: 1rem;
  }
`;

const Label = styled2.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  color: ${({ isDarkMode }) => isDarkMode ? '#f0f0f0' : '#2a2a2a'};
  font-weight: 600;
  font-size: 1.1rem;
  letter-spacing: -0.02em;
  
  /* Add wave icon */
  &::before {
    content: '🌊';
    font-size: 1.3rem;
    filter: ${({ isDarkMode }) => isDarkMode ? 'brightness(1.1)' : 'brightness(0.95)'};
  }
`;

const ValueDisplay = styled2.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.8rem;
  height: 2.5rem;
  background: ${({ isDarkMode }) =>
    isDarkMode
      ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
      : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
  };
  color: white;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 
    0 4px 12px ${({ isDarkMode }) =>
    isDarkMode ? 'rgba(79, 70, 229, 0.4)' : 'rgba(59, 130, 246, 0.3)'
  },
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  
  &::after {
    content: 'ft';
    font-size: 0.7rem;
    margin-left: 0.2rem;
    opacity: 0.85;
    font-weight: 500;
  }
`;

const StyledSlider = styled(Slider)(({ isDarkMode }) => ({
  color: isDarkMode ? '#6366f1' : '#3b82f6',
  height: 8,
  padding: '15px 0',
  marginTop: '0.5rem',

  '& .MuiSlider-track': {
    height: 8,
    borderRadius: 4,
    background: isDarkMode
      ? 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)'
      : 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
    border: 'none',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
  },

  '& .MuiSlider-rail': {
    height: 8,
    borderRadius: 4,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}`,
  },

  '& .MuiSlider-thumb': {
    height: 24,
    width: 24,
    backgroundColor: '#fff',
    border: `3px solid ${isDarkMode ? '#6366f1' : '#3b82f6'}`,
    boxShadow: `0 4px 12px ${isDarkMode ? 'rgba(99, 102, 241, 0.4)' : 'rgba(59, 130, 246, 0.4)'}, 0 2px 4px rgba(0,0,0,0.1)`,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',

    '&::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: isDarkMode ? '#6366f1' : '#3b82f6',
    },

    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0 6px 20px ${isDarkMode ? 'rgba(99, 102, 241, 0.6)' : 'rgba(59, 130, 246, 0.6)'}, 0 2px 8px rgba(0,0,0,0.15)`,
      transform: 'scale(1.1)',
    },

    '&.Mui-active': {
      boxShadow: `0 8px 24px ${isDarkMode ? 'rgba(99, 102, 241, 0.8)' : 'rgba(59, 130, 246, 0.8)'}, 0 0 0 8px ${isDarkMode ? 'rgba(99, 102, 241, 0.16)' : 'rgba(59, 130, 246, 0.16)'}`,
      transform: 'scale(1.15)',
    },
  },

  '& .MuiSlider-mark': {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
    height: 3,
    width: 1.5,
    borderRadius: 1,

    '&.MuiSlider-markActive': {
      backgroundColor: 'currentColor',
      opacity: 0.8,
    },
  },

  '& .MuiSlider-markLabel': {
    fontSize: '0.72rem',
    fontWeight: 500,
    color: isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
    transform: 'translateY(8px)',
  },
}));

const marks = [
  { value: 1, label: '1' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: 8, label: '8' },
  { value: 10, label: '10' },
  { value: 12, label: '12' },
  { value: 15, label: '15' },
];

const DrawingCanvas = ({ mapRef, drawCounter, setDrawCounter, isDarkMode, setLayersRef, closedMode, lineCount }) => {
  const [lines, setLines] = useState([]);
  const isDrawing = useRef(false);
  const [labelValue, setLabelValue] = useState(3);
  const [showProjectModal, setShowProjectModal] = useState(false);

  useEffect(() => {
    const preventScroll = (e) => e.preventDefault();
    document.body.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      document.body.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  return (
    <div>
      {/* Modern Wave Height Slider */}
      <Container isDarkMode={isDarkMode}>
        <Label isDarkMode={isDarkMode}>
          Wave Height
          <ValueDisplay isDarkMode={isDarkMode}>
            {labelValue}
          </ValueDisplay>
        </Label>

        <StyledSlider
          value={labelValue}
          onChange={(event, val) => setLabelValue(val)}
          step={1}
          marks={marks}
          min={1}
          max={15}
          valueLabelDisplay="off"
          isDarkMode={isDarkMode}
          aria-label="Wave height in feet"
        />
      </Container>

      {/* Drawing Stage */}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onPointerDown={(e) => handlePointerDown(e, lines, setLines, isDrawing)}
        onPointerMove={(e) => handlePointerMove(e, lines, setLines, isDrawing)}
        onPointerUp={() =>
          handlePointerUp(
            mapRef,
            lines,
            setLines,
            isDrawing,
            drawCounter,
            setDrawCounter,
            setLayersRef,
            saveFeature,
            closedMode,
            lineCount,
            labelValue,
            isDarkMode,
            () => setShowProjectModal(true)
          )
        }
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={isDarkMode ? '#ffffff' : '#000000'}
              strokeWidth={2.5}
              tension={0.3}
              lineCap="round"
              lineJoin="round"
              bezier={false}
              opacity={0.9}
            />
          ))}
        </Layer>

        {showProjectModal && <ProjectModal onClose={() => setShowProjectModal(false)} />}
      </Stage>
    </div>
  );
};

export default DrawingCanvas;