import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { createFeature } from '@/api/featureServices';
import { smoothPoints, handlePointerDown, handlePointerMove, handlePointerUp } from './canvasUtils';
import { useProjectId } from "@dashboards/forecaster/hooks/useStudio";
import CreateProjectModal from '@/components/ui/modals/CreateProjectModal';

import { Waves } from 'lucide-react';

// Memoized slider component to prevent unnecessary re-renders

const WaveHeightSlider = memo(({ value, onChange, isDarkMode }) => {
  const marks = [1, 3, 5, 8, 10, 12, 15];
  const pct = ((value - 1) / 14) * 100;

  return (
    <div className={`
      fixed bottom-24 left-1/2 -translate-x-1/2 z-[100]
      w-64 px-3 py-2.5 rounded-2xl
      backdrop-blur-xl border shadow-lg
      transition-all duration-300
      ${isDarkMode
        ? 'bg-black/40 border-white/10'
        : 'bg-white/60 border-white/40'
      }
    `}>

      {/* Top accent — Tier 1 */}
      <div className={`absolute top-0 left-6 right-6 h-px ${isDarkMode
          ? 'bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent'
          : 'bg-gradient-to-r from-transparent via-blue-400/25 to-transparent'
        }`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Waves size={13} className={isDarkMode ? 'text-cyan-400/70' : 'text-blue-500/70'} strokeWidth={2} />
          <span className={`text-[11px] font-medium ${isDarkMode ? 'text-white/70' : 'text-slate-600'}`}>
            Wave Height
          </span>
        </div>

        {/* Value badge — same style as layer count badges */}
        <div className={`
          flex items-center gap-0.5 px-2 py-0.5 rounded-md
          ${isDarkMode ? 'bg-cyan-500/15 border border-cyan-400/20' : 'bg-blue-500/10 border border-blue-400/20'}
        `}>
          <span className={`text-xs font-bold tabular-nums ${isDarkMode ? 'text-cyan-300' : 'text-blue-600'}`}>
            {value}
          </span>
          <span className={`text-[9px] font-medium ${isDarkMode ? 'text-cyan-400/60' : 'text-blue-500/60'}`}>m</span>
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min="1"
          max="15"
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className={`
            w-full h-1 appearance-none cursor-pointer rounded-full
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3.5
            [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:duration-100
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-3.5
            [&::-moz-range-thumb]:h-3.5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:shadow-sm
            [&::-moz-range-thumb]:border-none
          `}
          style={{
            background: `linear-gradient(to right,
              ${isDarkMode ? '#22d3ee' : '#3b82f6'} 0%,
              ${isDarkMode ? '#22d3ee' : '#3b82f6'} ${pct}%,
              ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} ${pct}%,
              ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} 100%)`,
            '--thumb-border': isDarkMode ? '#22d3ee' : '#3b82f6',
          }}
        />

        {/* Marks */}
        <div className="flex justify-between mt-1.5 px-0.5">
          {marks.map((mark) => (
            <span key={mark} className={`
              text-[9px] font-medium tabular-nums transition-colors duration-150
              ${value >= mark
                ? isDarkMode ? 'text-cyan-400/70' : 'text-blue-500/70'
                : isDarkMode ? 'text-white/20' : 'text-slate-300'
              }
            `}>
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
  const drawLock = useRef(false);
  const [projectId] = useProjectId();

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
    if (drawLock.current) return;
    handlePointerDown(e, lines, setLines, isDrawing);
  }, [lines]);

  const onPointerMove = useCallback((e) => {
    if (drawLock.current) return;
    handlePointerMove(e, lines, setLines, isDrawing);
  }, [lines]);

  const onPointerUp = useCallback(async () => {
    if (drawLock.current) return; // prevent double trigger
    drawLock.current = true;       // 🔒 lock drawing

    await handlePointerUp(
      mapRef,
      lines,
      setLines,
      isDrawing,
      drawCounter,
      setDrawCounter,
      setLayersRef,
      createFeature,
      closedMode,
      lineCount,
      labelValue,
      isDarkMode,
      projectId,
      () => setShowProjectModal(true)
    );

    // small cooldown to prevent instant re-click
    setTimeout(() => {
      drawLock.current = false;   // 🔓 unlock drawing
    }, 50); // adjust cooldown ms if needed

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
        <createImageBitmapProjectModal onClose={() => setShowProjectModal(false)} />
      )}
    </>
  );
};

export default memo(DrawingCanvas);