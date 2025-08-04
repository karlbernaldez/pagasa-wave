import { Stage, Layer, Line } from 'react-konva';
import { useRef, useState, useEffect } from 'react';
import { saveFeature } from '../../../api/featureServices';
import {
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
} from './frontUtils';
import { downloadGeoJSON } from './frontUtils';

const FlagCanvas = ({
  mapRef,
  drawCounter,
  setDrawCounter,
  setLayersRef,
  closedMode,
}) => {
  const [lines, setLines] = useState([]);
  const isFlagDrawing = useRef(false);
  const colorToggle = useRef(true); // true = red, false = blue

  useEffect(() => {
    const preventScroll = (e) => e.preventDefault();
    document.body.addEventListener('touchmove', preventScroll, {
      passive: false,
    });
    return () => {
      document.body.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  const handleDown = (e) => {
    const strokeColor = colorToggle.current ? 'red' : 'blue';
    handlePointerDown(e, lines, setLines, isFlagDrawing, strokeColor);
  };

  return (
    <div>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onPointerDown={handleDown}
        onPointerMove={(e) =>
          handlePointerMove(e, lines, setLines, isFlagDrawing)
        }
        onPointerUp={() =>
          handlePointerUp(
            mapRef,
            lines,
            setLines,
            isFlagDrawing,
            drawCounter,
            setDrawCounter,
            setLayersRef,
            saveFeature,
            closedMode,
            colorToggle // <-- pass it here
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
              stroke={line.color}
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default FlagCanvas;
