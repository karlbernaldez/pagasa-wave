import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Save, Waves } from 'lucide-react';

import { fetchWaveModels, setWaveModelRuntimeProfile } from '@/api/waveModels';

const cn = (...classes) => classes.filter(Boolean).join(' ');
const DEFAULT_PROFILE = {
  mode: 'managed_timestamp',
  cycleDayOffset: -1,
  cycleHourUtc: 18,
  forecastCadenceHours: 3,
  maxForecastHour: 60,
  rasterScheme: 'xyz',
  bounds: [100, -5, 180, 50],
  contoursEnabled: false,
};

const normalizeError = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const profileFromModel = (model) => ({
  ...DEFAULT_PROFILE,
  ...(model?.runtimeProfile || {}),
  bounds: model?.runtimeProfile?.bounds || DEFAULT_PROFILE.bounds,
});

export default function WaveModelOnboarding({ isDarkMode }) {
  const [models, setModels] = useState([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const onboardableModels = useMemo(
    () => models.filter((model) => !['WW3', 'ECWAM'].includes(model.code)),
    [models]
  );
  const selectedModel = useMemo(
    () => onboardableModels.find((model) => model.code === selectedCode) || null,
    [onboardableModels, selectedCode]
  );

  const applyLoadedModels = (nextModels) => {
    setModels(nextModels);
    const candidates = nextModels.filter((model) => !['WW3', 'ECWAM'].includes(model.code));
    const nextCode = candidates.some((model) => model.code === selectedCode)
      ? selectedCode
      : candidates[0]?.code || '';
    setSelectedCode(nextCode);
    setProfile(profileFromModel(candidates.find((model) => model.code === nextCode)));
  };

  const loadModels = async () => {
    setLoading(true);
    try {
      const result = await fetchWaveModels();
      applyLoadedModels(result?.models || []);
      setMessage(null);
    } catch (error) {
      setMessage({ type: 'error', text: normalizeError(error, 'Unable to load wave models.') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    fetchWaveModels()
      .then((result) => {
        if (!active) return;
        const nextModels = result?.models || [];
        setModels(nextModels);
        const candidates = nextModels.filter((model) => !['WW3', 'ECWAM'].includes(model.code));
        const nextCode = candidates[0]?.code || '';
        setSelectedCode(nextCode);
        setProfile(profileFromModel(candidates[0]));
        setMessage(null);
      })
      .catch((error) => {
        if (!active) return;
        setMessage({
          type: 'error',
          text: normalizeError(error, 'Unable to load wave models.'),
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const chooseModel = (code) => {
    setSelectedCode(code);
    setProfile(profileFromModel(onboardableModels.find((model) => model.code === code)));
    setMessage(null);
  };

  const updateNumber = (key, value) =>
    setProfile((current) => ({ ...current, [key]: Number(value) }));

  const updateBound = (index, value) =>
    setProfile((current) => ({
      ...current,
      bounds: current.bounds.map((entry, entryIndex) =>
        entryIndex === index ? Number(value) : entry
      ),
    }));

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!selectedModel) return;
    setSaving(true);
    try {
      await setWaveModelRuntimeProfile(selectedModel.code, profile);
      await loadModels();
      setMessage({
        type: 'success',
        text: `${selectedModel.code} runtime profile is configured. Add a valid managed package before enabling it for forecasters.`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: normalizeError(error, 'Unable to save the runtime profile.'),
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = cn(
    'min-h-10 w-full rounded-xl border px-3 py-2 text-sm outline-none',
    isDarkMode
      ? 'border-white/10 bg-white/[0.04] text-white'
      : 'border-slate-200 bg-white text-slate-900'
  );

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 p-4 sm:p-6">
      {message && (
        <div
          role="status"
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-semibold',
            message.type === 'error'
              ? isDarkMode
                ? 'border-red-300/20 bg-red-400/10 text-red-200'
                : 'border-red-200 bg-red-50 text-red-800'
              : isDarkMode
                ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          )}
        >
          {message.text}
        </div>
      )}

      <section
        className={cn(
          'rounded-2xl border p-5 shadow-xl backdrop-blur-xl',
          isDarkMode
            ? 'border-white/10 bg-slate-950/50 shadow-black/20'
            : 'border-white/70 bg-white/70 shadow-slate-300/40'
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span
              className={cn(
                'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
              )}
            >
              <Waves size={21} />
            </span>
            <div>
              <h2
                className={cn(
                  'text-lg font-black',
                  isDarkMode ? 'text-white' : 'text-slate-950'
                )}
              >
                Managed model onboarding
              </h2>
              <p
                className={cn(
                  'mt-1 max-w-2xl text-sm',
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Configure a prebuilt model to use WaveLab&apos;s standard timestamp package layout.
                This does not create an importer, builder service, or shell command.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadModels()}
            disabled={loading}
            className={cn(
              'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black disabled:opacity-50',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-300'
                : 'border-slate-200 bg-white text-slate-700'
            )}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </section>

      <section
        className={cn(
          'rounded-2xl border p-5 shadow-xl backdrop-blur-xl',
          isDarkMode
            ? 'border-white/10 bg-slate-950/50 shadow-black/20'
            : 'border-white/70 bg-white/70 shadow-slate-300/40'
        )}
      >
        {loading ? (
          <div
            className={cn(
              'flex min-h-40 items-center justify-center',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            <Loader2 size={18} className="mr-2 animate-spin" /> Loading model registry…
          </div>
        ) : onboardableModels.length === 0 ? (
          <div
            className={cn(
              'py-8 text-center',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            <AlertTriangle size={24} className="mx-auto mb-2" />
            <p className="font-black">No models are available for managed onboarding.</p>
            <p className="mt-1 text-sm">Register a custom model from Wave Models first.</p>
          </div>
        ) : (
          <form onSubmit={saveProfile} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span
                  className={cn(
                    'text-xs font-black',
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  )}
                >
                  Model
                </span>
                <select
                  value={selectedCode}
                  onChange={(event) => chooseModel(event.target.value)}
                  className={inputClass}
                >
                  {onboardableModels.map((model) => (
                    <option key={model.code} value={model.code}>
                      {model.label} ({model.code})
                    </option>
                  ))}
                </select>
              </label>
              <div
                className={cn(
                  'rounded-xl border px-4 py-3',
                  isDarkMode
                    ? 'border-white/10 bg-white/[0.025]'
                    : 'border-slate-200 bg-slate-50'
                )}
              >
                <p
                  className={cn(
                    'text-xs font-black',
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  )}
                >
                  Current readiness
                </p>
                <p
                  className={cn(
                    'mt-1 text-xs',
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  )}
                >
                  Runtime: {selectedModel?.runtimeConfigured ? 'Configured' : 'Not configured'} · Data:{' '}
                  {selectedModel?.hasData ? 'Present' : 'No managed package'} · Access:{' '}
                  {selectedModel?.enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1.5">
                <span
                  className={cn(
                    'text-xs font-black',
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  )}
                >
                  Cycle day offset
                </span>
                <input
                  type="number"
                  min="-2"
                  max="1"
                  value={profile.cycleDayOffset}
                  onChange={(event) => updateNumber('cycleDayOffset', event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="space-y-1.5">
                <span
                  className={cn(
                    'text-xs font-black',
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  )}
                >
                  Cycle hour UTC
                </span>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={profile.cycleHourUtc}
                  onChange={(event) => updateNumber('cycleHourUtc', event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="space-y-1.5">
                <span
                  className={cn(
                    'text-xs font-black',
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  )}
                >
                  Forecast cadence (h)
                </span>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={profile.forecastCadenceHours}
                  onChange={(event) => updateNumber('forecastCadenceHours', event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="space-y-1.5">
                <span
                  className={cn(
                    'text-xs font-black',
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  )}
                >
                  Maximum forecast hour
                </span>
                <input
                  type="number"
                  min="0"
                  max="240"
                  value={profile.maxForecastHour}
                  onChange={(event) => updateNumber('maxForecastHour', event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[0.5fr_1.5fr]">
              <label className="space-y-1.5">
                <span
                  className={cn(
                    'text-xs font-black',
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  )}
                >
                  Raster scheme
                </span>
                <select
                  value={profile.rasterScheme}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      rasterScheme: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="xyz">XYZ</option>
                  <option value="tms">TMS</option>
                </select>
              </label>
              <div>
                <span
                  className={cn(
                    'text-xs font-black',
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  )}
                >
                  Raster bounds (west, south, east, north)
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {profile.bounds.map((value, index) => (
                    <input
                      key={index}
                      type="number"
                      step="any"
                      value={value}
                      onChange={(event) => updateBound(index, event.target.value)}
                      className={inputClass}
                      aria-label={[
                        'West longitude',
                        'South latitude',
                        'East longitude',
                        'North latitude',
                      ][index]}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div
              className={cn(
                'rounded-xl border px-4 py-3 text-xs',
                isDarkMode
                  ? 'border-cyan-300/15 bg-cyan-400/5 text-slate-300'
                  : 'border-cyan-100 bg-cyan-50/60 text-slate-700'
              )}
            >
              <p className="font-black">Required package layout</p>
              <code className="mt-1 block break-all font-mono">
                /wavetiles/{selectedModel?.code || 'MODEL'}
                /light/YYYYMONDD/YYYYMMDDHH/&#123;z&#125;/&#123;x&#125;/&#123;y&#125;.png
              </code>
              <code className="mt-1 block break-all font-mono">
                /wavetiles/{selectedModel?.code || 'MODEL'}
                /dark/YYYYMONDD/YYYYMMDDHH/&#123;z&#125;/&#123;x&#125;/&#123;y&#125;.png
              </code>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                className={cn(
                  'inline-flex items-center gap-2 text-xs',
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                <CheckCircle2 size={14} className="text-emerald-500" />
                Saving this profile does not enable the model automatically.
              </p>
              <button
                type="submit"
                disabled={!selectedModel || saving}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-cyan-600/20 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save Runtime Profile
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
