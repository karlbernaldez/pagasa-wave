import styled, { css } from 'styled-components';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary: css`
    background: ${({ theme }) => theme.tokens.colors.action.primary};
    color: ${({ theme }) => theme.tokens.colors.text.dark.primary};
    border-color: ${({ theme }) => theme.tokens.colors.action.primary};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.tokens.colors.action.primaryHover};
      border-color: ${({ theme }) => theme.tokens.colors.action.primaryHover};
    }
  `,
  secondary: css`
    background: ${({ theme }) => theme.tokens.colors.surface.light.raised};
    color: ${({ theme }) => theme.tokens.colors.brand.primary};
    border-color: ${({ theme }) => theme.tokens.colors.border.light.strong};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.tokens.colors.surface.light.muted};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.tokens.colors.brand.primary};
    border-color: transparent;

    &:hover:not(:disabled) {
      background: rgba(0, 87, 184, 0.08);
    }
  `,
  danger: css`
    background: ${({ theme }) => theme.tokens.colors.action.danger};
    color: ${({ theme }) => theme.tokens.colors.text.dark.primary};
    border-color: ${({ theme }) => theme.tokens.colors.action.danger};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.tokens.colors.action.dangerHover};
      border-color: ${({ theme }) => theme.tokens.colors.action.dangerHover};
    }
  `,
  icon: css`
    width: ${({ $size }) => ($size === 'sm' ? '34px' : $size === 'lg' ? '48px' : '40px')};
    padding: 0;
    background: ${({ theme }) => theme.tokens.colors.surface.light.raised};
    color: ${({ theme }) => theme.tokens.colors.brand.secondary};
    border-color: ${({ theme }) => theme.tokens.colors.border.light.default};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.tokens.colors.surface.light.muted};
    }
  `,
};

const sizeStyles = {
  sm: css`
    min-height: 34px;
    padding-inline: ${({ theme }) => theme.tokens.spacing[3]};
    font-size: ${({ theme }) => theme.tokens.typography.scale.sm};
  `,
  md: css`
    min-height: 40px;
    padding-inline: ${({ theme }) => theme.tokens.spacing[4]};
    font-size: ${({ theme }) => theme.tokens.typography.scale.sm};
  `,
  lg: css`
    min-height: 48px;
    padding-inline: ${({ theme }) => theme.tokens.spacing[5]};
    font-size: ${({ theme }) => theme.tokens.typography.scale.md};
  `,
};

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.tokens.spacing[2]};
  border: 1px solid;
  border-radius: ${({ theme }) => theme.tokens.radius.lg};
  font-family: inherit;
  font-weight: ${({ theme }) => theme.tokens.typography.weight.bold};
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.tokens.motion.duration.fast} ${({ theme }) => theme.tokens.motion.easing.standard},
    border-color ${({ theme }) => theme.tokens.motion.duration.fast} ${({ theme }) => theme.tokens.motion.easing.standard},
    color ${({ theme }) => theme.tokens.motion.duration.fast} ${({ theme }) => theme.tokens.motion.easing.standard},
    box-shadow ${({ theme }) => theme.tokens.motion.duration.fast} ${({ theme }) => theme.tokens.motion.easing.standard},
    opacity ${({ theme }) => theme.tokens.motion.duration.fast} ${({ theme }) => theme.tokens.motion.easing.standard};

  ${({ $size }) => sizeStyles[$size] || sizeStyles.md}
  ${({ $variant }) => variantStyles[$variant] || variantStyles.primary}

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.tokens.shadows.focus};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }
`;

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  type = 'button',
  'aria-label': ariaLabel,
  ...props
}) {
  const isDisabled = disabled || loading;
  const isIconOnly = variant === 'icon' && !children;

  if (isIconOnly && !ariaLabel) {
    // Keep the component usable while making the accessibility contract obvious in development.
    console.warn('Button variant="icon" requires an aria-label when no visible text is provided.');
  }

  return (
    <StyledButton
      type={type}
      $variant={variant}
      $size={size}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={ariaLabel}
      {...props}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={18} aria-hidden="true" />
      ) : null}
      {children}
    </StyledButton>
  );
}
