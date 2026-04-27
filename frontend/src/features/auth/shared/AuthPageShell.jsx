import { BarChart3, Users, Waves } from 'lucide-react';

export default function AuthPageShell({ children }) {
  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-sky-100"
      style={{
        backgroundImage: "url('/login_bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-sky-100/35 to-sky-200/20" />

      <main className="relative z-10 grid h-screen grid-cols-1 items-center px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-24">
        <section className="hidden max-w-3xl -mt-24 translate-x-24 lg:block xl:translate-x-32 2xl:translate-x-48">
          <div className="mb-12 flex items-center gap-5">
            <img
              src="/pagasa-logo.png"
              alt="PAGASA"
              className="h-20 w-20 object-contain"
            />
            <div>
              <p className="text-4xl font-extrabold tracking-tight text-blue-950">
                PAGASA
              </p>
              <p className="text-base font-semibold text-blue-900">
                The Weather and Climate Authority
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Waves className="h-28 w-28 text-cyan-600" strokeWidth={1.8} />
            <h1 className="text-7xl font-extrabold tracking-tight text-blue-950">
              Wave<span className="text-cyan-600">Lab</span>
            </h1>
          </div>

          <p className="mt-4 text-lg font-bold tracking-[0.55em] text-cyan-700">
            MARINE FORECASTING WORKSPACE
          </p>

          <div className="mt-10 h-1 w-14 rounded-full bg-cyan-600" />

          <p className="mt-8 max-w-2xl text-2xl font-semibold leading-9 text-blue-950">
            WaveLab empowers forecasters with real-time data, advanced tools,
            and collaborative insights to deliver accurate marine forecasts and
            safeguard our seas.
          </p>

          <div className="mt-12 grid max-w-3xl grid-cols-3 gap-6">
            <Feature icon={<Waves />} title="Accurate Marine" subtitle="Forecasts" />
            <Feature icon={<BarChart3 />} title="Real-time Data" subtitle="and Analytics" />
            <Feature icon={<Users />} title="Collaborative" subtitle="Workspace" />
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl">{children}</section>
      </main>
    </div>
  );
}

function Feature({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 border-r border-blue-900/20 last:border-r-0">
      <span className="text-cyan-700 [&>svg]:h-8 [&>svg]:w-8">{icon}</span>
      <div className="text-sm font-bold leading-5 text-blue-950">
        <p>{title}</p>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}