import { ShieldCheck } from 'lucide-react';

export default function AuthPageShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-blue-950">
      <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <header className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-sm">
              <img
                src="/pagasa-logo.png"
                alt="PAGASA"
                className="h-12 w-12 object-contain"
              />
            </div>

            <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-blue-800">
              PAGASA WaveLab
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-blue-950 sm:text-4xl">
              Marine Forecasting Workspace
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-slate-600">
              Secure access for official forecasting, review, and marine data analysis workflows.
            </p>
          </header>

          {children}

          <footer className="mt-5 flex items-center justify-center gap-2 text-center text-xs font-medium text-slate-500">
            <ShieldCheck size={14} aria-hidden="true" />
            Protected PAGASA forecasting workspace
          </footer>
        </div>
      </main>
    </div>
  );
}
