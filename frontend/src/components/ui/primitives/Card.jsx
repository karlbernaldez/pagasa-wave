import React, { forwardRef } from "react";
import styled, { css } from "styled-components";

const variantStyles = {
  default: css`
    background: ${({ theme }) => theme.tokens.colors.surface.dark.raised};
    border-color: ${({ theme }) => theme.tokens.colors.border.dark.default};
    box-shadow: ${({ theme }) => theme.tokens.shadows.sm};
  `,

  elevated: css`
    background: ${({ theme }) => theme.tokens.colors.surface.dark.elevated};
    border-color: ${({ theme }) => theme.tokens.colors.border.dark.strong};
    box-shadow: ${({ theme }) => theme.tokens.shadows.lg};
  `,

  studio: css`
    background: ${({ theme }) => theme.tokens.gradients.studioPanel};
    border-color: ${({ theme }) => theme.tokens.colors.studio.panelBorder};
    box-shadow: ${({ theme }) => theme.tokens.shadows.studioPanel};
    backdrop-filter: ${({ theme }) => theme.tokens.blur.lg};
  `,
};

const StyledCard = styled.section`
  width: 100%;
  border: 1px solid;
  border-radius: ${({ theme }) => theme.tokens.radius.xl};
  padding: ${({ theme }) => theme.tokens.spacing[5]};
  color: ${({ theme }) => theme.tokens.colors.text.dark.primary};

  ${({ $variant }) => variantStyles[$variant] || variantStyles.default}
`;

export const Card = forwardRef(function Card(
  { children, variant = "default", as, ...props },
  ref
) {
  return (
    <StyledCard ref={ref} as={as} $variant={variant} {...props}>
      {children}
    </StyledCard>
  );
});

export default Card;