import { BarChart3, Users, Waves } from 'lucide-react';
import { tokens } from '@/styles/tokens';

const { colors } = tokens;

export default function AuthPageShell({ children }) {
  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{
        background: colors.surface.light.page,
        backgroundImage: "url('/login_bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(1,176,239,0.10)' }}
      />

      <main className="relative z-10 grid h-screen grid-cols-1 items-center px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-24">
        <section className="hidden max-w-3xl -mt-24 translate-x-24 lg:block xl:translate-x-32 2xl:translate-x-48">
          <div className="mb-12 flex items-center gap-5">
            <img src="/pagasa-logo.png" alt="PAGASA" className="h-20 w-20 object-contain" />
            <div>
              <p className="text-4xl font-extrabold tracking-tight" style={{ color: colors.brand.secondary }}>
                PAGASA
              </p>
              <p className="text-base font-semibold" style={{ color: colors.text.light.secondary }}>
                The Weather and Climate Authority
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Waves className="h-28 w-28" style={{ color: colors.brand.primary }} strokeWidth={1.8} />
            <h1 className="text-7xl font-extrabold tracking-tight" style={{ color: colors.brand.secondary }}>
              Wave<span style={{ color: colors.brand.primary }}>Lab</span>
            </h1>
          </div>

          <p className="mt-4 text-lg font-bold tracking-[0.55em]" style={{ color: colors.brand.primary }}>
            MARINE FORECASTING WORKSPACE
          </p>

          <div className="mt-10 h-1 w-14 rounded-full" style={{ background: colors.brand.primary }} />

          <p className="mt-8 max-w-2xl text-2xl font-semibold leading-9" style={{ color: colors.brand.secondary }}>
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
    <div className="flex items-center gap-3 border-r last:border-r-0" style={{ borderColor: 'rgba(1,176,239,0.25)' }}>
      <span style={{ color: colors.brand.primary }} className="[&>svg]:h-8 [&>svg]:w-8">
        {icon}
      </span>
      <div className="text-sm font-bold leading-5" style={{ color: colors.brand.secondary }}>
        <p>{title}</p>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
