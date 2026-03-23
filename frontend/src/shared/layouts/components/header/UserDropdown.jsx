import { useRef, useState, useCallback } from 'react';
import { User, Settings, LogOut, ChevronDown, BadgeCheck } from 'lucide-react';
import { useClickOutside } from './hooks/useClickOutside';

export function UserDropdown({ currentUser, isDarkMode, onNavigate, onSignOut }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const close = useCallback(() => setIsOpen(false), []);
  useClickOutside(ref, close);

  const handleNavigate = useCallback((path) => {
    onNavigate(path);
    setIsOpen(false);
  }, [onNavigate]);

  const fullName = currentUser
    ? `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim() || null
    : null;

  return (
    <div ref={ref} className="hidden md:block relative">

      {/* ── Trigger ──────────────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          flex items-center gap-2.5 pl-1.5 pr-3 py-1.5
          rounded-xl cursor-pointer
          backdrop-blur-lg
          border
          transition-all duration-200
          shadow-[0_4px_20px_rgba(0,0,0,0.15)]
          ${isOpen
            ? isDarkMode
              ? 'bg-white/10 border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.25)]'
              : 'bg-white/60 border-sky-400/50 shadow-[0_0_20px_rgba(14,165,233,0.2)]'
            : isDarkMode
              ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-sky-400/30'
              : 'bg-white/40 border-white/30 hover:bg-white/60 hover:border-sky-400/40'}
        `}
      >
        <Avatar user={currentUser} isDarkMode={isDarkMode} isOpen={isOpen} />

        <div className="hidden lg:flex flex-col text-left min-w-0">
          <span className={`
            text-sm font-semibold leading-tight truncate max-w-[112px]
            ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}
          `}>
            {currentUser?.username ?? 'Loading…'}
          </span>
          <span className={`
            text-[0.67rem] leading-tight truncate max-w-[112px]
            ${isDarkMode ? 'text-sky-400/70' : 'text-sky-600/70'}
          `}>
            {fullName ?? currentUser?.position ?? 'Please wait…'}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`
            flex-shrink-0 transition-transform duration-200
            ${isOpen ? 'rotate-180' : 'rotate-0'}
            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
          `}
        />
      </button>

      {/* ── Panel ────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className={`
          absolute top-full right-0 mt-2 w-[272px] z-50
          rounded-2xl border shadow-2xl overflow-hidden
          backdrop-blur-2xl
          ${isDarkMode
            ? 'bg-gray-900/95 border-white/10'
            : 'bg-white/95 border-gray-200'}
        `}>

          {/* ── Identity block — centered layout ── */}
          <div className={`
            relative px-5 pt-7 pb-6 overflow-hidden text-center
            ${isDarkMode
              ? 'bg-gradient-to-br from-sky-950 via-gray-900 to-gray-900'
              : 'bg-gradient-to-br from-sky-50 via-white to-blue-50'}
          `}>
            {/* Decorative glow orbs */}
            <div className={`
              absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl pointer-events-none
              ${isDarkMode ? 'bg-sky-500/20' : 'bg-sky-400/25'}
            `} />
            <div className={`
              absolute -bottom-8 -left-8 w-28 h-28 rounded-full blur-3xl pointer-events-none
              ${isDarkMode ? 'bg-blue-600/15' : 'bg-blue-300/20'}
            `} />

            <div className="relative flex flex-col items-center gap-3.5">
              {/* Larger, prominent centered avatar */}
              <Avatar user={currentUser} isDarkMode={isDarkMode} size={14} isOpen />

              {/* Stacked user info */}
              <div className="flex flex-col items-center gap-1 w-full">
                <div className={`font-bold text-[1rem] leading-snug ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentUser?.username ?? 'User'}
                </div>

                {fullName && (
                  <div className={`text-[0.75rem] font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {fullName}
                  </div>
                )}

                <div className={`text-[0.72rem] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {currentUser?.email ?? 'user@example.com'}
                </div>

                {/* Badge */}
                <div className={`
                  inline-flex items-center gap-1.5 mt-1.5
                  text-[10px] font-semibold uppercase tracking-[0.14em]
                  px-3 py-1 rounded-full whitespace-nowrap
                  ${isDarkMode
                    ? 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25'
                    : 'bg-sky-100 text-sky-700 ring-1 ring-sky-200'}
                `}>
                  <BadgeCheck size={10} strokeWidth={2.5} />
                  {currentUser?.position ?? fullName ?? 'Member'}
                </div>
              </div>
            </div>
          </div>

          {/* Hairline divider */}
          <div className={`h-px ${isDarkMode ? 'bg-white/[0.08]' : 'bg-gray-100'}`} />

          {/* ── Menu items ── */}
          <div className="p-2.5 flex flex-col gap-0.5">
            <DropdownItem
              icon={User}
              label="View Profile"
              description="Manage your public profile"
              isDarkMode={isDarkMode}
              onClick={() => handleNavigate('/profile')}
            />
            <DropdownItem
              icon={Settings}
              label="Settings"
              description="Preferences & account"
              isDarkMode={isDarkMode}
              onClick={() => handleNavigate('/settings')}
            />
          </div>

          <div className={`mx-3 h-px ${isDarkMode ? 'bg-white/[0.08]' : 'bg-gray-100'}`} />

          {/* ── Sign out ── */}
          <div className="p-2.5">
            <button
              onClick={onSignOut}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                border-none cursor-pointer text-sm font-medium
                transition-all duration-150 text-left
                text-red-500
                ${isDarkMode
                  ? 'hover:bg-red-500/10 hover:text-red-400'
                  : 'hover:bg-red-50 hover:text-red-600'}
              `}
            >
              <div className={`
                w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                ${isDarkMode ? 'bg-red-500/10' : 'bg-red-50'}
              `}>
                <LogOut size={14} />
              </div>
              <div className="flex flex-col">
                <span>Sign Out</span>
                <span className={`text-[0.65rem] font-normal ${isDarkMode ? 'text-red-500/60' : 'text-red-400/70'}`}>
                  End your current session
                </span>
              </div>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function Avatar({ user, isDarkMode, size = 8, isOpen = false }) {
  const sizeMap = {
    8:  'w-8 h-8',
    10: 'w-10 h-10',
    11: 'w-11 h-11',
    14: 'w-14 h-14',
  };
  const sizeClass = sizeMap[size] ?? 'w-8 h-8';
  const iconSize = size >= 14 ? 24 : size >= 10 ? 18 : 15;

  return (
    <div className={`
      ${sizeClass} rounded-full overflow-hidden flex-shrink-0
      flex items-center justify-center ring-2 transition-all duration-200
      ${isOpen
        ? isDarkMode ? 'ring-sky-400/70' : 'ring-sky-500/60'
        : isDarkMode ? 'ring-gray-600/40' : 'ring-gray-300/60'}
      ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}
    `}>
      {user?.avatarUrl
        ? <img src={user.avatarUrl} alt={user.username ?? 'avatar'} className="w-full h-full object-cover" />
        : <User size={iconSize} className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />
      }
    </div>
  );
}

// ─── DropdownItem ─────────────────────────────────────────────────────────────

function DropdownItem({ icon: Icon, label, description, isDarkMode, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
        border-none cursor-pointer text-sm font-medium
        transition-all duration-150 text-left group/item
        ${isDarkMode
          ? 'text-gray-200 hover:bg-white/5 hover:text-white'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
      `}
    >
      <div className={`
        w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
        transition-colors duration-150
        ${isDarkMode
          ? 'bg-gray-800 group-hover/item:bg-sky-500/20 group-hover/item:text-sky-400'
          : 'bg-gray-100 group-hover/item:bg-sky-100 group-hover/item:text-sky-600'}
      `}>
        <Icon size={14} />
      </div>
      <div className="flex flex-col min-w-0">
        <span>{label}</span>
        {description && (
          <span className={`text-[0.65rem] font-normal truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {description}
          </span>
        )}
      </div>
    </button>
  );
}