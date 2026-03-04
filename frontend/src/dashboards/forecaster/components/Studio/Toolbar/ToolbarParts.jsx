// ============================================================
// ToolButton — single icon button with tooltip
// ============================================================
export const ToolButton = ({ onClick, isActive, theme, title, hotkey, children }) => (
  <button
    onClick={onClick}
    className={`group relative p-2.5 rounded-lg transition-all duration-200 hover:scale-105 border ${
      isActive ? theme.buttonActive : theme.button
    }`}
    title={title}
  >
    {children}
    <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg backdrop-blur-xl border
      opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 ${theme.tooltip}`}>
      <div className={`text-xs font-semibold ${theme.text}`}>{title}</div>
      {hotkey && (
        <div className={`text-[10px] mt-1 ${theme.textMuted}`}>
          Press <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${theme.buttonActive}`}>{hotkey}</kbd>
        </div>
      )}
    </div>
  </button>
);

// ============================================================
// Divider
// ============================================================
export const ToolbarDivider = ({ theme }) => (
  <div className={`w-px h-8 ${theme.divider}`} />
);

// ============================================================
// ActiveToolIndicator — pill above toolbar showing current tool
// ============================================================
export const ActiveToolIndicator = ({ selectedToolType, tools, isDarkMode, theme }) => {
  if (!selectedToolType) return null;

  const label =
    tools.find((t) => t.id === selectedToolType)?.label ||
    (selectedToolType === 'less_1' ? 'Mark Less than 1 Meter' : selectedToolType);

  return (
    <div className={`absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg backdrop-blur-xl border shadow-xl ${
      isDarkMode ? 'bg-black/90 border-cyan-400/30' : 'bg-white/90 border-blue-400/30'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full animate-pulse ${theme.accentBg}`} />
        <span className={`text-xs font-semibold ${theme.text}`}>{label}</span>
      </div>
    </div>
  );
};