import {
  UserPlus, ShieldAlert, RefreshCw, Info,
  Bell, CheckCheck, Clock, Inbox, X, ArrowRight,
} from 'lucide-react';

import Backdrop     from './Backdrop';
import useEscapeKey from '../hooks/useEscapeKey';
import { formatTime } from '../utils/formatTime';

// ─── Type config ───────────────────────────────────────────────────────────────
// Only icon + label vary. All colours stay within the app's cyan/neutral palette
// so nothing looks out-of-place on the dark dashboard.

const TYPE_CONFIG = {
  user_registered: { icon: UserPlus,    label: 'User'     },
  security_alert:  { icon: ShieldAlert, label: 'Security' },
  system_update:   { icon: RefreshCw,   label: 'System'   },
  info:            { icon: Info,         label: 'Info'     },
};
const DEFAULT_TYPE = { icon: Bell, label: 'Notice' };
const getType = (t) => TYPE_CONFIG[t] ?? DEFAULT_TYPE;

// ─── NotificationItem ─────────────────────────────────────────────────────────

const NotificationItem = ({ item, index, isDarkMode, onMarkOneRead }) => {
  const { icon: Icon, label } = getType(item.type);

  const handleClick = () => item.unread && onMarkOneRead(item._id);
  const handleKey   = (e) => e.key === 'Enter' && handleClick();

  return (
    <div
      role={item.unread ? 'button' : undefined}
      tabIndex={item.unread ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKey}
      className="notif-item group relative flex items-start gap-3 px-4 py-3 transition-colors duration-150 outline-none"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      {/* Unread indicator — flush left edge */}
      {item.unread && (
        <span className="absolute left-0 inset-y-0 w-[2px] bg-cyan-500 rounded-r-full" />
      )}

      {/* Hover layer */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
        isDarkMode ? 'bg-white/[0.03]' : 'bg-black/[0.025]'
      }`} />

      {/* Icon */}
      <div className={`relative z-[1] mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isDarkMode ? 'bg-white/[0.06]' : 'bg-black/[0.05]'
      }`}>
        <Icon size={14} className={item.unread ? 'text-cyan-400' : isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
        {item.unread && (
          <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 ring-[1.5px] ${
            isDarkMode ? 'ring-[#0d1117]' : 'ring-white'
          }`} />
        )}
      </div>

      {/* Text content */}
      <div className="relative z-[1] min-w-0 flex-1">

        {/* Title row */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className={`text-[12.5px] font-semibold leading-tight truncate ${
            item.unread
              ? isDarkMode ? 'text-gray-100' : 'text-gray-800'
              : isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            {item.title}
          </p>
          {/* Type chip — matches the "USER" chip style in the screenshot */}
          <span className={`shrink-0 text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded border ${
            item.unread
              ? isDarkMode
                ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/[0.08]'
                : 'text-cyan-600 border-cyan-500/30 bg-cyan-500/[0.06]'
              : isDarkMode
                ? 'text-gray-600 border-white/8 bg-white/[0.03]'
                : 'text-gray-400 border-black/10 bg-black/[0.03]'
          }`}>
            {label}
          </span>
        </div>

        {/* Message */}
        {item.message && (
          <p className={`text-[11.5px] leading-[1.5] line-clamp-2 mb-1.5 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {item.message}
          </p>
        )}

        {/* Footer row */}
        <div className="flex items-center gap-1.5">
          {item.resourceType && (
            <span className={`text-[10px] font-medium px-1.5 py-px rounded-[4px] ${
              isDarkMode ? 'bg-white/[0.05] text-gray-500' : 'bg-black/[0.05] text-gray-400'
            }`}>
              {item.resourceType}
            </span>
          )}
          <span className={`flex items-center gap-1 text-[10px] ml-auto tabular-nums ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`}>
            <Clock size={9} strokeWidth={2} />
            {formatTime(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Empty state ───────────────────────────────────────────────────────────────

const EmptyState = ({ isDarkMode }) => (
  <div className="flex flex-col items-center justify-center gap-2.5 py-10 px-6">
    <Inbox
      size={28}
      strokeWidth={1.5}
      className={isDarkMode ? 'text-gray-700' : 'text-gray-300'}
    />
    <div className="text-center">
      <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        All caught up
      </p>
      <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}`}>
        No notifications right now
      </p>
    </div>
  </div>
);

// ─── NotificationDropdown ─────────────────────────────────────────────────────

/**
 * @param {{
 *   isOpen:        boolean,
 *   onClose:       () => void,
 *   isDarkMode:    boolean,
 *   dropdownCls:   string,
 *   notifications: object[],
 *   unreadCount:   number,
 *   onMarkAllRead: () => void,
 *   onMarkOneRead: (id: string) => void,
 * }} props
 */
const NotificationDropdown = ({
  isOpen, onClose, isDarkMode, dropdownCls,
  notifications, unreadCount, onMarkAllRead, onMarkOneRead,
}) => {
  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;

  const hasUnread = unreadCount > 0;

  return (
    <>
      <style>{`
        @keyframes ndSlideIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes ndItemIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .nd-panel   { animation: ndSlideIn 0.15s cubic-bezier(0.2, 0, 0, 1) both; }
        .notif-item { animation: ndItemIn  0.2s  cubic-bezier(0.2, 0, 0, 1) both; }
        .nd-scroll::-webkit-scrollbar       { width: 3px; }
        .nd-scroll::-webkit-scrollbar-track { background: transparent; }
        .nd-scroll::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.2); border-radius: 99px; }
      `}</style>

      <Backdrop onClose={onClose} />

      <div
        role="dialog"
        aria-label="Notifications"
        className={`nd-panel absolute right-0 mt-2.5 w-[21rem] rounded-xl shadow-xl z-20 overflow-hidden ${dropdownCls}`}
      >

        {/* ── Header ── */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode ? 'border-white/[0.07]' : 'border-black/[0.07]'
        }`}>
          <div className="flex items-center gap-2">
            <Bell size={13} className="text-cyan-400" />
            <span className={`text-[13px] font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Notifications
            </span>
            {hasUnread && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 leading-none">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            {hasUnread && (
              <button
                onClick={onMarkAllRead}
                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-colors duration-150 ${
                  isDarkMode
                    ? 'text-cyan-400 hover:text-cyan-300 hover:bg-white/[0.05]'
                    : 'text-cyan-600 hover:text-cyan-700 hover:bg-black/[0.04]'
                }`}
              >
                <CheckCheck size={11} strokeWidth={2.5} />
                All read
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close notifications"
              className={`p-1.5 rounded-md transition-colors duration-150 ${
                isDarkMode
                  ? 'text-gray-600 hover:text-gray-400 hover:bg-white/[0.05]'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-black/[0.04]'
              }`}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* ── List ── */}
        <div className="nd-scroll max-h-[24rem] overflow-y-auto">
          {notifications.length === 0 ? (
            <EmptyState isDarkMode={isDarkMode} />
          ) : (
            <div className={`divide-y ${isDarkMode ? 'divide-white/[0.05]' : 'divide-black/[0.05]'}`}>
              {notifications.map((item, i) => (
                <NotificationItem
                  key={item._id}
                  item={item}
                  index={i}
                  isDarkMode={isDarkMode}
                  onMarkOneRead={onMarkOneRead}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {notifications.length > 0 && (
          <div className={`border-t ${isDarkMode ? 'border-white/[0.07]' : 'border-black/[0.07]'}`}>
            <button className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] font-medium transition-colors duration-150 ${
              isDarkMode
                ? 'text-gray-600 hover:text-gray-400 hover:bg-white/[0.03]'
                : 'text-gray-400 hover:text-gray-600 hover:bg-black/[0.02]'
            }`}>
              View all notifications
              <ArrowRight size={10} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationDropdown;