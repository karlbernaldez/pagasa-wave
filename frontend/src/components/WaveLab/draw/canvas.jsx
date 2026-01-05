import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { saveFeature } from '../../../api/featureServices';
import {
  smoothPoints,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
} from './canvasUtils';
import ProjectModal from '../../modals/ProjectModal';

// Memoized slider component to prevent unnecessary re-renders
const WaveHeightSlider = memo(({ value, onChange, isDarkMode }) => {
  const marks = [1, 3, 5, 8, 10, 12, 15];

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] 
                  backdrop-blur-xl rounded-2xl border
                  transition-all duration-300 ease-out
                  px-4 py-3 min-w-[280px]
                  ${isDarkMode
          ? 'bg-slate-800 border-slate-700 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]'
          : 'bg-white border-slate-200 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.35)]'
        }`}>

      {/* Compact Header */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">🌊</span>
          <span className={`font-semibold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
            Wave Height
          </span>
        </div>
        <div
          className={`flex items-center justify-center px-2.5 h-7
                      text-white rounded-lg font-bold text-sm shadow-md
                      ${isDarkMode
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/40'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30'
            }`}>
          {value}<span className="text-[10px] ml-0.5 opacity-85">m</span>
        </div>
      </div>

      {/* Compact Slider */}
      <div className="relative">
        <input
          type="range"
          min="1"
          max="15"
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className={`w-full h-1.5 appearance-none cursor-pointer rounded-full
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-white
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:shadow-md
                     [&::-webkit-slider-thumb]:transition-transform
                     [&::-webkit-slider-thumb]:duration-150
                     [&::-webkit-slider-thumb]:hover:scale-110
                     [&::-webkit-slider-thumb]:active:scale-115
                     [&::-moz-range-thumb]:w-4
                     [&::-moz-range-thumb]:h-4
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-white
                     [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:shadow-md
                     [&::-moz-range-thumb]:transition-transform
                     [&::-moz-range-thumb]:duration-150
                     [&::-moz-range-thumb]:hover:scale-110
                     [&::-moz-range-thumb]:active:scale-115`}
          style={{
            background: `linear-gradient(to right, 
              ${isDarkMode ? '#6366f1' : '#3b82f6'} 0%, 
              ${isDarkMode ? '#6366f1' : '#3b82f6'} ${((value - 1) / 14) * 100}%, 
              ${isDarkMode ? '#475569' : '#e2e8f0'} ${((value - 1) / 14) * 100}%, 
              ${isDarkMode ? '#475569' : '#e2e8f0'} 100%)`,
            borderColor: isDarkMode ? '#6366f1' : '#3b82f6'
          }}
        />

        {/* Minimal Marks */}
        <div className="flex justify-between mt-1 px-0.5">
          {marks.map((mark) => (
            <span
              key={mark}
              className={`text-[9px] font-medium transition-colors duration-200
                         ${value >= mark
                  ? (isDarkMode ? 'text-indigo-400' : 'text-blue-600')
                  : (isDarkMode ? 'text-slate-500' : 'text-slate-400')
                }`}>
              {mark}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

WaveHeightSlider.displayName = 'WaveHeightSlider';

// Memoized Line component to prevent unnecessary re-renders
const DrawingLine = memo(({ line, isDarkMode }) => (
  <Line
    points={line.points}
    stroke={isDarkMode ? '#ffffff' : '#000000'}
    strokeWidth={2.5}
    tension={0.3}
    lineCap="round"
    lineJoin="round"
    bezier={false}
    opacity={0.9}
  />
));

DrawingLine.displayName = 'DrawingLine';

const DrawingCanvas = ({
  mapRef,
  drawCounter,
  setDrawCounter,
  isDarkMode,
  setLayersRef,
  closedMode,
  lineCount,
}) => {
  const [lines, setLines] = useState([]);
  const isDrawing = useRef(false);
  const [labelValue, setLabelValue] = useState(3);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const stageRef = useRef(null);

  // Prevent body scroll during drawing
  useEffect(() => {
    const preventScroll = (e) => {
      if (isDrawing.current) {
        e.preventDefault();
      }
    };

    document.body.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      document.body.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  // Optimized pointer handlers with useCallback
  const onPointerDown = useCallback((e) => {
    handlePointerDown(e, lines, setLines, isDrawing);
  }, [lines]);

  const onPointerMove = useCallback((e) => {
    handlePointerMove(e, lines, setLines, isDrawing);
  }, [lines]);

  const onPointerUp = useCallback(() => {
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
    );
  }, [
    mapRef,
    lines,
    drawCounter,
    setDrawCounter,
    setLayersRef,
    closedMode,
    lineCount,
    labelValue,
    isDarkMode,
  ]);

  return (
    <>
      {/* Wave Height Slider */}
      <WaveHeightSlider
        value={labelValue}
        onChange={setLabelValue}
        isDarkMode={isDarkMode}
      />

      {/* Drawing Stage */}
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="absolute top-0 left-0 z-10 pointer-events-auto"
      >
        <Layer>
          {lines.map((line, i) => (
            <DrawingLine key={i} line={line} isDarkMode={isDarkMode} />
          ))}
        </Layer>
      </Stage>

      {/* Project Modal */}
      {showProjectModal && (
        <ProjectModal onClose={() => setShowProjectModal(false)} />
      )}
    </>
  );
};

export default memo(DrawingCanvas);