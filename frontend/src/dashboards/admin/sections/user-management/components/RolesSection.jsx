import { ROLE_COLOR_CONFIG, ROLE_DEFINITIONS } from '../constants';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export function RolesSection({ isDarkMode }) {
  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section className="flex flex-col gap-1">
        <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
          Roles and permissions
        </p>
        <p className={cn('text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
          Review access levels used across internal WaveLab operations.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {ROLE_DEFINITIONS.map((item) => {
          const color = ROLE_COLOR_CONFIG[item.color];

          return (
            <article
              key={item.role}
              className={cn(
                'rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-colors',
                isDarkMode
                  ? 'border-white/10 bg-slate-950/50 shadow-black/20 hover:bg-slate-900/65'
                  : 'border-white/70 bg-white/70 shadow-slate-300/40 hover:bg-white',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg font-black ${isDarkMode ? `${color.bg} ${color.icon}` : `${color.lightBg} ${color.lightIcon}`}`}>
                    {item.icon}
                  </span>

                  <div className="min-w-0">
                    <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
                      {item.role}
                    </p>
                    <p className={cn('mt-1 text-xs font-semibold leading-5', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                      {item.description}
                    </p>
                  </div>
                </div>

                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black ${isDarkMode ? color.badge : color.badgeLight}`}>
                  {item.members}
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className={cn(
        'rounded-2xl border p-4 shadow-xl backdrop-blur-xl',
        isDarkMode ? 'border-white/10 bg-slate-950/50 shadow-black/20' : 'border-white/70 bg-white/70 shadow-slate-300/40',
      )}>
        <div className="mb-4">
          <h3 className={cn('text-base font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            Permission Matrix
          </h3>
          <p className={cn('mt-1 text-sm font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
            Capabilities currently assigned per operational role.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className={cn('border-b text-xs font-black uppercase tracking-wide', isDarkMode ? 'border-white/10 text-slate-500' : 'border-white/70 text-slate-400')}>
                <th className="py-3 pr-4 text-left">Capability</th>
                {ROLE_DEFINITIONS.map((role) => (
                  <th key={role.role} className="px-3 py-3 text-center">{role.role}</th>
                ))}
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDarkMode ? 'divide-white/10' : 'divide-white/70')}>
              {[
                ['Submit forecasts', false, true, false],
                ['Review analytics', false, false, true],
                ['Approve users', true, false, false],
                ['System config', true, false, false],
                ['Export reports', true, false, true],
              ].map(([capability, ...permissions]) => (
                <tr key={capability}>
                  <td className={cn('py-3 pr-4 font-bold', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
                    {capability}
                  </td>
                  {permissions.map((granted, index) => (
                    <td key={index} className="px-3 py-3 text-center">
                      {granted ? (
                        <span className="font-black text-emerald-500">Yes</span>
                      ) : (
                        <span className={isDarkMode ? 'text-slate-700' : 'text-slate-300'}>No</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
