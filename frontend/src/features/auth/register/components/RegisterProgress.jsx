import { Check } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Account details',
    description: 'Identity and sign-in information',
  },
  {
    number: 2,
    title: 'Professional profile',
    description: 'Contact, agency, and security details',
  },
];

export default function RegisterProgress({ currentStep }) {
  return (
    <nav aria-label="Registration progress" className="mb-8">
      <ol className="grid grid-cols-2 gap-3 sm:gap-4">
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isComplete = currentStep > step.number;

          return (
            <li
              key={step.number}
              aria-current={isActive ? 'step' : undefined}
              className={`rounded-xl border p-3 transition sm:p-4 ${
                isActive
                  ? 'border-cyan-300 bg-cyan-50/80 shadow-sm'
                  : isComplete
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isActive
                      ? 'bg-cyan-600 text-white'
                      : isComplete
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-500 ring-1 ring-slate-200'
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : step.number}
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-bold text-blue-950">
                    {step.title}
                  </span>
                  <span className="mt-0.5 hidden text-xs leading-5 text-slate-500 sm:block">
                    {step.description}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
