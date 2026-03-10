// hooks/useNotifications.js
import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchNotifications, markAllRead, markOneRead } from '@/api/notification';
import socket from '@/socket/socketClient';

const EVENTS = {
  NEW:      'notification:new',
  READ:     'notification:read',
  ALL_READ: 'notification:all_read',
};

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [isConnected,   setIsConnected]   = useState(socket.connected);

  const mountedRef = useRef(true);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();

    fetchNotifications({ signal: controller.signal })
      .then(({ notifications, unreadCount }) => {
        if (!mountedRef.current) return;
        setNotifications(notifications);
        setUnreadCount(unreadCount);
      })
      .catch((err) => { if (err.name !== 'AbortError') console.error(err); });

    return () => controller.abort();
  }, []);

  // ── Socket event listeners only — NO connect/disconnect here ──────────────
  useEffect(() => {
    mountedRef.current = true;

    // Sync whatever the socket's current state is right now
    setIsConnected(socket.connected);

    const onConnect    = () => { if (mountedRef.current) setIsConnected(true); };
    const onDisconnect = () => { if (mountedRef.current) setIsConnected(false); };

    const onNew = (notification) => {
      if (!mountedRef.current) return;
      console.log('[Socket] notification:new received', notification);
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notification._id)) return prev;
        return [notification, ...prev];
      });
      if (notification.unread !== false) {
        setUnreadCount((c) => c + 1);
      }
    };

    const onRead = ({ _id }) => {
      if (!mountedRef.current) return;
      setNotifications((prev) => {
        const target = prev.find((n) => n._id === _id);
        if (!target) return prev;
        if (target.unread) setUnreadCount((c) => Math.max(0, c - 1));
        return prev.map((n) => (n._id === _id ? { ...n, unread: false } : n));
      });
    };

    const onAllRead = () => {
      if (!mountedRef.current) return;
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      setUnreadCount(0);
    };

    socket.on('connect',       onConnect);
    socket.on('disconnect',    onDisconnect);
    socket.on(EVENTS.NEW,      onNew);
    socket.on(EVENTS.READ,     onRead);
    socket.on(EVENTS.ALL_READ, onAllRead);

    // Debug — remove after confirmed working
    const onAny = (event, ...args) => console.log('[Socket event]', event, args);
    socket.onAny(onAny);

    return () => {
      mountedRef.current = false;
      socket.off('connect',       onConnect);
      socket.off('disconnect',    onDisconnect);
      socket.off(EVENTS.NEW,      onNew);
      socket.off(EVENTS.READ,     onRead);
      socket.off(EVENTS.ALL_READ, onAllRead);
      socket.offAny(onAny);
      // ⚠️ No socket.connect() or socket.disconnect() — AuthProvider owns that
    };
  }, []);

  // ── Optimistic write helpers ───────────────────────────────────────────────
  const handleMarkAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);
    await markAllRead().catch(console.error);
  }, []);

  const handleMarkOneRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, unread: false } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await markOneRead(id).catch(console.error);
  }, []);

  return { notifications, unreadCount, isConnected, handleMarkAllRead, handleMarkOneRead };
};

export default useNotifications;