import { Activity, Cable, Database, ShieldCheck } from 'lucide-react';

import WaveModelsSection from './WaveModels';
import { ADMIN_TABS } from '@dashboards/admin/constants/navigation';

const cn = (...classes) => classes.filter(Boolean).join(' ');

function ArchitectureCard({ icon: Icon, title, description, actionLabel, onAction, isDarkMode }) {
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

export default function WaveModelManagement({ isDarkMode = true, onSelectTab }) {
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
                Wave Model Management controls model availability, model-specific configuration,
                supervised builder actions, and generated package inventory. Normalization,
                validation, and publication remain system-managed and are monitored separately in
                Wave Pipeline.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-2">
          <ArchitectureCard
            icon={Activity}
            title="Operational models"
            description="WW3 and ECWAM use dedicated source selection, adapters, normalized processing, validation, and publication. Preferred source-cycle settings are now managed inside each model's Configuration tab."
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
          Package deletion is limited to packages older than the configured retention window and is
          verified again by the backend before filesystem removal.
        </div>
      </div>

      <WaveModelsSection isDarkMode={isDarkMode} />
    </div>
  );
}
