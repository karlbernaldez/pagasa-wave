import { Loader2 } from 'lucide-react';
import { tokens } from '@/styles/tokens';

const { colors, gradients, shadows } = tokens;

const variants = {
  primary: {
    color: colors.brand.secondary,
    background: gradients.primary,
    borderColor: 'transparent',
    boxShadow: '0 14px 34px rgba(1, 176, 239, 0.26)',
    '--auth-button-hover-bg': gradients.primaryHover,
    '--auth-button-hover-shadow': shadows.brandGlow,
    '--auth-button-ring': 'rgba(255, 254, 6, 0.32)',
  },
  secondary: {
    color: colors.brand.secondary,
    background: colors.surface.light.raised,
    borderColor: 'rgba(1, 176, 239, 0.34)',
    boxShadow: shadows.sm,
    '--auth-button-hover-bg': colors.surface.light.muted,
    '--auth-button-hover-shadow': '0 12px 28px rgba(1, 176, 239, 0.18)',
    '--auth-button-ring': 'rgba(1, 176, 239, 0.24)',
  },
  ghost: {
    color: colors.brand.secondary,
    background: 'transparent',
    borderColor: 'transparent',
    '--auth-button-hover-bg': 'rgba(1, 176, 239, 0.10)',
    '--auth-button-hover-shadow': 'none',
    '--auth-button-ring': 'rgba(1, 176, 239, 0.20)',
  },
  danger: {
    color: colors.text.dark.primary,
    background: gradients.danger,
    borderColor: 'transparent',
    '--auth-button-hover-bg': colors.action.dangerHover,
    '--auth-button-hover-shadow': '0 12px 28px rgba(252, 5, 13, 0.24)',
    '--auth-button-ring': 'rgba(252, 5, 13, 0.24)',
  },
  subtle: {
    color: colors.brand.secondary,
    background: 'rgba(1, 176, 239, 0.10)',
    borderColor: 'rgba(1, 176, 239, 0.18)',
    '--auth-button-hover-bg': 'rgba(255, 254, 6, 0.18)',
    '--auth-button-hover-shadow': '0 10px 24px rgba(1, 176, 239, 0.16)',
    '--auth-button-ring': 'rgba(255, 254, 6, 0.26)',
  },
};

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-3.5 text-base',
  icon: 'h-10 w-10 p-0',
};

export default function AuthButton({
  children,
  type = 'button',
  variant = 'primary',
  size = 'lg',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  style,
  'aria-label': ariaLabel,
  ...props
}) {
  const isDisabled = disabled || isLoading;
  const isIconOnly = Boolean(Icon) && !children;
  const variantStyle = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={ariaLabel}
      style={{ ...variantStyle, ...style }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-bold transition hover:scale-[1.01] hover:bg-[image:var(--auth-button-hover-bg)] hover:shadow-[var(--auth-button-hover-shadow)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--auth-button-ring)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 ${sizes[size] || sizes.lg} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={18} aria-hidden="true" />
      ) : null}
      {!isIconOnly && children}
    </button>
  );
}
