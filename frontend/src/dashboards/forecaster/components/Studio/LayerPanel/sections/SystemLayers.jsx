import React from 'react';
import { Map, Satellite, Waves, Wind, Wrench } from 'lucide-react';
import LayerGroupCard from './SystemLayers/LayerGroupCard';
import CheckboxLayerRow from './SystemLayers/CheckboxLayerRow';
import ConfigurableLayerGroup from './SystemLayers/ConfigurableLayerGroup';
import {
  DOMAIN_LAYERS,
  UTILITY_LAYERS,
  SATELLITE_OVERLAY_LAYERS,
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
        : isDarkMode ? 'bg-white/[0.08] text-white/35' : 'bg-slate-100 text-slate-500'
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
  const utilityCount = Object.values(utilitiesLayers).filter(Boolean).length;
  const satelliteOverlayCount =
    (satelliteLayer ? 1 : 0) +
    SATELLITE_OVERLAY_LAYERS.filter((layer) => utilitiesLayers[layer.id]).length;
  const referenceCount =
    Object.values(domainLayers).filter(Boolean).length +
    utilityCount +
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
            badge={utilityCount}
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

          <LayerGroupCard
            icon={<Satellite size={15} strokeWidth={2} />}
            title="Satellite"
            badge={satelliteOverlayCount}
            expanded={expandedGroups.satellite}
            onToggle={() => onToggleGroup('satellite')}
            isDarkMode={isDarkMode}
          >
            <CheckboxLayerRow
              id="SATELLITE"
              name="Satellite"
              subtitle="Himawari composite"
              active={satelliteLayer}
              onToggle={onToggleSatellite}
              isDarkMode={isDarkMode}
            />
            {SATELLITE_OVERLAY_LAYERS.map((layer) => (
              <CheckboxLayerRow
                key={layer.id}
                {...layer}
                active={utilitiesLayers[layer.id]}
                onToggle={onToggleUtility}
                isDarkMode={isDarkMode}
              />
            ))}
          </LayerGroupCard>
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
