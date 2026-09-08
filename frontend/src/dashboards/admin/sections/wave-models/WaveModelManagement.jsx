import { Activity, Cable } from 'lucide-react';

import WaveModelsSection from './WaveModels';
import { ADMIN_TABS } from '@dashboards/admin/constants/navigation';

const cn = (...classes) => classes.filter(Boolean).join(' ');

function QuickLink({ icon: Icon, label, helper, onClick, isDarkMode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={helper}
      className={cn(
        'inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition-colors',
        isDarkMode
          ? 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-cyan-300/20 hover:bg-cyan-400/[0.07] hover:text-cyan-200'
          : 'border-slate-200 bg-white/70 text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700'
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

export default function WaveModelManagement({ isDarkMode = true, onSelectTab }) {
  return (
    <div className="space-y-2">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-end gap-2 px-4 pt-3 sm:px-6 sm:pt-4">
        <QuickLink
          icon={Activity}
          label="Wave Pipeline"
          helper="Monitor normalization, validation, publication, and operational lifecycle state."
          onClick={() => onSelectTab?.(ADMIN_TABS.WAVE_PIPELINE)}
          isDarkMode={isDarkMode}
        />
        <QuickLink
          icon={Cable}
          label="Model Onboarding"
          helper="Configure runtime profiles, cadence, timestamp rules, and map metadata for onboarded models."
          onClick={() => onSelectTab?.(ADMIN_TABS.WAVE_MODEL_ONBOARDING)}
          isDarkMode={isDarkMode}
        />
      </div>

      <WaveModelsSection isDarkMode={isDarkMode} />
    </div>
  );
}
