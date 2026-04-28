export default function AuthCard({ children, className = '' }) {
  return (
    <section
      aria-label="Authentication form"
      className={`rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10 ${className}`}
    >
      {children}
    </section>
  );
}
