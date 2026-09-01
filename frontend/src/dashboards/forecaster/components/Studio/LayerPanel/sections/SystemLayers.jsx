import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Map,
  Satellite,
  Waves,
  Wind,
  Wrench,
} from 'lucide-react';
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
    <span
      className={cn(
        'text-[10px] font-black uppercase tracking-wide',
        isDarkMode ? 'text-white/35' : 'text-slate-400'
      )}
    >
      {label}
    </span>
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[9px] font-black',
        accent
          ? isDarkMode
            ? 'bg-cyan-400/10 text-cyan-200'
            : 'bg-blue-500/10 text-blue-700'
          : isDarkMode
            ? 'bg-white/[0.08] text-white/35'
            : 'bg-slate-100 text-slate-500'
      )}
    >
      {count}
    </span>
  </div>
);

const EcwamFrameNavigator = ({ frame, onStep, isDarkMode }) => {
  if (!frame || !onStep) return null;

  const busy = ['checking', 'building'].includes(frame.state);
  const requestedHour = frame.requestedHour;
  const statusText = busy
    ? `Preparing T+${requestedHour ?? frame.forecastHour}`
    : frame.state === 'ready'
      ? 'Frame ready'
      : frame.message || 'Hourly ECWAM cache';

  return (
    <div
      className={cn(
        'rounded-xl border p-2.5',
        isDarkMode ? 'border-cyan-400/15 bg-cyan-400/[0.04]' : 'border-blue-200/70 bg-blue-50/60'
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div
            className={cn(
              'text-[10px] font-black uppercase tracking-wide',
              isDarkMode ? 'text-cyan-200/70' : 'text-blue-700'
            )}
          >
            ECWAM forecast hour
          </div>
          <div
            className={cn(
              'truncate text-[10px] font-semibold',
              frame.message && !busy
                ? 'text-amber-500'
                : isDarkMode
                  ? 'text-white/40'
                  : 'text-slate-500'
            )}
          >
            {statusText}
          </div>
        </div>
        {busy && <LoaderCircle size={14} className="shrink-0 animate-spin text-cyan-400" />}
      </div>

      <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2">
        <button
          type="button"
          onClick={() => onStep(-1)}
          disabled={busy || frame.forecastHour <= frame.minHour}
          aria-label="Previous ECWAM forecast hour"
          className={cn(
            'flex h-9 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-35',
            isDarkMode
              ? 'border-white/10 bg-white/[0.05] text-white/70 hover:bg-white/[0.09]'
              : 'border-white bg-white/80 text-slate-600 hover:bg-white'
          )}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        <div
          className={cn(
            'flex h-9 items-center justify-center rounded-lg border text-sm font-black tabular-nums',
            isDarkMode
              ? 'border-cyan-400/20 bg-slate-950/30 text-cyan-200'
              : 'border-blue-200/80 bg-white/85 text-blue-700'
          )}
        >
          T+{frame.forecastHour}
        </div>

        <button
          type="button"
          onClick={() => onStep(1)}
          disabled={busy || frame.forecastHour >= frame.maxHour}
          aria-label="Next ECWAM forecast hour"
          className={cn(
            'flex h-9 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-35',
            isDarkMode
              ? 'border-white/10 bg-white/[0.05] text-white/70 hover:bg-white/[0.09]'
              : 'border-white bg-white/80 text-slate-600 hover:bg-white'
          )}
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

const countActiveByDefinition = (definitions, state) =>
  definitions.filter((layer) => state[layer.id]).length;

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
  const domainCount = countActiveByDefinition(DOMAIN_LAYERS, domainLayers);
  const utilityCount = countActiveByDefinition(UTILITY_LAYERS, utilitiesLayers);
  const satelliteOverlayCount =
    (satelliteLayer ? 1 : 0) + countActiveByDefinition(SATELLITE_OVERLAY_LAYERS, utilitiesLayers);
  const referenceCount = domainCount + utilityCount + satelliteOverlayCount;
  const showEcwamNavigator = waveConfig?.models?.includes('ECWAM');

  if (!expanded) return null;

  return (
    <div className="px-3 pb-3 pt-3">
      <div className="space-y-3">
        <div className="space-y-2">
          <SectionLabel label="Reference" count={referenceCount} isDarkMode={isDarkMode} />

          <LayerGroupCard
            icon={<Map size={15} strokeWidth={2} />}
            title="Domains"
            badge={domainCount}
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
          <SectionLabel
            label="Forecast"
            count={`${activeCount} active`}
            isDarkMode={isDarkMode}
            accent
          />

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
            afterModelSelector={
              showEcwamNavigator ? (
                <EcwamFrameNavigator
                  frame={waveConfig.ecwamFrame}
                  onStep={waveConfig.stepEcwamForecastHour}
                  isDarkMode={isDarkMode}
                />
              ) : null
            }
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(SystemLayersSection);
