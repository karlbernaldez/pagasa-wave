import { Link, useLocation } from 'react-router-dom';
import { Home, LineChart, SearchX } from 'lucide-react';

import { useTheme } from '@/app/providers/ThemeProvider';

const NotFound = () => {
  const { isDarkMode } = useTheme();
  const location = useLocation();

  document.title = 'Page Not Found | WaveLab';

  const headText = isDarkMode ? 'text-white' : 'text-slate-900';
  const muteText = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const panelClass = isDarkMode
    ? 'border-slate-700/60 bg-slate-900/75 shadow-black/20'
    : 'border-slate-200 bg-white/90 shadow-slate-200/70';

  return (
    <main
      className={`relative min-h-screen overflow-hidden px-4 pt-32 pb-20 transition-colors duration-700 md:px-6 ${
        isDarkMode
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
      }`}
    >
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none">
        <div
          className={`absolute inset-0 bg-[length:30px_30px] ${
            isDarkMode
              ? 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.500)_1px,_transparent_1px)]'
              : 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.400)_1px,_transparent_1px)]'
          }`}
        />
      </div>

      <section className="relative z-10 mx-auto flex min-h-[62vh] max-w-4xl items-center justify-center">
        <div className={`w-full rounded-3xl border p-8 text-center shadow-2xl backdrop-blur-md md:p-12 ${panelClass}`}>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
            <SearchX className="h-10 w-10" aria-hidden="true" />
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.32em] text-blue-500">
            404 page not found
          </p>

          <h1 className={`mx-auto max-w-2xl text-4xl font-bold tracking-tight md:text-5xl ${headText}`}>
            This WaveLab page does not exist.
          </h1>

          <p className={`mx-auto mt-5 max-w-2xl text-base leading-7 md:text-lg ${muteText}`}>
            The route <span className="font-semibold text-blue-500">{location.pathname}</span> is not available.
            Please check the address or return to an existing WaveLab page.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>

            <Link
              to="/charts"
              className={`inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isDarkMode
                  ? 'border-slate-700 text-slate-100 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <LineChart className="h-4 w-4" aria-hidden="true" />
              View charts
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default NotFound;
