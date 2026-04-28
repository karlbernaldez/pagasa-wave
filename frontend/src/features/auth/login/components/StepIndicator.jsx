export default function StepIndicator({ currentStep }) {
  const steps = ['Credentials', 'Verify'];

  return (
    <div
      className="flex items-center justify-center gap-2 mb-6"
      aria-label={`Step ${currentStep} of ${steps.length}: ${steps[currentStep - 1]}`}
    >
      {steps.map((label, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        const isDone = step < currentStep;

        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                  isActive ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : ''
                } ${
                  isDone ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/40' : ''
                } ${
                  !isActive && !isDone ? 'bg-white/5 text-white/25 ring-1 ring-white/10' : ''
                }`}
                aria-hidden="true"
              >
                {step}
              </div>

              <span
                className={`text-xs font-medium tracking-wide transition-colors duration-300 ${
                  isActive ? 'text-cyan-300' : 'text-white/25'
                }`}
                aria-hidden="true"
              >
                {label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`w-6 h-px transition-colors duration-300 ${
                  isDone ? 'bg-cyan-500/40' : 'bg-white/10'
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}