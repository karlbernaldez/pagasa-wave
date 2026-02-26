import { useState, useCallback, useEffect } from 'react';
import { Trash2, X, TriangleAlert } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (user) => {
  const first = user?.firstName?.[0] ?? '';
  const last  = user?.lastName?.[0]  ?? '';
  return (first + last).toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ConfirmDeleteUserModal({ user, isDarkMode, onCancel, onConfirm, loading }) {
  const [input,   setInput]   = useState('');
  const [shaking, setShaking] = useState(false);

  const username = user?.username ?? '';
  const valid    = input.trim() === username;

  // Shake animation when user tries to submit with wrong input
  const handleConfirm = useCallback(() => {
    if (!valid || loading) {
      setShaking(true);
      return;
    }
    onConfirm();
  }, [valid, loading, onConfirm]);

  useEffect(() => {
    if (!shaking) return;
    const t = setTimeout(() => setShaking(false), 500);
    return () => clearTimeout(t);
  }, [shaking]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onCancel}
    >
      {/* Backdrop blur layer */}
      <div className="absolute inset-0 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        onClick={(e) => e.stopPropagation()}
        className={`
          relative w-full max-w-md rounded-2xl overflow-hidden
          transition-all duration-200
          ${shaking ? 'animate-shake' : ''}
          ${isDarkMode
            ? 'bg-slate-900 border border-slate-700/60 shadow-2xl shadow-black/60'
            : 'bg-white border border-slate-200 shadow-2xl shadow-slate-200/80'
          }
        `}
      >
        {/* ── Danger stripe at top ── */}
        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-rose-500" />

        {/* ── Header ── */}
        <div className={`flex items-center justify-between px-6 pt-5 pb-4 border-b ${
          isDarkMode ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Trash2 size={15} className="text-red-500" />
            </div>
            <h3
              id="delete-modal-title"
              className={`text-sm font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
            >
              Delete User Account
            </h3>
          </div>

          <button
            onClick={onCancel}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode
                ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-5">

          {/* User card */}
          <div className={`flex items-center gap-4 p-4 rounded-xl border ${
            isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-red-400">
                {getInitials(user)}
              </span>
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className={`text-xs truncate mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                @{username}
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className={`flex gap-3 p-3.5 rounded-xl border ${
            isDarkMode
              ? 'bg-red-500/5 border-red-500/20'
              : 'bg-red-50 border-red-100'
          }`}>
            <TriangleAlert size={15} className="text-red-500 mt-0.5 shrink-0" />
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              This will permanently delete this account and all associated data.
              <span className="font-semibold text-red-500"> This cannot be undone.</span>
            </p>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <label className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Type{' '}
              <span className={`font-mono font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {username}
              </span>{' '}
              to confirm
            </label>

            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              placeholder={username}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm font-mono transition-colors outline-none
                focus:ring-2 focus:ring-red-500/30
                ${valid
                  ? isDarkMode
                    ? 'border-red-500/50 bg-red-500/5 text-slate-100'
                    : 'border-red-400 bg-red-50/50 text-slate-900'
                  : isDarkMode
                    ? 'border-slate-700 bg-slate-800/60 text-slate-100 placeholder:text-slate-600'
                    : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                }
              `}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={`flex items-center justify-end gap-2 px-6 py-4 border-t ${
          isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <button
            onClick={onCancel}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isDarkMode
                ? 'text-slate-300 hover:bg-slate-800 border border-slate-700'
                : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={!valid || loading}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white
              transition-all duration-200
              bg-gradient-to-r from-red-600 to-rose-600
              hover:from-red-500 hover:to-rose-500
              shadow-md shadow-red-500/20
              disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
              ${valid && !loading ? 'hover:-translate-y-px' : ''}
            `}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Deleting…
              </span>
            ) : (
              'Delete Permanently'
            )}
          </button>
        </div>
      </div>

      {/* Shake keyframe — injected once */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.45s ease-in-out; }
      `}</style>
    </div>
  );
}