import styled, { css } from 'styled-components';

const variants = {
  default: css`
    background: ${({ theme }) => theme.tokens.surfaces.light.raised};
    border: 1px solid ${({ theme }) => theme.tokens.borders.light.subtle};
    box-shadow: ${({ theme }) => theme.tokens.shadows.md};
  `,
  dashboard: css`
    background: ${({ theme }) => theme.tokens.surfaces.light.muted};
    border: 1px solid ${({ theme }) => theme.tokens.borders.light.default};
  `,
  project: css`
    background: ${({ theme }) => theme.tokens.surfaces.light.raised};
    border: 1px solid ${({ theme }) => theme.tokens.colors.brand.primary};
  `,
  'map-panel': css`
    background: ${({ theme }) => theme.tokens.mapPanels.dark.surface};
    border: 1px solid ${({ theme }) => theme.tokens.mapPanels.dark.border};
    box-shadow: ${({ theme }) => theme.tokens.mapPanels.dark.shadow};
  `,
};

const StyledCard = styled.div`
  border-radius: ${({ theme }) => theme.tokens.radius.xl};
  padding: ${({ theme }) => theme.tokens.spacing[4]};
  ${({ $variant }) => variants[$variant] || variants.default}
`;

export default function Card({ variant = 'default', children, ...props }) {
  return (
    <StyledCard $variant={variant} {...props}>
      {children}
    </StyledCard>
  );
}
