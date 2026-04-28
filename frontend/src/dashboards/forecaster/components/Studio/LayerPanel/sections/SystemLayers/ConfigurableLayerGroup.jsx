import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ModelSelector, ElementSelector, WaveDirectionStylePanel, WindBarbStylePanel } from './LayerSelectors';
import { getSelectedElement, getModelSummary } from '../../utils/layerPanelUtils';

const ConfigurableLayerGroup = ({
  icon,           // JSX — e.g. <Wind size={13} strokeWidth={1.8} />
  title,
  config,
  models,
  elements,
  expanded,
  onToggleExpand,
  onToggleEnabled,
  onSetElement,
  onToggleModel,
  onSetDirectionStyle,
  onSetBarbStyle,
  modelCols = 3,
  isDarkMode,
}) => {
  const { enabled } = config;

  const selectedElement   = getSelectedElement(config.elements, elements);
  const showDirectionStyle = enabled && expanded && selectedElement === 'waveDirection';
  const showWindBarbStyle  = enabled && expanded && selectedElement === 'barbs';

  const border  = isDarkMode ? 'border-white/10'  : 'border-black/8';
  const textSec = isDarkMode ? 'text-white/40'    : 'text-slate-400';
  const textTer = isDarkMode ? 'text-white/25'    : 'text-slate-300';
  const surface = isDarkMode ? 'bg-white/5'       : 'bg-white';

  return (
    <div className={`rounded-lg border ${border} ${surface} overflow-hidden`}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center">

        {/* Expand / title area */}
        <button
          onClick={enabled ? onToggleExpand : undefined}
          className={`
            flex-1 flex items-center gap-2 px-2.5 py-2 text-left min-w-0
            transition-colors
            ${enabled
              ? isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/4'
              : 'opacity-40 cursor-default'}
          `}
        >
          <span className={`flex-shrink-0 ${textSec}`}>
            {icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className={`text-[11px] font-medium truncate ${
              isDarkMode ? 'text-white/85' : 'text-slate-700'
            }`}>
              {title}
            </div>
            <div className={`text-[10px] truncate ${textSec}`}>
              {enabled ? getModelSummary(config.models) : 'Disabled'}
            </div>
          </div>
        </button>

        {/* Toggle dot + chevron */}
        <div className="flex items-center gap-1.5 pr-2.5 flex-shrink-0">
          <button
            onClick={onToggleEnabled}
            className={`
              w-1.5 h-1.5 rounded-full transition-colors
              ${enabled
                ? isDarkMode ? 'bg-white/70' : 'bg-slate-600'
                : isDarkMode ? 'bg-white/18' : 'bg-slate-300'}
            `}
          />
          {enabled ? (
            expanded
              ? <ChevronDown size={11} strokeWidth={2.5} className={textSec} />
              : <ChevronRight size={11} strokeWidth={2.5} className={textSec} />
          ) : (
            <ChevronRight size={11} strokeWidth={2.5} className={textTer} />
          )}
        </div>
      </div>

      {/* ── Expanded config panel ─────────────────────────────────────────── */}
      {expanded && enabled && (
        <div className={`
          border-t px-2 pb-2 pt-2 space-y-2 ${border}
        `}>

          {/* Model selector */}
          <div>
            <p className={`text-[10px] font-medium tracking-widest uppercase mb-1.5 ${textSec}`}>
              Model
            </p>
            <ModelSelector
              models={models}
              selected={config.models}
              onToggle={onToggleModel}
              isDarkMode={isDarkMode}
              cols={modelCols}
            />
          </div>

          <div className={`h-px ${isDarkMode ? 'bg-white/8' : 'bg-black/6'}`} />

          {/* Element selector */}
          <div>
            <p className={`text-[10px] font-medium tracking-widest uppercase mb-1.5 ${textSec}`}>
              Element
            </p>
            <ElementSelector
              elements={elements}
              value={selectedElement}
              onChange={onSetElement}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Wave direction style */}
          {showDirectionStyle && (
            <>
              <div className={`h-px ${isDarkMode ? 'bg-white/8' : 'bg-black/6'}`} />
              <WaveDirectionStylePanel
                style={config.directionStyle}
                onChange={onSetDirectionStyle}
                isDarkMode={isDarkMode}
              />
            </>
          )}

          {/* Wind barb style */}
          {showWindBarbStyle && (
            <>
              <div className={`h-px ${isDarkMode ? 'bg-white/8' : 'bg-black/6'}`} />
              <WindBarbStylePanel
                style={config.barbStyle}
                onChange={onSetBarbStyle}
                isDarkMode={isDarkMode}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ConfigurableLayerGroup);