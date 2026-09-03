import React from 'react';
import dayjs from 'dayjs';
import {
  ChevronLeft,
  ChevronRight,
  Link2,
  LoaderCircle,
  Map,
  Satellite,
  Waves,
  Wind,
  Wrench,
} from 'lucide-react';
import { getEcwamFrameStatus } from '@/api/ecwamFrames';
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
import { useProjectData } from '../../Menu/hooks/useProjectData';

const cn = (...classes) => classes.filter(Boolean).join(' ');
const WAVE_SYNC_STORAGE_KEY = 'WAVE_SYNC_FORECAST_HOURS';

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

const ForecastFrameNavigator = ({ model, frame, onStep, isDarkMode }) => {
  if (!model || !frame || !onStep) return null;

  const busy = ['checking', 'building'].includes(frame.state);
  const requestedHour = frame.requestedHour;
  const statusText = busy
    ? `Preparing T+${requestedHour ?? frame.forecastHour}`
    : frame.state === 'ready'
      ? 'Frame ready'
      : frame.message || `3-hour ${model} cadence`;

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
            {model} forecast hour
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
          aria-label={`Previous ${model} forecast hour`}
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
          aria-label={`Next ${model} forecast hour`}
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

const SyncForecastToggle = ({ checked, onChange, isDarkMode }) => (
  <label
    className={cn(
      'flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2',
      isDarkMode
        ? 'border-white/10 bg-white/[0.045] text-white/70'
        : 'border-white/80 bg-white/65 text-slate-700'
    )}
  >
    <span className="flex min-w-0 items-center gap-2">
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
          checked
            ? isDarkMode
              ? 'bg-cyan-400/15 text-cyan-200'
              : 'bg-blue-500/10 text-blue-700'
            : isDarkMode
              ? 'bg-white/[0.06] text-white/35'
              : 'bg-slate-100 text-slate-400'
        )}
      >
        <Link2 size={14} strokeWidth={2.4} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-black">Sync forecast time</span>
        <span
          className={cn(
            'block text-[9px] font-semibold',
            isDarkMode ? 'text-white/35' : 'text-slate-400'
          )}
        >
          Step all selected wave models together
        </span>
      </span>
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 shrink-0 accent-cyan-500"
    />
  </label>
);

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
  const { forecastDate } = useProjectData();
  const domainCount = countActiveByDefinition(DOMAIN_LAYERS, domainLayers);
  const utilityCount = countActiveByDefinition(UTILITY_LAYERS, utilitiesLayers);
  const satelliteOverlayCount =
    (satelliteLayer ? 1 : 0) + countActiveByDefinition(SATELLITE_OVERLAY_LAYERS, utilitiesLayers);
  const referenceCount = domainCount + utilityCount + satelliteOverlayCount;
  const showWW3Navigator = waveConfig?.models?.includes('WW3');
  const showEcwamNavigator = waveConfig?.models?.includes('ECWAM');
  const multipleWaveNavigators = showWW3Navigator && showEcwamNavigator;
  const ecwamForecastHour = waveConfig?.ecwamFrame?.forecastHour ?? 0;
  const [syncForecastTime, setSyncForecastTime] = React.useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(WAVE_SYNC_STORAGE_KEY) !== 'false';
  });
  const [ecwamAvailability, setEcwamAvailability] = React.useState({
    state: 'checking',
    message: null,
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(WAVE_SYNC_STORAGE_KEY, String(syncForecastTime));
    }
  }, [syncForecastTime]);

  React.useEffect(() => {
    const parsed = dayjs(forecastDate);
    const packageDate = parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
    let disposed = false;
    let firstCheck = true;

    const checkAvailability = async () => {
      await Promise.resolve();
      if (disposed) return;

      if (!packageDate) {
        setEcwamAvailability({
          state: 'unavailable',
          message: 'Forecast package date is not available.',
        });
        return;
      }

      if (firstCheck) {
        setEcwamAvailability({ state: 'checking', message: null });
        firstCheck = false;
      }

      try {
        const result = await getEcwamFrameStatus(packageDate, ecwamForecastHour);
        if (!disposed) setEcwamAvailability(result);
      } catch (error) {
        if (!disposed) {
          setEcwamAvailability({
            state: 'failed',
            message: error?.message || 'Unable to check ECWAM readiness.',
          });
        }
      }
    };

    void checkAvailability();
    const intervalId = packageDate ? window.setInterval(checkAvailability, 60_000) : null;

    return () => {
      disposed = true;
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [ecwamForecastHour, forecastDate]);

  const waveModelStatuses = React.useMemo(() => {
    const selectedEcwamState = showEcwamNavigator ? waveConfig?.ecwamFrame : null;
    const effectiveStatus =
      selectedEcwamState && selectedEcwamState.state !== 'idle'
        ? selectedEcwamState
        : ecwamAvailability;

    if (effectiveStatus?.state === 'ready') {
      return {
        ECWAM: {
          state: 'ready',
          label: 'Ready',
          detail: showEcwamNavigator ? 'Visible in map stack' : 'Available',
          selectable: true,
        },
      };
    }

    if (
      ['checking', 'building', 'available', 'busy', 'unavailable'].includes(effectiveStatus?.state)
    ) {
      return {
        ECWAM: {
          state: 'processing',
          label: 'Processing',
          detail: effectiveStatus?.message || 'Checking forecast data',
          selectable: false,
        },
      };
    }

    return {
      ECWAM: {
        state: 'unavailable',
        label: 'No data',
        detail: effectiveStatus?.message || 'Forecast data is not available.',
        selectable: false,
      },
    };
  }, [ecwamAvailability, showEcwamNavigator, waveConfig?.ecwamFrame]);

  const stepSingleModel = React.useCallback(
    (model, direction) => {
      if (model === 'WW3') return waveConfig.stepWW3ForecastHour?.(direction);
      if (model === 'ECWAM') return waveConfig.stepEcwamForecastHour?.(direction);
      return { state: 'invalid' };
    },
    [waveConfig]
  );

  const stepSyncedModels = React.useCallback(
    async (sourceModel, direction) => {
      if (!syncForecastTime || !multipleWaveNavigators) {
        return stepSingleModel(sourceModel, direction);
      }

      const sourceFrame = sourceModel === 'ECWAM' ? waveConfig.ecwamFrame : waveConfig.ww3Frame;
      const sourceHours = sourceFrame?.availableHours || [];
      const currentIndex = sourceHours.indexOf(sourceFrame?.forecastHour);
      if (currentIndex < 0) return { state: 'invalid' };

      const nextIndex = Math.min(
        sourceHours.length - 1,
        Math.max(0, currentIndex + Math.sign(direction))
      );
      const targetHour = sourceHours[nextIndex];
      if (targetHour === sourceFrame.forecastHour) {
        return { state: 'ready', forecastHour: targetHour };
      }

      const ww3SupportsTarget = waveConfig.ww3Frame?.availableHours?.includes(targetHour);
      const ecwamSupportsTarget = waveConfig.ecwamFrame?.availableHours?.includes(targetHour);
      if (!ww3SupportsTarget || !ecwamSupportsTarget) {
        return {
          state: 'invalid',
          message: `T+${targetHour} is not available in every selected wave model.`,
        };
      }

      const ecwamResult = await waveConfig.setEcwamForecastHour?.(targetHour);
      if (ecwamResult?.state !== 'ready') return ecwamResult;

      const ww3Result = waveConfig.setWW3ForecastHour?.(targetHour);
      return ww3Result || ecwamResult;
    },
    [multipleWaveNavigators, stepSingleModel, syncForecastTime, waveConfig]
  );

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
            modelStatuses={waveModelStatuses}
            afterModelSelector={
              showWW3Navigator || showEcwamNavigator ? (
                <div className="space-y-2">
                  {multipleWaveNavigators && (
                    <SyncForecastToggle
                      checked={syncForecastTime}
                      onChange={setSyncForecastTime}
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {showWW3Navigator && (
                    <ForecastFrameNavigator
                      model="WW3"
                      frame={waveConfig.ww3Frame}
                      onStep={(direction) => stepSyncedModels('WW3', direction)}
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {showEcwamNavigator && (
                    <ForecastFrameNavigator
                      model="ECWAM"
                      frame={waveConfig.ecwamFrame}
                      onStep={(direction) => stepSyncedModels('ECWAM', direction)}
                      isDarkMode={isDarkMode}
                    />
                  )}
                </div>
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
