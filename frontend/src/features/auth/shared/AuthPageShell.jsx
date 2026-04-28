import { Waves } from 'lucide-react';

export default function AuthPageShell({ children }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-sky-100 text-blue-950"
      style={{
        backgroundImage: "url('/login_bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-sky-50/80 via-sky-100/70 to-sky-200/45" />

      <main className="relative z-10 grid min-h-screen grid-cols-1 items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-20 xl:px-28">
        <section className="hidden max-w-2xl lg:block">
          <div className="mb-10 flex items-center gap-4">
            <img
              src="/pagasa-logo.png"
              alt="PAGASA"
              className="h-16 w-16 object-contain"
            />
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-blue-950">
                PAGASA
              </p>
              <p className="text-sm font-semibold text-blue-900">
                The Weather and Climate Authority
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <Waves className="h-20 w-20 text-cyan-600" strokeWidth={1.8} />
            <h1 className="text-6xl font-extrabold tracking-tight text-blue-950">
              Wave<span className="text-cyan-600">Lab</span>
            </h1>
          </div>

          <p className="mt-3 text-sm font-extrabold uppercase tracking-[0.45em] text-cyan-700">
            Marine Forecasting Workspace
          </p>

          <div className="mt-8 h-1 w-14 rounded-full bg-cyan-600" />

          <p className="mt-7 max-w-xl text-xl font-semibold leading-8 text-blue-950">
            Secure forecasting tools for marine analysis, visualization, and collaborative decision-making.
          </p>
        </section>

        <section className="mx-auto w-full max-w-xl">
          <div className="mb-6 text-center lg:hidden">
            <img
              src="/pagasa-logo.png"
              alt="PAGASA"
              className="mx-auto mb-3 h-14 w-14 object-contain"
            />
            <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-blue-800">
              PAGASA WaveLab
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-blue-950">
              Marine Forecasting Workspace
            </h1>
          </div>

          {children}
        </section>
      </main>
    </div>
  );
}
