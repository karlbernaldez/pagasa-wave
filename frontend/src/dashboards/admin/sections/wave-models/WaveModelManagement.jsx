import { useEffect, useState } from 'react';
import { Activity, Cable, Clock3, Database, Loader2, ShieldCheck } from 'lucide-react';

import { fetchWaveSourceCyclePolicy, setWaveSourceCyclePolicy } from '@/api/waveModels';
import WaveModelsSection from './WaveModels';
import { ADMIN_TABS } from '@dashboards/admin/constants/navigation';

const cn = (...classes) => classes.filter(Boolean).join(' ');
const OPERATIONAL_MODELS = ['WW3', 'ECWAM'];

function ArchitectureCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  isDarkMode,
}) {
  return (
    <article
      className={cn(
        'rounded-2xl border p-4 shadow-xl backdrop-blur-xl',
        isDarkMode
          ? 'border-white/10 bg-slate-950/50 shadow-black/20'
          : 'border-white/70 bg-white/70 shadow-slate-300/40'
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
            isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
          )}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            {title}
          </p>
          <p
            className={cn(
              'mt-1 text-xs font-semibold leading-relaxed',
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {description}
          </p>
          <button
            type="button"
            onClick={onAction}
            className={cn(
              'mt-3 inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition-colors',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-cyan-200 hover:bg-white/[0.08]'
                : 'border-slate-200 bg-white text-cyan-700 hover:bg-cyan-50'
            )}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

function SourceCycleSelector({ model, policy, busy, isDarkMode, onChange }) {
  const allowed = policy?.allowedHoursUtc || [0, 6, 12, 18];
  const value = policy?.preferredHourUtc ?? 18;

  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-slate-200 bg-white/80'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            {model}
          </p>
          <p
            className={cn('mt-1 text-[11px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}
          >
            Preferred source cycle for the Manila package date
          </p>
        </div>
        {busy && <Loader2 size={15} className="animate-spin text-cyan-500" />}
      </div>
      <label className="mt-3 block">
        <span
          className={cn(
            'text-[10px] font-black uppercase tracking-wide',
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          )}
        >
          Preferred cycle
        </span>
        <select
          value={value}
          disabled={busy || !policy}
          onChange={(event) => onChange(model, Number(event.target.value))}
          className={cn(
            'mt-1 min-h-10 w-full rounded-xl border px-3 py-2 text-sm font-black outline-none disabled:opacity-60',
            isDarkMode
              ? 'border-white/10 bg-slate-950 text-white'
              : 'border-slate-200 bg-white text-slate-900'
          )}
        >
          {allowed.map((hour) => (
            <option key={hour} value={hour}>
              {String(hour).padStart(2, '0')}Z
            </option>
          ))}
        </select>
      </label>
      <p className={cn('mt-2 text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
        Default is 18Z. Fallback remains disabled; WaveLab waits for the selected cycle to become
        complete.
      </p>
    </div>
  );
}

export default function WaveModelManagement({ isDarkMode = true, onSelectTab }) {
  const [policies, setPolicies] = useState({});
  const [policyBusy, setPolicyBusy] = useState('');
  const [policyMessage, setPolicyMessage] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all(
      OPERATIONAL_MODELS.map(async (model) => {
        const result = await fetchWaveSourceCyclePolicy(model);
        return [model, result.policy];
      })
    )
      .then((entries) => {
        if (!active) return;
        setPolicies(Object.fromEntries(entries));
      })
      .catch((error) => {
        if (!active) return;
        setPolicyMessage({
          type: 'error',
          text:
            error?.response?.data?.message ||
            error?.message ||
            'Unable to load source cycle policy.',
        });
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCycleChange = async (model, preferredHourUtc) => {
    const currentHour = policies[model]?.preferredHourUtc ?? 18;
    if (preferredHourUtc === currentHour) return;

    const nextLabel = `${String(preferredHourUtc).padStart(2, '0')}Z`;
    const confirmed = window.confirm(
      `Change ${model} preferred source cycle to ${nextLabel}? This takes effect immediately for package selection. If today's published package was built from another cycle, Wave Pipeline may show waiting until the selected cycle is built and published.`
    );
    if (!confirmed) return;

    setPolicyBusy(model);
    setPolicyMessage(null);
    try {
      const result = await setWaveSourceCyclePolicy(model, preferredHourUtc);
      setPolicies((current) => ({ ...current, [model]: result.policy }));
      setPolicyMessage({
        type: 'success',
        text: `${model} preferred source cycle is now ${nextLabel}.`,
      });
    } catch (error) {
      setPolicyMessage({
        type: 'error',
        text:
          error?.response?.data?.message ||
          error?.message ||
          'Unable to update source cycle policy.',
      });
    } finally {
      setPolicyBusy('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="mx-auto max-w-[1500px] px-4 pt-4 sm:px-6 sm:pt-6">
        <section
          className={cn(
            'rounded-2xl border p-4 shadow-xl backdrop-blur-xl',
            isDarkMode
              ? 'border-cyan-300/15 bg-cyan-400/[0.06] shadow-black/20'
              : 'border-cyan-100 bg-cyan-50/70 shadow-slate-300/30'
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-white text-cyan-700'
              )}
            >
              <ShieldCheck size={19} />
            </span>
            <div>
              <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
                Management boundaries
              </p>
              <p
                className={cn(
                  'mt-1 max-w-4xl text-xs font-semibold leading-relaxed',
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                Wave Model Management controls model availability, source-cycle preference,
                supervised builder actions, and generated package inventory. Normalization,
                validation, and publication remain system-managed and are monitored separately in
                Wave Pipeline.
              </p>
            </div>
          </div>
        </section>

        <section
          className={cn(
            'mt-4 rounded-2xl border p-4 shadow-xl backdrop-blur-xl',
            isDarkMode
              ? 'border-white/10 bg-slate-950/50 shadow-black/20'
              : 'border-white/70 bg-white/70 shadow-slate-300/40'
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
              )}
            >
              <Clock3 size={18} />
            </span>
            <div>
              <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
                Operational source cycle
              </p>
              <p className={cn('mt-1 text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                Select the preferred UTC source cycle. 18Z remains the default operational policy.
              </p>
            </div>
          </div>

          {policyMessage && (
            <div
              role="status"
              className={cn(
                'mt-3 rounded-xl border px-3 py-2 text-xs font-semibold',
                policyMessage.type === 'error'
                  ? isDarkMode
                    ? 'border-red-300/20 bg-red-400/10 text-red-200'
                    : 'border-red-200 bg-red-50 text-red-800'
                  : isDarkMode
                    ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              )}
            >
              {policyMessage.text}
            </div>
          )}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {OPERATIONAL_MODELS.map((model) => (
              <SourceCycleSelector
                key={model}
                model={model}
                policy={policies[model]}
                busy={policyBusy === model}
                isDarkMode={isDarkMode}
                onChange={handleCycleChange}
              />
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-2">
          <ArchitectureCard
            icon={Activity}
            title="Operational models"
            description="WW3 and ECWAM use dedicated source selection, adapters, normalized processing, validation, and publication. Use the Wave Pipeline view for current lifecycle state and publication readiness."
            actionLabel="Open Wave Pipeline"
            onAction={() => onSelectTab?.(ADMIN_TABS.WAVE_PIPELINE)}
            isDarkMode={isDarkMode}
          />
          <ArchitectureCard
            icon={Cable}
            title="Onboarded models"
            description="Registered model definitions use the managed onboarding path for runtime profile, forecast cadence, timestamp rules, and map metadata. They do not inherit the dedicated WW3/ECWAM ingestion workflow."
            actionLabel="Open Model Onboarding"
            onAction={() => onSelectTab?.(ADMIN_TABS.WAVE_MODEL_ONBOARDING)}
            isDarkMode={isDarkMode}
          />
        </section>

        <div
          className={cn(
            'mt-4 flex items-center gap-2 text-[11px] font-semibold',
            isDarkMode ? 'text-slate-500' : 'text-slate-500'
          )}
        >
          <Database size={13} />
          Source-cycle changes take effect immediately for new package selection. Existing files are
          not rewritten automatically.
        </div>
      </div>

      <WaveModelsSection isDarkMode={isDarkMode} />
    </div>
  );
}
