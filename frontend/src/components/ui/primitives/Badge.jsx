import React, { forwardRef } from "react";
import styled, { css } from "styled-components";

const variantStyles = {
  default: css`
    color: ${({ theme }) => theme.tokens.colors.text.dark.secondary};
    background: ${({ theme }) => theme.tokens.colors.studio.control};
    border-color: ${({ theme }) => theme.tokens.colors.border.dark.default};
  `,

  primary: css`
    color: ${({ theme }) => theme.tokens.colors.text.dark.primary};
    background: ${({ theme }) => theme.tokens.colors.studio.badge};
    border-color: ${({ theme }) => theme.tokens.colors.studio.panelBorder};
  `,

  success: css`
    color: ${({ theme }) => theme.tokens.colors.state.success};
    background: rgba(34, 197, 94, 0.14);
    border-color: rgba(34, 197, 94, 0.3);
  `,

  warning: css`
    color: ${({ theme }) => theme.tokens.colors.state.warning};
    background: rgba(245, 158, 11, 0.14);
    border-color: rgba(245, 158, 11, 0.3);
  `,

  error: css`
    color: ${({ theme }) => theme.tokens.colors.state.error};
    background: rgba(239, 68, 68, 0.14);
    border-color: rgba(239, 68, 68, 0.3);
  `,
};

const sizeStyles = {
  sm: css`
    min-height: 20px;
    padding: 0 ${({ theme }) => theme.tokens.spacing[2]};
    font-size: ${({ theme }) => theme.tokens.typography.scale.xs};
  `,

  md: css`
    min-height: 24px;
    padding: ${({ theme }) => `${theme.tokens.spacing[1]} ${theme.tokens.spacing[3]}`};
    font-size: ${({ theme }) => theme.tokens.typography.scale.xs};
  `,
};

const StyledBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.tokens.spacing[1]};
  width: fit-content;
  border: 1px solid;
  border-radius: ${({ theme }) => theme.tokens.radius.full};
  font-family: ${({ theme }) => theme.tokens.typography.fontFamily.sans};
  font-weight: ${({ theme }) => theme.tokens.typography.weight.semibold};
  line-height: 1;
  white-space: nowrap;

  ${({ $variant }) => variantStyles[$variant] || variantStyles.default}
  ${({ $size }) => sizeStyles[$size] || sizeStyles.md}
`;

export const Badge = forwardRef(function Badge(
  { children, variant = "default", size = "md", leftIcon, ...props },
  ref
) {
  return (
    <StyledBadge ref={ref} $variant={variant} $size={size} {...props}>
      {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
      {children}
    </StyledBadge>
  );
});

export default Badge;