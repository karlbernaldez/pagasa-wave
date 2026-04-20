import { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
  const glowRef = useRef(null);

  useEffect(() => {
    const node = glowRef.current;
    if (!node) return;

    let t = 0;
    let raf;

    const animate = () => {
      t += 0.0028;
      const x = Math.sin(t) * 22;
      const y = Math.cos(t * 0.9) * 16;
      node.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#07111f_38%,#0a1a2a_100%)]" />

      <div
        ref={glowRef}
        className="absolute -left-24 top-20 h-[28rem] w-[28rem] rounded-full bg-cyan-400/[0.09] blur-3xl"
      />
      <div className="absolute bottom-[-6rem] right-[-4rem] h-[24rem] w-[24rem] rounded-full bg-sky-500/[0.07] blur-3xl" />

      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:64px_64px]" />

      <svg
        className="absolute inset-0 h-full w-full opacity-[0.10]"
        viewBox="0 0 1440 1024"
        fill="none"
        preserveAspectRatio="none"
      >
        <path d="M0 720C145 700 205 610 354 610C503 610 567 732 709 732C865 732 926 535 1089 535C1241 535 1304 616 1440 596" stroke="white" strokeWidth="1.2" />
        <path d="M0 806C179 806 255 684 392 684C516 684 587 789 739 789C877 789 977 649 1115 649C1260 649 1330 731 1440 731" stroke="white" strokeWidth="1.2" />
        <path d="M0 908C166 908 281 842 403 842C541 842 645 918 774 918C919 918 1021 813 1155 813C1287 813 1367 865 1440 865" stroke="white" strokeWidth="1.2" />
      </svg>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.04),transparent_20%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.18)_58%,rgba(2,6,23,0.68)_100%)]" />
    </div>
  );
};

export default AnimatedBackground;