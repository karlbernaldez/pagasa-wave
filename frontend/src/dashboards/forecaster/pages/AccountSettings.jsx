import { useState } from 'react';
import { ArrowLeft, KeyRound, LogOut, ShieldCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { logoutAllDevices } from '@/api/sessionSecurity';
import { useTheme } from '@/app/providers/ThemeProvider';

function getPanelClass(isDarkMode) {
  return isDarkMode
    ? 'border-white/10 bg-slate-950/55 text-slate-100 shadow-[0_24px_70px_rgba(0,0,0,0.35)]'
    : 'border-white/80 bg-white/75 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.14)]';
}

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');

  const handleLogoutAllDevices = async () => {
    setLoggingOut(true);
    setError('');

    try {
      await logoutAllDevices();
      window.location.assign('/login');
    } catch (logoutError) {
      setError(logoutError?.message || 'Failed to log out all devices.');
      setLoggingOut(false);
      setShowConfirmation(false);
    }
  };

  return (
    <main
      className={`min-h-full px-4 py-8 sm:px-6 lg:px-8 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.18em] ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}
            >
              Account
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              Account settings
            </h1>
            <p
              className={`mt-2 max-w-2xl text-sm leading-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
            >
              Manage account-level security controls for your WaveLab access.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
              isDarkMode
                ? 'border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.09]'
                : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white'
            }`}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to profile
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400"
          >
            {error}
          </div>
        )}

        <section
          className={`overflow-hidden rounded-2xl border backdrop-blur-3xl ${getPanelClass(isDarkMode)}`}
        >
          <div
            className={`flex items-center gap-3 border-b px-5 py-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200/80'}`}
          >
            <span
              className={`grid h-9 w-9 place-items-center rounded-xl ${isDarkMode ? 'bg-cyan-400/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}
            >
              <ShieldCheck size={17} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.12em]">Session security</h2>
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Control active sign-ins for your account.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isDarkMode ? 'bg-red-400/10 text-red-300' : 'bg-red-50 text-red-600'}`}
              >
                <KeyRound size={18} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold">Log out of all devices</h3>
                <p
                  className={`mt-1 max-w-2xl text-sm leading-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                >
                  End every active WaveLab session associated with your account, including this
                  browser. You will need to sign in again on each device.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmation(true)}
              disabled={loggingOut}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-400/35 bg-red-500/10 px-4 text-sm font-black text-red-400 transition hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-wait disabled:opacity-60"
            >
              <LogOut size={16} aria-hidden="true" />
              Log out all devices
            </button>
          </div>
        </section>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-all-title"
            className={`w-full max-w-md rounded-2xl border p-6 backdrop-blur-3xl ${getPanelClass(isDarkMode)}`}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-500/10 text-red-400">
                <LogOut size={19} aria-hidden="true" />
              </span>
              <button
                type="button"
                aria-label="Close confirmation"
                onClick={() => setShowConfirmation(false)}
                disabled={loggingOut}
                className={`grid h-9 w-9 place-items-center rounded-lg transition ${isDarkMode ? 'text-slate-400 hover:bg-white/[0.06]' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <h2 id="logout-all-title" className="mt-5 text-lg font-black">
              Log out of all devices?
            </h2>
            <p
              className={`mt-2 text-sm leading-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
            >
              This immediately invalidates every active session, including the one you are using
              now.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                disabled={loggingOut}
                className={`min-h-11 rounded-xl border px-4 text-sm font-bold transition disabled:opacity-50 ${
                  isDarkMode
                    ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutAllDevices}
                disabled={loggingOut}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/35 bg-red-500/15 px-4 text-sm font-black text-red-400 transition hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60"
              >
                <LogOut size={16} aria-hidden="true" />
                {loggingOut ? 'Logging out…' : 'Log out all devices'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
