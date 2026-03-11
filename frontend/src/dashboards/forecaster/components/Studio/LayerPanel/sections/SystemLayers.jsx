import React from 'react';
import { ChevronDown } from 'lucide-react';
import LayerGroupCard from './SystemLayers/LayerGroupCard';
import CheckboxLayerRow from './SystemLayers/CheckboxLayerRow';
import ConfigurableLayerGroup from './SystemLayers/ConfigurableLayerGroup';
import { DOMAIN_LAYERS, UTILITY_LAYERS, WIND_MODELS, WAVE_MODELS, WIND_ELEMENTS, WAVE_ELEMENTS } from '../constants/layerConstants';

const SystemLayersSection = ({
  expanded, onToggleExpand, activeCount,
  expandedGroups, onToggleGroup,
  domainLayers, utilitiesLayers, satelliteLayer,
  windConfig, waveConfig,
  onToggleDomain, onToggleUtility, onToggleSatellite,
  onToggleWind, onSetWindElement, onToggleWindModel,
  onToggleWave, onSetWaveElement, onToggleWaveModel,
  isDarkMode,
}) => (
  <div className={`px-2.5 pt-2 pb-2.5 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
    {/* Section header */}
    <button
      onClick={onToggleExpand}
      className={`w-full flex items-center justify-between px-1.5 py-1.5 rounded-lg mb-1.5 transition-colors ${
        isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`text-[11px] font-bold ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>
          Data Layers
        </span>
        <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
          isDarkMode ? 'bg-white/10 text-white/55' : 'bg-black/10 text-slate-500'
        }`}>
          {activeCount}
        </div>
      </div>
      <ChevronDown
        size={11}
        strokeWidth={3}
        className={`transition-transform ${expanded ? 'rotate-180' : ''} ${
          isDarkMode ? 'text-white/50' : 'text-slate-500'
        }`}
      />
    </button>

    {expanded && (
      <div className="space-y-1.5">
        {/* ── Domains ────────────────────────────────────────────────────── */}
        <LayerGroupCard
          emoji="🗺️"
          title="Domains"
          badge={Object.values(domainLayers).filter(Boolean).length}
          expanded={expandedGroups.domains}
          onToggle={() => onToggleGroup('domains')}
          isDarkMode={isDarkMode}
          compact
        >
          {DOMAIN_LAYERS.map((d) => (
            <CheckboxLayerRow
              key={d.id}
              {...d}
              active={domainLayers[d.id]}
              onToggle={onToggleDomain}
              isDarkMode={isDarkMode}
              compact
            />
          ))}
        </LayerGroupCard>

        {/* ── Utilities ──────────────────────────────────────────────────── */}
        <LayerGroupCard
          emoji="🛠️"
          title="Utilities"
          badge={Object.values(utilitiesLayers).filter(Boolean).length}
          expanded={expandedGroups.utilities}
          onToggle={() => onToggleGroup('utilities')}
          isDarkMode={isDarkMode}
          compact
        >
          {UTILITY_LAYERS.map((u) => (
            <CheckboxLayerRow
              key={u.id}
              {...u}
              active={utilitiesLayers[u.id]}
              onToggle={onToggleUtility}
              isDarkMode={isDarkMode}
              compact
            />
          ))}
        </LayerGroupCard>

        {/* ── Satellite ──────────────────────────────────────────────────── */}
        <button
          onClick={onToggleSatellite}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${
            satelliteLayer
              ? isDarkMode
                ? 'bg-cyan-400/10 border border-cyan-400/30'
                : 'bg-blue-500/10 border border-blue-500/30'
              : isDarkMode
                ? 'bg-white/5 hover:bg-white/10 border border-transparent'
                : 'bg-black/5 hover:bg-black/10 border border-transparent'
          }`}
        >
          <span className="text-sm leading-none flex-shrink-0">🛰️</span>
          <div className="flex-1 text-left min-w-0">
            <div className={`text-[11px] font-semibold truncate ${
              satelliteLayer
                ? isDarkMode ? 'text-cyan-300' : 'text-blue-700'
                : isDarkMode ? 'text-white/75' : 'text-slate-700'
            }`}>
              Satellite
            </div>
            <div className={`text-[9px] font-medium truncate ${isDarkMode ? 'text-white/35' : 'text-slate-400'}`}>
              Himawari Satellite Image
            </div>
          </div>
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            satelliteLayer
              ? isDarkMode ? 'bg-cyan-400' : 'bg-blue-600'
              : isDarkMode ? 'bg-white/20' : 'bg-slate-300'
          }`} />
        </button>

        {/* ── Wind ───────────────────────────────────────────────────────── */}
        <ConfigurableLayerGroup
          emoji="💨"
          title="Wind"
          config={windConfig}
          models={WIND_MODELS}
          elements={WIND_ELEMENTS}
          expanded={expandedGroups.wind}
          onToggleExpand={() => onToggleGroup('wind')}
          onToggleEnabled={onToggleWind}
          onSetElement={onSetWindElement}
          onToggleModel={onToggleWindModel}
          modelCols={3}
          isDarkMode={isDarkMode}
          compact
        />

        {/* ── Wave ───────────────────────────────────────────────────────── */}
        <ConfigurableLayerGroup
          emoji="🌊"
          title="Wave"
          config={waveConfig}
          models={WAVE_MODELS}
          elements={WAVE_ELEMENTS}
          expanded={expandedGroups.wave}
          onToggleExpand={() => onToggleGroup('wave')}
          onToggleEnabled={onToggleWave}
          onSetElement={onSetWaveElement}
          onToggleModel={onToggleWaveModel}
          modelCols={2}
          isDarkMode={isDarkMode}
          compact
        />
      </div>
    )}
  </div>
);

export default React.memo(SystemLayersSection);