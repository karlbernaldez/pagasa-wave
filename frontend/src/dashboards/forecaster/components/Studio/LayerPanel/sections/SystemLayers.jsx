import React from 'react';
import { Map, Satellite, Waves, Wind, Wrench } from 'lucide-react';
import LayerGroupCard from './SystemLayers/LayerGroupCard';
import CheckboxLayerRow from './SystemLayers/CheckboxLayerRow';
import ConfigurableLayerGroup from './SystemLayers/ConfigurableLayerGroup';
import {
  DOMAIN_LAYERS,
  UTILITY_LAYERS,
  WIND_MODELS,
  WAVE_MODELS,
  WIND_ELEMENTS,
  WAVE_ELEMENTS,
} from '../constants/layerConstants';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const SectionLabel = ({ label, count, isDarkMode, accent = false }) => (
  <div className="flex items-center justify-between px-1">
    <span className={cn(
      'text-[10px] font-black uppercase tracking-wide',
      isDarkMode ? 'text-white/35' : 'text-slate-400'
    )}>
      {label}
    </span>
    <span className={cn(
      'rounded-full px-2 py-0.5 text-[9px] font-black',
      accent
        ? isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-500/10 text-blue-700'
        : isDarkMode ? 'bg-white/8 text-white/35' : 'bg-slate-100 text-slate-500'
    )}>
      {count}
    </span>
  </div>
);

const SystemLayersSection = ({
  expanded,
  activeCount,
  expandedGroups,
  onToggleGroup,
  domainLayers,
  utilitiesLayers,
  satelliteLayer,
  windConfig,
  waveConfig,
  onToggleDomain,
  onToggleUtility,
  onToggleSatellite,
  onToggleWind,
  onSetWindElement,
  onToggleWindModel,
  onToggleWave,
  onSetWaveElement,
  onToggleWaveModel,
  onSetWaveDirectionStyle,
  onSetWindBarbStyle,
  isDarkMode,
}) => {
  const referenceCount =
    Object.values(domainLayers).filter(Boolean).length +
    Object.values(utilitiesLayers).filter(Boolean).length +
    (satelliteLayer ? 1 : 0);

  if (!expanded) return null;

  return (
    <div className="px-3 pb-3 pt-3">
      <div className="space-y-3">
        <div className="space-y-2">
          <SectionLabel label="Reference" count={referenceCount} isDarkMode={isDarkMode} />

          <LayerGroupCard
            icon={<Map size={15} strokeWidth={2} />}
            title="Domains"
            badge={Object.values(domainLayers).filter(Boolean).length}
            expanded={expandedGroups.domains}
            onToggle={() => onToggleGroup('domains')}
            isDarkMode={isDarkMode}
          >
            {DOMAIN_LAYERS.map((layer) => (
              <CheckboxLayerRow
                key={layer.id}
                {...layer}
                active={domainLayers[layer.id]}
                onToggle={onToggleDomain}
                isDarkMode={isDarkMode}
              />
            ))}
          </LayerGroupCard>

          <LayerGroupCard
            icon={<Wrench size={15} strokeWidth={2} />}
            title="Utilities"
            badge={Object.values(utilitiesLayers).filter(Boolean).length}
            expanded={expandedGroups.utilities}
            onToggle={() => onToggleGroup('utilities')}
            isDarkMode={isDarkMode}
          >
            {UTILITY_LAYERS.map((layer) => (
              <CheckboxLayerRow
                key={layer.id}
                {...layer}
                active={utilitiesLayers[layer.id]}
                onToggle={onToggleUtility}
                isDarkMode={isDarkMode}
              />
            ))}
          </LayerGroupCard>

          <button
            type="button"
            onClick={onToggleSatellite}
            className={cn(
              'flex min-h-14 w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all',
              satelliteLayer
                ? isDarkMode
                  ? 'border-cyan-400/25 bg-cyan-400/10'
                  : 'border-blue-500/25 bg-blue-500/10'
                : isDarkMode
                  ? 'border-white/10 bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.07]'
                  : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                satelliteLayer
                  ? isDarkMode ? 'bg-cyan-300/15 text-cyan-200' : 'bg-blue-500/10 text-blue-700'
                  : isDarkMode ? 'bg-white/8 text-white/45' : 'bg-slate-100 text-slate-500'
              )}>
                <Satellite size={15} strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className={cn(
                  'block truncate text-[13px] font-black',
                  satelliteLayer
                    ? isDarkMode ? 'text-white/85' : 'text-slate-800'
                    : isDarkMode ? 'text-white/55' : 'text-slate-600'
                )}>
                  Satellite
                </span>
                <span className={cn('block truncate text-[10px] font-semibold', isDarkMode ? 'text-white/35' : 'text-slate-500')}>
                  Himawari composite
                </span>
              </span>
            </span>
            <span className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              satelliteLayer
                ? isDarkMode ? 'bg-cyan-300' : 'bg-blue-600'
                : isDarkMode ? 'bg-white/15' : 'bg-slate-300'
            )} />
          </button>
        </div>

        <div className="space-y-2">
          <SectionLabel label="Forecast" count={`${activeCount} active`} isDarkMode={isDarkMode} accent />

          <ConfigurableLayerGroup
            icon={<Wind size={15} strokeWidth={2} />}
            title="Wind"
            config={windConfig}
            models={WIND_MODELS}
            elements={WIND_ELEMENTS}
            expanded={expandedGroups.wind}
            onToggleExpand={() => onToggleGroup('wind')}
            onToggleEnabled={onToggleWind}
            onSetElement={onSetWindElement}
            onToggleModel={onToggleWindModel}
            onSetBarbStyle={onSetWindBarbStyle}
            isDarkMode={isDarkMode}
          />

          <ConfigurableLayerGroup
            icon={<Waves size={15} strokeWidth={2} />}
            title="Wave"
            config={waveConfig}
            models={WAVE_MODELS}
            elements={WAVE_ELEMENTS}
            expanded={expandedGroups.wave}
            onToggleExpand={() => onToggleGroup('wave')}
            onToggleEnabled={onToggleWave}
            onSetElement={onSetWaveElement}
            onToggleModel={onToggleWaveModel}
            onSetDirectionStyle={onSetWaveDirectionStyle}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(SystemLayersSection);
