import { tokens } from '@/styles/tokens';

const { colors } = tokens;

export default function RegisterProgress({ currentStep }) {
  return (
    <div className="mb-7 flex items-center justify-center gap-3">
      <StepCircle active={currentStep >= 1} label="1" />
      <div
        className="h-1 w-20 rounded-full transition"
        style={{ background: currentStep >= 2 ? colors.brand.primary : 'rgba(1,176,239,0.2)' }}
      />
      <StepCircle active={currentStep >= 2} label="2" />
    </div>
  );
}

function StepCircle({ active, label }) {
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold transition"
      style={
        active
          ? {
              background: colors.brand.primary,
              color: '#FFFFFF',
              boxShadow: '0 10px 24px rgba(1,176,239,0.28)',
            }
          : {
              border: '1px solid rgba(1,176,239,0.25)',
              background: colors.surface.light.raised,
              color: colors.text.light.muted,
            }
      }
    >
      {label}
    </div>
  );
}
