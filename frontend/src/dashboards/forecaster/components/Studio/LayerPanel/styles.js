export const panelStyles = {
  container:
    "fixed top-16 left-2 z-40 w-64 mt-1",

  panel:
    "rounded-xl backdrop-blur-xl shadow-xl flex flex-col transition-all duration-300",

  header:
    "p-2 border-b relative",

  headerRow:
    "flex items-center gap-1.5",

  menuButton:
    "flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200",

  collapseButton:
    "p-1.5 rounded-lg transition-all duration-200 hover:scale-110",

  layersHeader:
    "flex items-center justify-between px-3 py-2 border-b",

  layersScroll:
    "max-h-[calc(100vh-320px)] overflow-y-auto hide-scrollbar",

  footer:
    "p-2.5 border-t",

  addLayerButton:
    "w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-[11px] transition-all duration-200 hover:scale-[1.02]",
};

export const themeStyles = {
  panel: (dark) =>
    dark
      ? "bg-black/40 border border-white/20"
      : "bg-white/60 border border-white/40",

  border: (dark) =>
    dark ? "border-white/10" : "border-black/10",

  menuButton: (dark, active) =>
    active
      ? dark
        ? "bg-white/10 text-white"
        : "bg-black/10 text-slate-900"
      : dark
      ? "hover:bg-white/8 text-white/80 hover:text-white"
      : "hover:bg-black/5 text-slate-700 hover:text-slate-900",

  addLayerButton: (dark) =>
    dark
      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
      : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20",
};