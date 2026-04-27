export default function AuthCard({ children, className = '' }) {
  return (
    <section
      aria-label="Authentication form"
      className={`rounded-[2rem] border border-slate-200/80 bg-white/95 p-8 shadow-2xl shadow-blue-950/15 backdrop-blur-md sm:p-10 ${className}`}
    >
      {children}
    </section>
  );
}