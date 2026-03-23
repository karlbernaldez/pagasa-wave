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

export default function WaveHeightColorBar({ isDarkMode = false }) {
  const colors = isDarkMode ? COLORS_DARK : COLORS_LIGHT;

  return (
    <div className="fixed bottom-6 right-2 z-40 select-none">
      <div
        className={`rounded-xl px-3 py-2 backdrop-blur-xl shadow-xl
          ${
            isDarkMode
              ? "bg-black/40 border border-white/20"
              : "bg-white/60 border border-white/40"
          }`}
      >
        {/* COLOR BAR */}
        <div className="flex overflow-hidden rounded-md border border-black/20">
          {colors.map((c, i) => (
            <div
              key={i}
              className="h-3 w-4"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* NUMERIC SCALE */}
        <div
          className={`mt-1 flex justify-between text-[9px] tabular-nums
            ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}
        >
          {MAJOR_TICKS.map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>

        {/* QUALITATIVE LABELS (1:1 WITH NUMBERS) */}
        <div
          className={`mt-1 flex justify-between text-[9px] font-medium
            ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
        >
          {MAJOR_TICKS.map((v) => (
            <span key={v} className="text-center">
              {labelForTick(v)}
            </span>
          ))}
        </div>

        {/* UNITS */}
        <div
          className={`mt-0.5 text-center text-[9px]
            ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
        >
          Significant Wave Height (m)
        </div>
      </div>
    </div>
  );
}
