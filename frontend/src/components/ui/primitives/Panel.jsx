import React, { forwardRef } from "react";
import styled, { css } from "styled-components";

const variantStyles = {
  default: css`
    background: ${({ theme }) => theme.tokens.colors.surface.dark.elevated};
    border-color: ${({ theme }) => theme.tokens.colors.border.dark.default};
    box-shadow: ${({ theme }) => theme.tokens.shadows.md};
  `,

  studio: css`
    background: ${({ theme }) => theme.tokens.colors.studio.panelGlass};
    border-color: ${({ theme }) => theme.tokens.colors.studio.panelBorder};
    box-shadow: ${({ theme }) => theme.tokens.shadows.studioPanel};
    backdrop-filter: ${({ theme }) => theme.tokens.blur.lg};
  `,

  floating: css`
    background: ${({ theme }) => theme.tokens.colors.surface.dark.elevated};
    border-color: ${({ theme }) => theme.tokens.colors.border.dark.strong};
    box-shadow: ${({ theme }) => theme.tokens.shadows.xl};
    backdrop-filter: ${({ theme }) => theme.tokens.blur.md};
  `,
};

const StyledPanel = styled.aside`
  width: ${({ $width }) => $width || "100%"};
  max-width: 100%;
  border: 1px solid;
  border-radius: ${({ theme }) => theme.tokens.radius.xl};
  color: ${({ theme }) => theme.tokens.colors.text.dark.primary};
  overflow: hidden;

  ${({ $variant }) => variantStyles[$variant] || variantStyles.default}
`;

const PanelHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.tokens.spacing[3]};
  padding: ${({ theme }) => `${theme.tokens.spacing[4]} ${theme.tokens.spacing[5]}`};
  border-bottom: 1px solid ${({ theme }) => theme.tokens.colors.border.dark.subtle};
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.tokens.typography.scale.sm};
  font-weight: ${({ theme }) => theme.tokens.typography.weight.bold};
  line-height: ${({ theme }) => theme.tokens.typography.lineHeight.tight};
`;

const PanelDescription = styled.p`
  margin: ${({ theme }) => `${theme.tokens.spacing[1]} 0 0`};
  color: ${({ theme }) => theme.tokens.colors.text.dark.muted};
  font-size: ${({ theme }) => theme.tokens.typography.scale.xs};
`;

const PanelBody = styled.div`
  padding: ${({ theme }) => theme.tokens.spacing[5]};
`;

const PanelFooter = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.tokens.spacing[3]};
  padding: ${({ theme }) => `${theme.tokens.spacing[4]} ${theme.tokens.spacing[5]}`};
  border-top: 1px solid ${({ theme }) => theme.tokens.colors.border.dark.subtle};
`;

export const Panel = forwardRef(function Panel(
  {
    children,
    variant = "default",
    width,
    title,
    description,
    actions,
    footer,
    as,
    ...props
  },
  ref
) {
  return (
    <StyledPanel
      ref={ref}
      as={as}
      $variant={variant}
      $width={width}
      {...props}
    >
      {(title || description || actions) && (
        <PanelHeader>
          <div>
            {title && <PanelTitle>{title}</PanelTitle>}
            {description && <PanelDescription>{description}</PanelDescription>}
          </div>
          {actions}
        </PanelHeader>
      )}

      <PanelBody>{children}</PanelBody>

      {footer && <PanelFooter>{footer}</PanelFooter>}
    </StyledPanel>
  );
});

export default Panel;