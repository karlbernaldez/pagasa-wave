import React from 'react';
import { ROLE_DEFINITIONS, ROLE_COLOR_CONFIG } from '../constants';

// ─── RolesSection ─────────────────────────────────────────────────────────────

export function RolesSection({ isDarkMode }) {
  const card = isDarkMode
    ? 'bg-slate-900/80 border border-slate-700/60'
    : 'bg-white border border-slate-200';

  const inner = isDarkMode
    ? 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/60'
    : 'bg-slate-50 border-slate-200 hover:border-slate-300';

  return (
    <div className={`rounded-2xl p-6 ${card}`}>
      {/* Section header */}
      <div className="mb-6">
        <h3 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          Roles &amp; Permissions
        </h3>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
          Configure access levels and review membership counts per role.
        </p>
      </div>

      <div className="space-y-3">
        {ROLE_DEFINITIONS.map((item) => {
          const col = ROLE_COLOR_CONFIG[item.color];
          return (
            <div
              key={item.role}
              className={`rounded-xl border p-4 transition-all duration-200 ${inner}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 text-lg font-bold ${isDarkMode ? `${col.bg} ${col.icon}` : `${col.lightBg} ${col.lightIcon}`}`}>
                    {item.icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                      {item.role}
                    </p>
                    <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Member count pill */}
                <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${isDarkMode ? col.badge : col.badgeLight}`}>
                  {item.members} members
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission matrix legend */}
      <div className={`mt-5 rounded-xl border p-4 ${isDarkMode ? 'bg-slate-800/40 border-slate-700/40' : 'bg-blue-50/80 border-blue-100'}`}>
        <p className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-blue-700'}`}>
          PERMISSION MATRIX
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>
                <th className="text-left py-1 pr-4 font-medium">Capability</th>
                {ROLE_DEFINITIONS.map((r) => (
                  <th key={r.role} className="text-center py-1 px-3 font-medium">{r.role}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-blue-100'}`}>
              {[
                ['Submit forecasts', false, true, false],
                ['Review analytics', false, false, true],
                ['Approve users', true, false, false],
                ['System config', true, false, false],
                ['Export reports', true, false, true],
              ].map(([cap, ...perms]) => (
                <tr key={cap}>
                  <td className={`py-1.5 pr-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{cap}</td>
                  {perms.map((granted, i) => (
                    <td key={i} className="text-center py-1.5 px-3">
                      {granted
                        ? <span className="text-emerald-400 font-bold">✓</span>
                        : <span className={isDarkMode ? 'text-slate-700' : 'text-slate-300'}>—</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}