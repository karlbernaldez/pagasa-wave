import styled, { css } from 'styled-components';

const statusStyles = {
  active: css`background: #DCFCE7; color: #166534;`,
  pending: css`background: #FEF3C7; color: #92400E;`,
  error: css`background: #FEE2E2; color: #991B1B;`,
  archived: css`background: #E2E8F0; color: #334155;`,
};

const StyledBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: ${({ theme }) => theme.tokens.radius.full};
  padding: 4px 10px;
  font-size: ${({ theme }) => theme.tokens.typography.scale.xs};
  font-weight: ${({ theme }) => theme.tokens.typography.weight.semibold};

  ${({ $status }) => statusStyles[$status]}
`;

export default function Badge({ status = 'active', children }) {
  return <StyledBadge $status={status}>{children}</StyledBadge>;
}
