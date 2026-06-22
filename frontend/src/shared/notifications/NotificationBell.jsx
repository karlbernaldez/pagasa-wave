import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import Swal from 'sweetalert2';

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notificationAPI';
import {
  approveFeatureChangeRequest,
  declineFeatureChangeRequest,
} from '@/api/featureServices';

function formatRelativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNotificationId(notification) {
  return notification?._id || notification?.id;
}

function isInternalPath(path) {
  return typeof path === 'string' && path.startsWith('/');
}

function isAnnotationRequest(notification) {
  return notification?.type === 'annotation_change_request';
}

function getRequestStatus(notification) {
  return notification?.metadata?.status || 'pending';
}

function getRequestSummary(notification) {
  const metadata = notification?.metadata || {};
  const lines = [notification?.message || 'A forecaster sent an annotation request.'];
  if (metadata.requestType) lines.push(`<strong>Request:</strong> ${metadata.requestType}`);
  if (metadata.requestedName) lines.push(`<strong>Requested name:</strong> ${metadata.requestedName}`);
  if (metadata.comment) lines.push(`<strong>Comment:</strong> ${metadata.comment}`);
  if (metadata.status && metadata.status !== 'pending') lines.push(`<strong>Status:</strong> ${metadata.status}`);
  return `<div style="text-align:left;line-height:1.55">${lines.map((line) => `<p style="margin:0 0 8px">${line}</p>`).join('')}</div>`;
}

export default function NotificationBell({ isDarkMode = false, className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const wrapperRef = useRef(null);

  const iconButtonClass = useMemo(() => {
    return `relative h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
      isDarkMode ? 'text-gray-300 hover:bg-white/[0.08]' : 'text-slate-500 hover:bg-white/75'
    } ${className}`;
  }, [className, isDarkMode]);

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    const controller = new AbortController();
    if (!silent) setIsLoading(true);
    setError('');
    try {
      const data = await fetchNotifications({ limit: 20, signal: controller.signal });
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(Number(data?.unreadCount || 0));
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[NotificationBell] Failed to load notifications:', err);
        setError(err?.message || 'Failed to load notifications.');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    loadNotifications({ silent: true });
    const interval = window.setInterval(() => loadNotifications({ silent: true }), 30000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const openResourcePath = useCallback((resourcePath) => {
    if (!resourcePath) return;
    if (isInternalPath(resourcePath)) {
      const currentPath = `${location.pathname}${location.search}`;
      if (currentPath !== resourcePath) navigate(resourcePath);
      return;
    }
    window.open(resourcePath, '_blank', 'noopener,noreferrer');
  }, [location.pathname, location.search, navigate]);

  const handleAnnotationRequestClick = async (notification) => {
    const id = getNotificationId(notification);
    const status = getRequestStatus(notification);
    const isPending = status === 'pending';
    const result = await Swal.fire({
      icon: isPending ? 'question' : 'info',
      title: notification?.title || 'Annotation request',
      html: getRequestSummary(notification),
      showDenyButton: isPending,
      showCancelButton: true,
      confirmButtonText: isPending ? 'Approve request' : 'Open Studio',
      denyButtonText: 'Decline',
      cancelButtonText: 'Close',
    });

    if (result.isConfirmed && isPending) {
      await approveFeatureChangeRequest(id);
      await Swal.fire({ icon: 'success', title: 'Request approved', timer: 1400, showConfirmButton: false });
      openResourcePath(notification?.resourcePath);
      await loadNotifications({ silent: true });
      return;
    }

    if (result.isDenied && isPending) {
      await declineFeatureChangeRequest(id);
      await Swal.fire({ icon: 'success', title: 'Request declined', timer: 1400, showConfirmButton: false });
      await loadNotifications({ silent: true });
      return;
    }

    if (result.isConfirmed) openResourcePath(notification?.resourcePath);
  };

  const handleToggle = async () => {
    setIsOpen((value) => !value);
    if (!isOpen) await loadNotifications({ silent: true });
  };

  const handleNotificationClick = async (notification) => {
    const id = getNotificationId(notification);
    try {
      if (id && notification?.unread) await markNotificationRead(id);
    } catch (err) {
      console.error('[NotificationBell] Failed to mark notification read:', err);
    } finally {
      await loadNotifications({ silent: true });
      setIsOpen(false);
    }

    if (isAnnotationRequest(notification)) {
      await handleAnnotationRequestClick(notification);
      return;
    }

    openResourcePath(notification?.resourcePath);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      await loadNotifications({ silent: true });
    } catch (err) {
      console.error('[NotificationBell] Failed to mark all read:', err);
      setError(err?.message || 'Failed to mark all as read.');
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button type="button" onClick={handleToggle} className={iconButtonClass} aria-label="Notifications" aria-expanded={isOpen}>
        <Bell size={17} />
        {unreadCount > 0 ? <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white">{unreadCount > 99 ? '99+' : unreadCount}</span> : null}
      </button>
      {isOpen && (
        <div className={`studio-liquid-panel fixed left-3 right-3 top-16 z-[220] max-h-[min(520px,calc(100vh-84px))] overflow-hidden rounded-3xl border shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[min(380px,calc(100vw-24px))] ${isDarkMode ? 'studio-liquid-dark border-white/[0.18] text-slate-100' : 'studio-liquid-light border-white/80 text-slate-950'}`}>
          <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${isDarkMode ? 'border-white/10' : 'border-white/70'}`}>
            <div><p className="text-sm font-black">Notifications</p><p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p></div>
            <button type="button" onClick={handleMarkAllRead} disabled={unreadCount === 0} className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${isDarkMode ? 'hover:bg-white/[0.08] text-cyan-300' : 'hover:bg-slate-100 text-blue-600'}`}><CheckCheck size={14} />Read all</button>
          </div>
          <div className="max-h-[min(420px,calc(100vh-150px))] overflow-y-auto">
            {isLoading ? <div className={`p-5 text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading notifications…</div> : error ? <div className="p-5 text-sm font-semibold text-red-500">{error}</div> : notifications.length === 0 ? <div className={`p-6 text-center text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No notifications yet.</div> : notifications.map((notification) => {
              const id = getNotificationId(notification);
              const unread = Boolean(notification.unread);
              const canOpen = Boolean(notification.resourcePath) || isAnnotationRequest(notification);
              const status = getRequestStatus(notification);
              return <button key={id} type="button" onClick={() => handleNotificationClick(notification)} className={`w-full border-b px-4 py-3 text-left transition last:border-b-0 ${isDarkMode ? `border-white/10 ${unread ? 'bg-cyan-500/10 hover:bg-cyan-500/15' : 'hover:bg-white/5'}` : `border-slate-100 ${unread ? 'bg-blue-50 hover:bg-blue-100/70' : 'hover:bg-slate-50'}`}`}>
                <div className="flex items-start gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${unread ? 'bg-blue-500' : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} /><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="text-sm font-black leading-snug">{notification.title}</span>{canOpen && <ExternalLink size={13} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />}</span><span className={`mt-1 block text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{notification.message}</span>{isAnnotationRequest(notification) && status !== 'pending' && <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'}`}>{status}</span>}<span className={`mt-2 block text-[11px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{formatRelativeTime(notification.createdAt)}</span></span></div>
              </button>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
