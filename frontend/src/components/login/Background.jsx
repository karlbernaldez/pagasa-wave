import { Cloud, Droplets, Wind, Waves, Radio } from 'lucide-react';

const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">

    {/* Deep base gradient */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_20%_50%,#0c1a3a_0%,#020b1a_60%,#000d1f_100%)]" />

    {/* Radar rings — centered left on the branding panel */}
    <div className="absolute left-[22%] top-1/2 -translate-y-1/2 -translate-x-1/2">
      {[180, 280, 380, 480, 580].map((size, i) => (
        <div
          key={size}
          className="absolute rounded-full border border-cyan-400/10 animate-pulse-glow"
          style={{
            width: size,
            height: size,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}
      {/* Sweep arm */}
      <div
        className="absolute animate-radar-sweep"
        style={{
          width: 290,
          height: 290,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          transformOrigin: 'center',
        }}
      >
        <div
          className="absolute top-0 left-1/2 w-px origin-bottom"
          style={{
            height: '50%',
            background: 'linear-gradient(to top, rgba(34,211,238,0.4), transparent)',
          }}
        />
      </div>
      {/* Ping blip */}
      <div
        className="absolute rounded-full border border-cyan-400/30 animate-radar-ping"
        style={{ width: 16, height: 16, top: 'calc(50% - 55px)', left: 'calc(50% + 70px)', transform: 'translate(-50%, -50%)' }}
      />
    </div>

    {/* Ambient blobs */}
    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px] animate-pulse-glow" />
    <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-cyan-600/6 rounded-full blur-[100px] animate-pulse-glow animation-delay-2000" />

    {/* Floating icons — right side only so they don't overlap the form */}
    <div className="absolute top-16 right-24 text-cyan-400/8 animate-float animation-delay-1000">
      <Cloud size={90} strokeWidth={1} />
    </div>
    <div className="absolute top-1/3 right-12 text-blue-400/8 animate-float animation-delay-2000">
      <Droplets size={64} strokeWidth={1} />
    </div>
    <div className="absolute bottom-28 right-32 text-cyan-300/8 animate-float animation-delay-600">
      <Wind size={72} strokeWidth={1} />
    </div>
    <div className="absolute bottom-16 right-1/4 text-blue-300/6 animate-float animation-delay-1500">
      <Waves size={56} strokeWidth={1} />
    </div>

    {/* Horizontal rule lines for that instrument-panel feel */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent" />

    {/* Subtle dot grid */}
    <div className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: 'radial-gradient(circle, #67e8f9 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />
  </div>
);

export default AnimatedBackground;