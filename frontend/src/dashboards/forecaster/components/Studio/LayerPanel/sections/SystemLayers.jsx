import React from 'react';
import { ChevronDown, Map, Wrench, Satellite, Wind, Waves, Check } from 'lucide-react';
import LayerGroupCard from './SystemLayers/LayerGroupCard';
import CheckboxLayerRow from './SystemLayers/CheckboxLayerRow';
import ConfigurableLayerGroup from './SystemLayers/ConfigurableLayerGroup';
import {
  DOMAIN_LAYERS, UTILITY_LAYERS,
  WIND_MODELS, WAVE_MODELS,
  WIND_ELEMENTS, WAVE_ELEMENTS,
} from '../constants/layerConstants';

const SystemLayersSection = ({
  expanded, onToggleExpand, activeCount,
  expandedGroups, onToggleGroup,
  domainLayers, utilitiesLayers, satelliteLayer,
  windConfig, waveConfig,
  onToggleDomain, onToggleUtility, onToggleSatellite,
  onToggleWind, onSetWindElement, onToggleWindModel,
  onToggleWave, onSetWaveElement, onToggleWaveModel,
  onSetWaveDirectionStyle, onSetWindBarbStyle,
  isDarkMode,
}) => {
  const border  = isDarkMode ? 'border-white/10'  : 'border-black/8';
  const hoverBg = isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/4';
  const textPri = isDarkMode ? 'text-white/90'    : 'text-slate-800';
  const textSec = isDarkMode ? 'text-white/45'    : 'text-slate-400';
  const surface = isDarkMode ? 'bg-white/5'       : 'bg-slate-50';

  return (
    <div className={`px-2 pt-1.5 pb-2 border-t ${border}`}>

      {/* ── Section header ─────────────────────────────── */}
      <button
        onClick={onToggleExpand}
        className={`
          w-full flex items-center justify-between
          px-2 py-2 rounded-lg mb-1 transition-colors ${hoverBg}
        `}
      >
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-medium tracking-wide ${textPri}`}>
            Data Layers
          </span>
          <span className={`
            text-[10px] font-medium px-1.5 py-0.5 rounded
            ${isDarkMode
              ? 'bg-white/8 text-white/40'
              : 'bg-black/6 text-slate-400'}
          `}>
            {activeCount}
          </span>
        </div>
        <ChevronDown
          size={12}
          strokeWidth={2.5}
          className={`transition-transform ${expanded ? 'rotate-180' : ''} ${textSec}`}
        />
      </button>

      {expanded && (
        <div className="space-y-1">

          {/* ── Domains ──────────────────────────────────── */}
          <LayerGroupCard
            icon={<Map size={13} strokeWidth={1.8} />}
            title="Domains"
            badge={Object.values(domainLayers).filter(Boolean).length}
            expanded={expandedGroups.domains}
            onToggle={() => onToggleGroup('domains')}
            isDarkMode={isDarkMode}
          >
            {DOMAIN_LAYERS.map((d) => (
              <CheckboxLayerRow
                key={d.id} {...d}
                active={domainLayers[d.id]}
                onToggle={onToggleDomain}
                isDarkMode={isDarkMode}
              />
            ))}
          </LayerGroupCard>

          {/* ── Utilities ────────────────────────────────── */}
          <LayerGroupCard
            icon={<Wrench size={13} strokeWidth={1.8} />}
            title="Utilities"
            badge={Object.values(utilitiesLayers).filter(Boolean).length}
            expanded={expandedGroups.utilities}
            onToggle={() => onToggleGroup('utilities')}
            isDarkMode={isDarkMode}
          >
            {UTILITY_LAYERS.map((u) => (
              <CheckboxLayerRow
                key={u.id} {...u}
                active={utilitiesLayers[u.id]}
                onToggle={onToggleUtility}
                isDarkMode={isDarkMode}
              />
            ))}
          </LayerGroupCard>

          {/* ── Satellite ────────────────────────────────── */}
          <button
            onClick={onToggleSatellite}
            className={`
              w-full flex items-center justify-between
              px-2.5 py-2 rounded-lg transition-all border
              ${satelliteLayer
                ? isDarkMode
                  ? 'bg-white/8 border-white/15'
                  : 'bg-slate-100 border-black/10'
                : `${surface} border-transparent ${hoverBg}`}
            `}
          >
            <div className="flex items-center gap-2.5">
              <Satellite
                size={13}
                strokeWidth={1.8}
                className={satelliteLayer
                  ? isDarkMode ? 'text-white/80' : 'text-slate-700'
                  : textSec}
              />
              <div className="text-left">
                <div className={`text-[11px] font-medium ${satelliteLayer
                  ? isDarkMode ? 'text-white/85' : 'text-slate-700'
                  : isDarkMode ? 'text-white/50' : 'text-slate-500'
                }`}>
                  Satellite
                </div>
                <div className={`text-[10px] ${textSec}`}>
                  Himawari composite
                </div>
              </div>
            </div>
            <div className={`
              w-1.5 h-1.5 rounded-full flex-shrink-0
              ${satelliteLayer
                ? isDarkMode ? 'bg-white/70' : 'bg-slate-600'
                : isDarkMode ? 'bg-white/15' : 'bg-slate-300'}
            `} />
          </button>

          {/* ── Divider ──────────────────────────────────── */}
          <div className={`h-px mx-1 ${isDarkMode ? 'bg-white/8' : 'bg-black/6'}`} />

          {/* ── Wind ─────────────────────────────────────── */}
          <ConfigurableLayerGroup
            icon={<Wind size={13} strokeWidth={1.8} />}
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
            modelCols={3}
            isDarkMode={isDarkMode}
          />

          {/* ── Wave ─────────────────────────────────────── */}
          <ConfigurableLayerGroup
            icon={<Waves size={13} strokeWidth={1.8} />}
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
            modelCols={2}
            isDarkMode={isDarkMode}
          />

        </div>
      )}
    </div>
  );
};

export default React.memo(SystemLayersSection);