import React from 'react';
import { UserCog, Mail, Phone, Building2, Clock } from 'lucide-react';
import { fullName, getInitials, avatarGradient } from '../utils';
import { StatusBadge } from './StatusBadge';

// ─── UserRow ─────────────────────────────────────────────────────────────────

export function UserRow({
  user,
  isDarkMode,
  onUpdateUser,
  onManage,
  selected,
  onToggleSelect
}) {
  const initials = getInitials(user);
  const gradient = avatarGradient(fullName(user));

  const metaClass = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const dataClass = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const rowBorder = isDarkMode ? 'border-slate-800/80' : 'border-slate-100';

  const avatarSrc = user.photo || user.avatarUrl;

  return (
    <tr
      className={`border-t align-middle transition-colors duration-150 group ${rowBorder}
      ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'}`}
    >
      <td className="py-3 pr-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(user.id)}
          className="w-4 h-4"
        />
      </td>

      {/* Profile */}
      <td className="py-3.5 pr-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md relative">

            {avatarSrc && (
              <img
                src={avatarSrc}
                alt={fullName(user)}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}

            {!avatarSrc && (
              <div
                className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient}
                flex items-center justify-center text-white text-xs font-bold`}
              >
                {initials}
              </div>
            )}

          </div>

          <div className="min-w-0">
            <p className={`font-semibold text-sm truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
              {fullName(user)}
            </p>
            <p className={`text-xs flex items-center gap-1 mt-0.5 ${metaClass}`}>
              <Mail size={11} />
              <span className="truncate max-w-[160px]">{user.email}</span>
            </p>
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="py-3.5 pr-3">
        <p className={`text-sm flex items-center gap-1.5 ${dataClass}`}>
          <Phone size={12} />
          {user.contact || <span className={metaClass}>—</span>}
        </p>
        <p className={`text-xs flex items-center gap-1.5 mt-1 ${metaClass}`}>
          <Clock size={11} />
          {user.lastLogin}
        </p>
      </td>

      {/* Agency */}
      <td className="py-3.5 pr-3">
        <p className={`text-sm flex items-center gap-1.5 ${dataClass}`}>
          <Building2 size={12} />
          <span className="truncate max-w-[150px]">{user.agency || '—'}</span>
        </p>
        <p className={`text-xs mt-1 pl-[18px] ${metaClass}`}>
          {user.position || '—'}
        </p>
      </td>

      {/* Role */}
      <td className={`py-3.5 pr-3 text-sm font-medium ${dataClass}`}>
        {user.role}
      </td>

      {/* Status */}
      <td className="py-3.5 pr-3">
        {/* IMPORTANT: send machine value */}
        <StatusBadge status={user.status} isDarkMode={isDarkMode} />
      </td>

      {/* Member Since */}
      <td className={`py-3.5 pr-3 text-sm tabular-nums ${dataClass}`}>
        {user.memberSince}
      </td>

      {/* Actions */}
      <td className="py-3.5">
        <button
          onClick={() => onManage(user.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
          ${isDarkMode
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25'
              : 'bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-500 hover:text-white'
            }`}
        >
          <UserCog size={13} />
          Manage
        </button>
      </td>
    </tr>
  );
}