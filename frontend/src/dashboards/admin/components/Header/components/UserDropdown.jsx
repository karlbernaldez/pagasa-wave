import { LogOut, User, Settings } from 'lucide-react';

import Backdrop    from './Backdrop';
import UserAvatar  from './UserAvatar';
import useEscapeKey from '../hooks/useEscapeKey';

const MENU_ITEMS = [
  { icon: User,     label: 'Profile Settings' },
  { icon: Settings, label: 'Preferences'      },
];

/**
 * User identity + navigation dropdown.
 *
 * @param {{
 *   isOpen:      boolean,
 *   onClose:     () => void,
 *   isDarkMode:  boolean,
 *   dropdownCls: string,
 *   user:        DerivedUser,
 *   onLogout:    () => Promise<void>,
 * }} props
 */
const UserDropdown = ({ isOpen, onClose, isDarkMode, dropdownCls, user, onLogout }) => {
  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;

  const divider = <div className={`h-px ${isDarkMode ? 'bg-white/8' : 'bg-black/6'}`} />;

  return (
    <>
      <Backdrop onClose={onClose} />

      <div
        role="dialog"
        aria-label="User menu"
        className={`absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl backdrop-blur-2xl z-20 overflow-hidden ${dropdownCls}`}
      >
        {/* ── Identity card ── */}
        <div className="relative px-5 py-5 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <UserAvatar avatarUrl={user.avatarUrl} initials={user.initials} size="lg" />
            <div className="min-w-0 flex-1">
              <p className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {user.name}
              </p>
              <p className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {user.email}
              </p>
              <span className="inline-block mt-1.5 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/12 text-cyan-400 border border-cyan-500/20">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {divider}

        {/* ── Nav items ── */}
        <div className="py-1.5">
          {MENU_ITEMS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className={`w-full px-5 py-2.5 flex items-center gap-3 text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-black/[0.04]'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {divider}

        {/* ── Sign out ── */}
        <div className="py-1.5">
          <button
            onClick={async () => { await onLogout(); onClose(); }}
            className={`w-full px-5 py-2.5 flex items-center gap-3 text-sm font-semibold transition-colors ${
              isDarkMode
                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                : 'text-red-500 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default UserDropdown;