export default function RegisterProgress({ currentStep }) {
  return (
    <div className="mb-7 flex items-center justify-center gap-3">
      <StepCircle active={currentStep >= 1} label="1" />
      <div
        className={`h-1 w-20 rounded-full transition ${
          currentStep >= 2 ? 'bg-cyan-600' : 'bg-slate-200'
        }`}
      />
      <StepCircle active={currentStep >= 2} label="2" />
    </div>
  );
}

function StepCircle({ active, label }) {
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold transition ${
        active
          ? 'bg-cyan-700 text-white shadow-lg shadow-cyan-900/20'
          : 'border border-slate-200 bg-white text-slate-400'
      }`}
    >
      {label}
    </div>
  );
}