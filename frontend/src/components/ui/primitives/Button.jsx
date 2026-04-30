import React, { forwardRef } from "react";
import styled, { css } from "styled-components";

/* =========================
   Size variants
========================= */
const sizeStyles = {
  sm: css`
    height: 32px;
    padding: ${({ theme }) =>
      `${theme.tokens.spacing[2]} ${theme.tokens.spacing[3]}`};
    font-size: ${({ theme }) => theme.tokens.typography.scale.xs};
  `,
  md: css`
    height: 40px;
    padding: ${({ theme }) =>
      `${theme.tokens.spacing[3]} ${theme.tokens.spacing[4]}`};
    font-size: ${({ theme }) => theme.tokens.typography.scale.sm};
  `,
  lg: css`
    height: 48px;
    padding: ${({ theme }) =>
      `${theme.tokens.spacing[4]} ${theme.tokens.spacing[6]}`};
    font-size: ${({ theme }) => theme.tokens.typography.scale.md};
  `,
};

/* =========================
   Variant styles
========================= */
const variantStyles = {
  primary: css`
    color: white;
    background: ${({ theme }) => theme.tokens.gradients.primary};
    border: none;

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.tokens.gradients.primaryHover};
    }
  `,

  secondary: css`
    color: white;
    background: ${({ theme }) => theme.tokens.colors.action.secondary};
    border: none;

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.tokens.colors.action.secondaryHover};
    }
  `,

  ghost: css`
    color: ${({ theme }) => theme.tokens.colors.action.primary};
    background: transparent;
    border: 1px solid
      ${({ theme }) => theme.tokens.colors.border.light.default};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.tokens.colors.surface.light.muted};
    }
  `,

  danger: css`
    color: white;
    background: ${({ theme }) => theme.tokens.gradients.danger};
    border: none;

    &:hover:not(:disabled) {
      background: ${({ theme }) =>
        theme.tokens.colors.action.dangerHover};
    }
  `,
};

/* =========================
   Base Button
========================= */
const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.tokens.spacing[2]};

  border-radius: ${({ theme }) => theme.tokens.radius.lg};
  font-family: ${({ theme }) =>
    theme.tokens.typography.fontFamily.sans};
  font-weight: ${({ theme }) =>
    theme.tokens.typography.weight.semibold};

  cursor: pointer;
  transition: all
    ${({ theme }) => theme.tokens.animation.duration.normal};

  ${({ $size }) => sizeStyles[$size]}
  ${({ $variant }) => variantStyles[$variant]}

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.tokens.shadows.focus};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* =========================
   Component API
========================= */
export const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <StyledButton
        ref={ref}
        $variant={variant}
        $size={size}
        style={{ width: fullWidth ? "100%" : "auto" }}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {leftIcon && <span>{leftIcon}</span>}
        {isLoading ? "Loading..." : children}
        {rightIcon && <span>{rightIcon}</span>}
      </StyledButton>
    );
  }
);