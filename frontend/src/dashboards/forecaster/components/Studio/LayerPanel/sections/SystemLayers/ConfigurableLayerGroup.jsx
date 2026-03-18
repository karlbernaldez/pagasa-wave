import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ModelSelector, ElementSelector, WaveDirectionStylePanel } from './LayerSelectors';
import { getSelectedElement, getModelSummary } from '../../utils/layerPanelUtils';

/**
 * Shared configurable layer group for Wind and Wave.
 *
 * Props:
 *  emoji              : string
 *  title              : string
 *  config             : { enabled, models, elements, directionStyle? }
 *  models             : model options array  (WIND_MODELS / WAVE_MODELS)
 *  elements           : element options array (WIND_ELEMENTS / WAVE_ELEMENTS)
 *  expanded           : boolean
 *  onToggleExpand     : () => void
 *  onToggleEnabled    : () => void
 *  onSetElement       : (elementId) => void
 *  onToggleModel      : (modelId) => void
 *  onSetDirectionStyle: (patch) => void   — optional, only wired for Wave
 *  modelCols          : number  (default 3)
 *  isDarkMode         : boolean
 */
const ConfigurableLayerGroup = ({
  emoji,
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
  modelCols = 3,
  isDarkMode,
}) => {
  const { enabled } = config;

  const selectedElement = getSelectedElement(config.elements, elements);
  const showDirectionStyle =
    enabled &&
    expanded &&
    selectedElement === 'waveDirection';

  return (
    <div className={`rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>

      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg">

        {/* Left: expand trigger (disabled when layer is off) */}
        <button
          onClick={enabled ? onToggleExpand : undefined}
          className={`flex-1 flex items-center gap-2 text-left ${
            enabled ? '' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <span className="text-base">{emoji}</span>
          <div className="flex-1">
            <div className={`text-xs font-semibold ${isDarkMode ? 'text-white/90' : 'text-slate-800'}`}>
              {title}
            </div>
            <div className={`text-[10px] ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
              {enabled ? getModelSummary(config.models) : 'Disabled'}
            </div>
          </div>
        </button>

        {/* Enable / disable dot */}
        <button
          onClick={onToggleEnabled}
          className={`w-2 h-2 rounded-full flex-shrink-0 mx-2 ${
            enabled
              ? isDarkMode ? 'bg-cyan-400' : 'bg-blue-600'
              : isDarkMode ? 'bg-white/20' : 'bg-slate-300'
          }`}
        />

        {/* Chevron */}
        {enabled ? (
          expanded
            ? <ChevronDown  size={12} className={isDarkMode ? 'text-white/60' : 'text-slate-600'} strokeWidth={2.5} />
            : <ChevronRight size={12} className={isDarkMode ? 'text-white/60' : 'text-slate-600'} strokeWidth={2.5} />
        ) : (
          <ChevronRight size={12} className={isDarkMode ? 'text-white/30' : 'text-slate-400'} strokeWidth={2.5} />
        )}
      </div>

      {/* ── Expanded config panel ───────────────────────────────────────── */}
      {expanded && enabled && (
        <div className="px-2 pb-2 space-y-2">
          <ModelSelector
            models={models}
            selected={config.models}
            onToggle={onToggleModel}
            isDarkMode={isDarkMode}
            cols={modelCols}
          />
          <ElementSelector
            elements={elements}
            value={selectedElement}
            onChange={onSetElement}
            isDarkMode={isDarkMode}
          />

          {/* Arrow style controls — only for Wave Direction element */}
          {showDirectionStyle && (
            <WaveDirectionStylePanel
              style={config.directionStyle}
              onChange={onSetDirectionStyle}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ConfigurableLayerGroup);