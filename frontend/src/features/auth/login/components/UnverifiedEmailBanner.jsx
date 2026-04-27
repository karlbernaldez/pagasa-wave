import { MailWarning, RefreshCw } from 'lucide-react';

function getResendButtonProps({ isSending, isCoolingDown, status, cooldown }) {
  if (isSending) return { label: 'Sending…' };
  if (isCoolingDown) return { label: `Resend in ${cooldown}s` };
  if (status === 'error') return { label: 'Try again' };
  return { label: 'Resend verification email' };
}

export default function UnverifiedEmailBanner({
  email,
  status,
  error,
  cooldown,
  onResend,
}) {
  const isSending = status === 'sending';
  const isCoolingDown = cooldown > 0;
  const isDisabled = isSending || isCoolingDown;
  const hasSent = isCoolingDown || status === 'sent';
  const { label } = getResendButtonProps({
    isSending,
    isCoolingDown,
    status,
    cooldown,
  });

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 px-4 py-4 text-sm"
      style={{ background: 'rgba(245,158,11,0.06)' }}
    >
      <div className="flex items-start gap-3">
        <MailWarning
          size={18}
          className="mt-0.5 shrink-0 text-amber-400"
          aria-hidden="true"
        />

        <div className="space-y-0.5">
          <p className="font-semibold text-amber-300">Email not verified</p>
          <p className="text-amber-200/60 leading-relaxed">
            {hasSent ? (
              <>
                A verification link was sent to{' '}
                <span className="font-medium text-amber-200/90">{email}</span>.
                Check your inbox and spam folder.
              </>
            ) : (
              'Verify your email address to activate your account.'
            )}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onResend}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className="ml-7 flex w-fit items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed border border-amber-500/25 bg-amber-500/10 text-amber-200 disabled:opacity-65"
      >
        <RefreshCw
          size={12}
          className={isSending ? 'animate-spin' : ''}
          aria-hidden="true"
        />
        {label}
      </button>

      {status === 'error' && !isCoolingDown && (
        <p role="alert" className="ml-7 text-xs text-red-400/80">
          {error || 'Failed to resend. Please try again in a moment.'}
        </p>
      )}
    </div>
  );
}