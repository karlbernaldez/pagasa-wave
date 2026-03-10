import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL, {
  autoConnect:          false,
  withCredentials:      true,
  reconnection:         true,
  reconnectionAttempts: 10,
  reconnectionDelay:    1_000,
  reconnectionDelayMax: 10_000,
});

// ── Debug — remove after fixed ─────────────────────────────────────
socket.on('connect',       () => console.log('[Socket] connected ✅', socket.id));
socket.on('connect_error', (err) => console.error('[Socket] connect_error ❌', err.message, err));
socket.on('disconnect',    (reason) => console.log('[Socket] disconnected', reason));
// ──────────────────────────────────────────────────────────────────

export default socket;