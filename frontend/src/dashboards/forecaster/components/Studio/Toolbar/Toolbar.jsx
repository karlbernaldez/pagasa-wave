import { TbTools } from 'react-icons/tb';
import { CheckCircle2, ChevronDown, ChevronUp, Flag, Type, Waves, X } from 'lucide-react';

import l1 from '@/assets/draw_icons/L1.png';

import PointInputChoiceModal from '@/components/ui/modals/MarkerChoice';
import MarkerTitleModal from '@/components/ui/modals/MarkerTitleModal';
import ManualInputModal from '@/components/ui/modals/ManualInputModal';
import FeatureNotAvailableModal from '@/components/ui/modals/FeatureNotAvailable';

import { useDrawToolbar } from './hooks/useDrawToolbar';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const getTheme = (isDarkMode) => ({
  panel: isDarkMode
    ? 'border-cyan-200/20 bg-[#0b2638]/78 text-cyan-50 shadow-[0_18px_60px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.16)]'
    : 'border-white/80 bg-white/74 text-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.95)]',
  section: isDarkMode ? 'text-cyan-100/55' : 'text-slate-500',
  row: isDarkMode
    ? 'border-white/8 bg-white/[0.045] text-cyan-100/78 hover:border-cyan-200/24 hover:bg-cyan-300/10 hover:text-cyan-50'
    : 'border-white/70 bg-white/48 text-slate-700 hover:border-blue-200 hover:bg-blue-50/75 hover:text-blue-800',
  active: isDarkMode
    ? 'border-cyan-200/36 bg-cyan-300/18 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(255,255,255,0.18)]'
    : 'border-blue-300/80 bg-blue-100/80 text-blue-800 shadow-[0_0_22px_rgba(59,130,246,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]',
  activeClosed: isDarkMode
    ? 'border-emerald-200/38 bg-emerald-300/18 text-emerald-50 shadow-[0_0_24px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(255,255,255,0.18)]'
    : 'border-emerald-300/80 bg-emerald-100/80 text-emerald-800 shadow-[0_0_22px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]',
  iconRail: isDarkMode ? 'bg-white/[0.07] ring-1 ring-white/10' : 'bg-white/55 ring-1 ring-white/80',
  divider: isDarkMode ? 'border-cyan-100/12' : 'border-slate-200/80',
  subtle: isDarkMode ? 'text-cyan-100/58' : 'text-slate-500',
});

const ToolRow = ({ active, activeClassName, description, icon, label, onClick, theme }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cn(
      'flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80',
      active ? activeClassName || theme.active : theme.row
    )}
  >
    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', theme.iconRail)}>
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-xs font-black leading-tight">{label}</span>
      {description && (
        <span className={cn('mt-0.5 block truncate text-[10px] font-semibold leading-tight', theme.subtle)}>
          {description}
        </span>
      )}
    </span>
  </button>
);

const SectionTitle = ({ children, theme }) => (
  <p className={cn('px-1 text-[10px] font-black uppercase tracking-[0.16em]', theme.section)}>
    {children}
  </p>
);

const CollapsedDock = ({ isDarkMode, onOpen, theme }) => (
  <div className="fixed bottom-5 left-1/2 z-[55] -translate-x-1/2">
    <button
      type="button"
      aria-label="Open drawing tools"
      title="Open drawing tools"
      onClick={onOpen}
      className={cn(
        'relative flex h-12 items-center gap-2 rounded-[22px] border px-4 text-xs font-black backdrop-blur-2xl transition-all',
        'before:pointer-events-none before:absolute before:inset-x-4 before:top-1.5 before:h-px before:rounded-full before:bg-white/35',
        theme.panel,
        isDarkMode ? 'hover:bg-[#0f3045]/82' : 'hover:bg-white/86'
      )}
    >
      <span className={cn('flex h-7 w-7 items-center justify-center rounded-2xl', theme.iconRail)}>
        <TbTools size={16} aria-hidden="true" />
      </span>
      <span>Draw Tools</span>
      <ChevronUp size={14} className={theme.subtle} aria-hidden="true" />
    </button>
  </div>
);

const DrawToolbar = ({
  draw, onToggleCanvas, onToggleFlagCanvas,
  isCanvasActive, isDarkMode,
  setLayersRef, setLayers,
  closedMode, setClosedMode,
  setType, selectedToolRef,
  projectId,
}) => {
  const theme = getTheme(isDarkMode);

  const {
    isDrawing, isFlagDrawing, isCollapsed, selectedToolType,
    openModals, toggleModal,
    handlePointInputChoice,
    handleMarkerTitleSubmit, handleManualInputSubmit,
    handleToggleDrawing, handleToggleFlagDrawing,
    handleSelectLess1, handleSelectTextNote, handleToggleCollapse,
    setPendingMapClick,
  } = useDrawToolbar({ draw, setLayersRef, setLayers, setType, selectedToolRef, onToggleCanvas, onToggleFlagCanvas, projectId });

  const waveActive = isCanvasActive || isDrawing;

  if (isCollapsed) {
    return <CollapsedDock isDarkMode={isDarkMode} onOpen={handleToggleCollapse} theme={theme} />;
  }

  return (
    <>
      <PointInputChoiceModal isOpen={openModals.pointInputChoice} onClose={() => toggleModal('pointInputChoice', false)} onSelect={handlePointInputChoice} isDarkMode={isDarkMode} />
      <MarkerTitleModal isOpen={openModals.markerTitle} onClose={() => { toggleModal('markerTitle', false); setPendingMapClick(null); }} onSubmit={handleMarkerTitleSubmit} isDarkMode={isDarkMode} markerType={selectedToolType} />
      <ManualInputModal isOpen={openModals.manualInput} onClose={() => toggleModal('manualInput', false)} onSubmit={handleManualInputSubmit} isDarkMode={isDarkMode} />
      <FeatureNotAvailableModal isOpen={openModals.featureNotAvailable} onClose={() => toggleModal('featureNotAvailable', false)} />

      <aside className="fixed bottom-5 left-5 z-[55] w-[min(320px,calc(100vw-24px))]">
        <div
          role="toolbar"
          aria-label="Drawing tools"
          className={cn(
            'relative space-y-3 rounded-[26px] border p-3 shadow-2xl backdrop-blur-2xl',
            'before:pointer-events-none before:absolute before:inset-x-8 before:top-1.5 before:h-px before:rounded-full before:bg-white/35',
            'after:pointer-events-none after:absolute after:inset-1 after:rounded-[22px] after:ring-1 after:ring-white/10',
            theme.panel
          )}
        >
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl', theme.iconRail)}>
                <TbTools size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black leading-tight">Draw Tools</p>
                <p className={cn('truncate text-[10px] font-semibold', theme.subtle)}>Add labels and forecast drawings</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Collapse drawing tools"
              title="Collapse drawing tools"
              onClick={handleToggleCollapse}
              className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border', theme.row)}
            >
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          </div>

          <div className={cn('relative z-10 space-y-2 border-t pt-3', theme.divider)}>
            <SectionTitle theme={theme}>Annotate</SectionTitle>
            <ToolRow
              label="Text Label"
              description="Place a named map note"
              active={selectedToolType === 'text_note'}
              onClick={handleSelectTextNote}
              theme={theme}
              icon={<Type size={18} aria-hidden="true" />}
            />
            <ToolRow
              label="Low Wave Marker"
              description="Add a low-wave marker"
              active={selectedToolType === 'less_1'}
              onClick={handleSelectLess1}
              theme={theme}
              icon={<img src={l1} alt="" className="h-6 w-6 object-contain" aria-hidden="true" />}
            />
          </div>

          <div className={cn('relative z-10 space-y-2 border-t pt-3', theme.divider)}>
            <SectionTitle theme={theme}>Draw</SectionTitle>
            <ToolRow
              label={waveActive ? 'Stop Wave Drawing' : 'Wave Drawing'}
              description="Draw wave height contours"
              active={waveActive}
              onClick={handleToggleDrawing}
              theme={theme}
              icon={waveActive ? <X size={18} aria-hidden="true" /> : <Waves size={18} aria-hidden="true" />}
            />
            <ToolRow
              label={isFlagDrawing ? 'Stop Flag Drawing' : 'Flag Drawing'}
              description="Draw forecast front flags"
              active={isFlagDrawing}
              onClick={handleToggleFlagDrawing}
              theme={theme}
              icon={<Flag size={18} aria-hidden="true" />}
            />
          </div>

          {waveActive && (
            <div className={cn('relative z-10 space-y-2 border-t pt-3', theme.divider)}>
              <SectionTitle theme={theme}>Wave Mode</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <ToolRow
                  label="Open Line"
                  description="Label both ends"
                  active={!closedMode}
                  onClick={() => setClosedMode(false)}
                  theme={theme}
                  icon={<Waves size={18} aria-hidden="true" />}
                />
                <ToolRow
                  label="Closed Loop"
                  description="One contour label"
                  active={closedMode}
                  activeClassName={theme.activeClosed}
                  onClick={() => setClosedMode(true)}
                  theme={theme}
                  icon={<CheckCircle2 size={18} aria-hidden="true" />}
                />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default DrawToolbar;
