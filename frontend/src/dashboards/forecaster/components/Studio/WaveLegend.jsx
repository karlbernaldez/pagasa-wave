import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GripHorizontal, Minus, RotateCcw, Waves } from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// =====================================================
// Wave Height Color Bar
// One qualitative label per visible number
// =====================================================

// Wave height bins (m)
const HW_BINS = [
  0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4,
  4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 14, 20,
];

// Exact ECWAM colors
const COLORS_LIGHT = [
  "#CAEDFB", "#60CAF3", "#0E9ED4", "#C1F1C9", "#82E28F",
  "#01B051", "#FFFF00", "#FFE701", "#FEA401", "#FE0001",
  "#AA1501", "#AB4500", "#6C3300", "#D86DCD", "#792070",
  "#51154A", "#156183", "#0F2941", "#818180", "#404040",
];

const COLORS_DARK = [
  "#08283C", "#0C4664", "#126E96", "#148CA0", "#1EAA8C",
  "#28BE78", "#5AC86E", "#8CD25A", "#BEC846", "#DCB43C",
  "#F09632", "#F5782D", "#FA5A28", "#F03C50", "#DC2878",
  "#BE1E96", "#8C1EAA", "#641EB4", "#A0A0A0", "#D2D2D2",
];

// Visible numeric ticks
const MAJOR_TICKS = [0, 1, 3, 5, 10, 14, 20];

// Qualitative ranges
const QUAL_RANGES = [
  { label: "Calm", from: 0, to: 0.25 },
  { label: "Smooth", from: 0.25, to: 1 },
  { label: "Slight", from: 1, to: 2 },
  { label: "Moderate", from: 2, to: 3 },
  { label: "Rough", from: 3, to: 4 },
  { label: "Very Rough", from: 4, to: 6 },
  { label: "High", from: 6, to: 9 },
  { label: "Very High", from: 9, to: 14 },
  { label: "Phenomenal", from: 14, to: 20 },
];

// Helper: one label per tick
const labelForTick = (value) =>
  QUAL_RANGES.find(
    (q) => value >= q.from && value < q.to
  )?.label ?? "";

// =====================================================
// COMPONENT
// =====================================================

export default function WaveHeightColorBar({
  isDarkMode = false,
  className = "fixed bottom-6 right-2 z-40 select-none",
  storageKey = "pagasa-wave-legend-position",
}) {
  const colors = isDarkMode ? COLORS_DARK : COLORS_LIGHT;
  const legendRef = useRef(null);
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0, last: null });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const clampPosition = useCallback((next) => {
    if (typeof window === "undefined") return next;

    const margin = 8;
    const width = legendRef.current?.offsetWidth || 384;
    const height = legendRef.current?.offsetHeight || 116;

    return {
      x: Math.min(Math.max(margin, next.x), Math.max(margin, window.innerWidth - width - margin)),
      y: Math.min(Math.max(margin, next.y), Math.max(margin, window.innerHeight - height - margin)),
    };
  }, []);

  useEffect(() => {
    if (!position) return undefined;

    const onResize = () => {
      setPosition((current) => (current ? clampPosition(current) : current));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampPosition, position]);

  useEffect(() => {
    if (!position || typeof window === "undefined") return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(position));
    } catch {
      // localStorage may be unavailable in private or restricted contexts.
    }
  }, [position, storageKey]);

  const handlePointerDown = useCallback((event) => {
    if (event.button !== 0) return;

    const rect = legendRef.current?.getBoundingClientRect();
    if (!rect) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      dragging: true,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      last: { x: rect.left, y: rect.top },
    };
    setPosition({ x: rect.left, y: rect.top });
  }, []);

  const handlePointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag.dragging) return;

    const next = clampPosition({
      x: event.clientX - drag.offsetX,
      y: event.clientY - drag.offsetY,
    });

    dragRef.current.last = next;
    setPosition(next);
  }, [clampPosition]);

  const handlePointerUp = useCallback((event) => {
    const drag = dragRef.current;
    if (!drag.dragging) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = { dragging: false, offsetX: 0, offsetY: 0, last: null };
    if (drag.last) setPosition(clampPosition(drag.last));
  }, [clampPosition]);

  const resetPosition = useCallback(() => {
    setPosition(null);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // localStorage may be unavailable in private or restricted contexts.
    }
  }, [storageKey]);

  const wrapperProps = useMemo(() => {
    if (!position) return { className };
    return {
      className: "fixed z-40 select-none",
      style: { left: position.x, top: position.y },
    };
  }, [className, position]);

  const panelTone = isDarkMode
    ? "studio-liquid-dark border border-white/[0.18] text-white"
    : "studio-liquid-light border border-white/80 text-slate-900";
  const iconButtonTone = isDarkMode
    ? "border-white/10 text-white/55 hover:border-white/15 hover:bg-white/[0.08] hover:text-white"
    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900";

  return (
    <div ref={legendRef} {...wrapperProps}>
      <div
        className={cn(
          "studio-liquid-panel w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-2xl transition-all",
          panelTone,
          isCollapsed && "w-auto min-w-56"
        )}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={cn(
            "flex min-h-12 cursor-grab touch-none items-center gap-2.5 border-b px-3 active:cursor-grabbing",
            isDarkMode ? "border-white/10" : "border-slate-200/70"
          )}
        >
          <GripHorizontal size={14} className={isDarkMode ? "text-white/35" : "text-slate-400"} />
          <span className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            isDarkMode ? "bg-cyan-400/10 text-cyan-300" : "bg-blue-500/10 text-blue-600"
          )}>
            <Waves size={16} strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-black uppercase tracking-wide">
              Wave Height
            </div>
            {!isCollapsed && (
              <div className={cn("text-[10px] font-semibold", isDarkMode ? "text-white/45" : "text-slate-500")}>
                Significant wave height, meters
              </div>
            )}
          </div>
          {position && (
            <button
              type="button"
              onClick={resetPosition}
              onPointerDown={(event) => event.stopPropagation()}
              title="Reset legend position"
              className={cn("flex h-9 w-9 items-center justify-center rounded-lg border transition-colors", iconButtonTone)}
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
            onPointerDown={(event) => event.stopPropagation()}
            title={isCollapsed ? "Expand legend" : "Collapse legend"}
            className={cn("flex h-9 w-9 items-center justify-center rounded-lg border transition-colors", iconButtonTone)}
          >
            {isCollapsed ? <Waves size={14} /> : <Minus size={15} />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="px-3 pb-3 pt-3">
            {/* COLOR BAR */}
            <div className={cn(
              "flex overflow-hidden rounded-lg border shadow-inner",
              isDarkMode ? "border-white/15" : "border-slate-300"
            )}>
              {colors.map((c, i) => (
                <div key={i} className="h-4 flex-1" style={{ backgroundColor: c }} />
              ))}
            </div>

            {/* NUMERIC SCALE */}
            <div
              className={`mt-2 flex justify-between text-[10px] font-black tabular-nums
                ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}
            >
              {MAJOR_TICKS.map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>

            {/* QUALITATIVE LABELS (1:1 WITH NUMBERS) */}
            <div
              className={`mt-1 flex justify-between text-[9px] font-bold
                ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
            >
              {MAJOR_TICKS.map((v) => (
                <span key={v} className="max-w-12 text-center leading-tight">
                  {labelForTick(v)}
                </span>
              ))}
            </div>

            {/* UNITS */}
            <div
              className={`mt-2 rounded-lg px-2 py-1.5 text-center text-[10px] font-black uppercase tracking-wide
                ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
            >
              Significant Wave Height (m)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
