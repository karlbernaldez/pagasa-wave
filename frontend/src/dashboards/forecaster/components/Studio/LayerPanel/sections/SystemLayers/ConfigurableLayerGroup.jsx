import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { fetchWaveModelCatalog } from '@/api/waveModels';
import {
  ModelSelector,
  ElementSelector,
  WaveDirectionStylePanel,
  WindBarbStylePanel,
} from './LayerSelectors';
import { getSelectedElement, getModelSummary } from '../../utils/layerPanelUtils';

const ConfigurableLayerGroup = ({
  icon,
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
  modelStatuses = {},
  afterModelSelector = null,
  isDarkMode,
}) => {
  const { enabled } = config;
  const [waveCatalog, setWaveCatalog] = React.useState(null);

  React.useEffect(() => {
    if (title !== 'Wave') return undefined;

    let disposed = false;

    const refreshCatalog = async () => {
      try {
        const result = await fetchWaveModelCatalog();
        if (!disposed) setWaveCatalog(result?.models || []);
      } catch {
        // Keep the bundled model availability as a safe fallback if the catalog cannot be read.
      }
    };

    void refreshCatalog();
    const intervalId = window.setInterval(refreshCatalog, 60_000);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [title]);

  const effectiveModels = React.useMemo(() => {
    if (title !== 'Wave' || !waveCatalog) return models;

    const catalogByCode = new Map(waveCatalog.map((model) => [model.code, model]));
    return models.map((model) => {
      const managed = catalogByCode.get(model.id);
      if (!managed) return model;

      return {
        ...model,
        available: Boolean(managed.enabled && managed.hasData && managed.builderConfigured),
      };
    });
  }, [models, title, waveCatalog]);

  const selectedElement = getSelectedElement(config.elements, elements);
  const showDirectionStyle = enabled && expanded && selectedElement === 'waveDirection';
  const showWindBarbStyle = enabled && expanded && selectedElement === 'barbs';

  const border = isDarkMode ? 'border-white/10' : 'border-white/80';
  const textSec = isDarkMode ? 'text-white/50' : 'text-slate-500';
  const textTer = isDarkMode ? 'text-white/25' : 'text-slate-300';
  const surface = isDarkMode
    ? 'bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
    : 'bg-white/[0.58] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]';

  return (
    <div className={`studio-liquid-control overflow-hidden rounded-xl border ${border} ${surface}`}>
      <div className="flex min-h-16 items-center">
        <button
          type="button"
          onClick={enabled ? onToggleExpand : undefined}
          className={`
            flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left transition-colors
            ${
              enabled
                ? isDarkMode
                  ? 'hover:bg-white/[0.05]'
                  : 'hover:bg-slate-50'
                : 'cursor-default opacity-45'
            }
          `}
        >
          <span
            className={`
              flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
              ${
                enabled
                  ? isDarkMode
                    ? 'bg-cyan-400/10 text-cyan-300'
                    : 'bg-blue-500/10 text-blue-600'
                  : isDarkMode
                    ? 'bg-white/[0.06] text-white/25'
                    : 'bg-white/70 text-slate-400'
              }
            `}
          >
            {icon}
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={`block truncate text-[14px] font-black ${
                isDarkMode ? 'text-white/85' : 'text-slate-800'
              }`}
            >
              {title}
            </span>
            <span className={`block truncate text-[11px] font-semibold ${textSec}`}>
              {enabled ? getModelSummary(config.models) : 'Disabled'}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2 pr-3">
          <button
            type="button"
            onClick={onToggleEnabled}
            aria-pressed={enabled}
            aria-label={`${enabled ? 'Disable' : 'Enable'} ${title}`}
            className={`
              relative flex h-10 w-[4.4rem] items-center rounded-full border px-1 transition-all duration-200
              ${
                enabled
                  ? isDarkMode
                    ? 'border-cyan-400/40 bg-cyan-400/20 shadow-[0_0_18px_rgba(34,211,238,0.18)]'
                    : 'border-blue-400/45 bg-blue-500/15'
                  : isDarkMode
                    ? 'border-white/10 bg-white/[0.08] hover:bg-white/[0.12]'
                    : 'border-white/80 bg-white/65 hover:bg-white/90'
              }
            `}
          >
            <span
              className={`
                flex h-8 w-8 items-center justify-center rounded-full text-[9px] font-black shadow-sm transition-all duration-200
                ${
                  enabled
                    ? 'translate-x-[1.9rem] bg-white text-slate-900'
                    : isDarkMode
                      ? 'translate-x-0 bg-slate-800 text-white/50'
                      : 'translate-x-0 bg-white text-slate-400'
                }
              `}
            >
              {enabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {enabled ? (
            expanded ? (
              <ChevronDown size={16} strokeWidth={2.5} className={textSec} />
            ) : (
              <ChevronRight size={16} strokeWidth={2.5} className={textSec} />
            )
          ) : (
            <ChevronRight size={16} strokeWidth={2.5} className={textTer} />
          )}
        </div>
      </div>

      {expanded && enabled && (
        <div className={`space-y-3 border-t px-3 pb-3 pt-3 ${border}`}>
          <ModelSelector
            models={effectiveModels}
            selected={config.models}
            onToggle={onToggleModel}
            modelStatuses={modelStatuses}
            isDarkMode={isDarkMode}
          />

          {afterModelSelector}

          <div className={`h-px ${isDarkMode ? 'bg-white/[0.08]' : 'bg-white/70'}`} />

          <ElementSelector
            elements={elements}
            value={selectedElement}
            onChange={onSetElement}
            isDarkMode={isDarkMode}
          />

          {showDirectionStyle && (
            <>
              <div className={`h-px ${isDarkMode ? 'bg-white/[0.08]' : 'bg-white/70'}`} />
              <WaveDirectionStylePanel
                style={config.directionStyle}
                onChange={onSetDirectionStyle}
                isDarkMode={isDarkMode}
              />
            </>
          )}

          {showWindBarbStyle && (
            <>
              <div className={`h-px ${isDarkMode ? 'bg-white/[0.08]' : 'bg-white/70'}`} />
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
