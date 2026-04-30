import { tokens } from '@/styles/tokens';

const { colors } = tokens;

export default function AuthFooter({
  switchText,
  switchActionText,
  onSwitchAction,
  termsPrefix,
}) {
  return (
    <footer className="mt-6 border-t pt-5 text-center" style={{ borderColor: 'rgba(1, 176, 239, 0.18)' }}>
      {switchText && switchActionText && onSwitchAction && (
        <p className="text-sm font-medium" style={{ color: colors.text.light.muted }}>
          {switchText}{' '}
          <button
            type="button"
            onClick={onSwitchAction}
            className="font-extrabold underline underline-offset-2 transition-colors"
            style={{ color: colors.brand.primary }}
          >
            {switchActionText}
          </button>
        </p>
      )}

      <p className="mt-4 text-xs font-medium" style={{ color: colors.text.light.muted }}>
        {termsPrefix}{' '}
        <button
          type="button"
          className="font-bold underline underline-offset-2 transition-colors"
          style={{ color: colors.brand.primary }}
        >
          Terms of Use
        </button>{' '}
        and{' '}
        <button
          type="button"
          className="font-bold underline underline-offset-2 transition-colors"
          style={{ color: colors.brand.primary }}
        >
          Privacy Policy
        </button>
      </p>
    </footer>
  );
}
