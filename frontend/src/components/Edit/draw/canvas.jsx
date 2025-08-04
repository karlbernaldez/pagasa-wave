import Slider from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import { Stage, Layer, Line } from 'react-konva';
import { useRef, useState, useEffect } from 'react';
import { saveFeature } from '../../../api/featureServices';
import { convertToGeoJSON, downloadGeoJSON, handlePointerDown, handlePointerMove, handlePointerUp, chaikinSmoothing } from './canvasUtils';

// Custom ValueLabel that appears below the thumb, centered, without background color
const ValueLabelComponent = styled(({ children, value, open }) => (
  <span className={open ? 'MuiSlider-valueLabelOpen' : ''} aria-hidden={!open}>
    {children}
    <span className="custom-label">{value}</span>
  </span>
))(({ theme }) => ({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  '& .custom-label': {
    position: 'absolute',
    top: '100%',       // places it below the thumb
    left: '50%',
    transform: 'translateX(-50%) translateY(4px)',
    backgroundColor: 'transparent',
    color: theme.palette.text.primary,
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 12,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    userSelect: 'none',
  },
}));

const DrawingCanvas = ({ mapRef, drawCounter, setDrawCounter, setLayersRef, closedMode, lineCount }) => {
  const [lines, setLines] = useState([]);
  const isDrawing = useRef(false);
  const [labelValue, setLabelValue] = useState(3); // Initial label value

  useEffect(() => {
    const preventScroll = (e) => e.preventDefault();
    document.body.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      document.body.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  return (
    <div>

      {/* Slider for label value - fixed at bottom center */}
      <div
        style={{
          position: 'fixed',
          zIndex: 100,
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          maxWidth: '90vw',
          width: '300px',
          textAlign: 'center',
          marginBottom: '2.5rem',
        }}
      >
        <label style={{ display: 'block', marginBottom: '.1rem' }}>
          Wave Height: {labelValue}
        </label>
        <Slider
          value={labelValue}
          onChange={(event, val) => setLabelValue(val)}
          shiftStep={1}
          step={1}
          marks
          min={1}
          max={15}
          valueLabelDisplay="on"
          ValueLabelComponent={ValueLabelComponent}
        />
      </div>

      {/* Drawing stage */}
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
            labelValue // <-- pass label value here if needed
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
              points={chaikinSmoothing(line.points)}
              stroke="red"
              strokeWidth={2}
              tension={1.5}
              lineCap="round"
              lineJoin="round"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default DrawingCanvas;