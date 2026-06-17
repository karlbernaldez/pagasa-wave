// ============================================================
// TOOLBAR TOOL DEFINITIONS
// ============================================================
// Icons are passed in from the parent since they use asset imports
export const TOOL_IDS = {
  TEXT_NOTE: 'text_note',
  LESS_1: 'less_1',
};

export const MAP_CLICK_TYPES = [
  TOOL_IDS.TEXT_NOTE,
  TOOL_IDS.LESS_1,
];

// ============================================================
// THEME CONFIG
// ============================================================
export const getThemeStyles = (isDarkMode) => {
  if (isDarkMode) {
    return {
      container: 'bg-black/40 border-white/20',
      button: 'bg-white/5 hover:bg-white/10 border-white/10',
      buttonActive: 'bg-cyan-500/20 border-cyan-400/40 shadow-lg shadow-cyan-500/20',
      text: 'text-white',
      textMuted: 'text-white/60',
      divider: 'bg-white/10',
      tooltip: 'bg-black/90 border-white/20',
      accent: 'text-cyan-400',
      accentBg: 'bg-cyan-400',
    };
  }
  return {
    container: 'bg-white/60 border-white/40',
    button: 'bg-black/5 hover:bg-black/10 border-black/10',
    buttonActive: 'bg-blue-500/20 border-blue-400/40 shadow-lg shadow-blue-500/20',
    text: 'text-slate-800',
    textMuted: 'text-slate-600',
    divider: 'bg-black/10',
    tooltip: 'bg-white/90 border-black/20',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-600',
  };
};

// ============================================================
// LABEL MAP FOR AUTO-GENERATED TITLES
// ============================================================
export const MARKER_LABEL_MAP = {
  text_note: 'Text',
  less_1: 'Less 1',
};
