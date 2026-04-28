import styled from 'styled-components';
import { AlertCircle, Loader2 } from 'lucide-react';

export const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.tokens.spacing[2]};
`;

export const Label = styled.label`
  font-size: ${({ theme }) => theme.tokens.typography.scale.sm};
  font-weight: ${({ theme }) => theme.tokens.typography.weight.semibold};
  color: ${({ theme }) => theme.tokens.colors.text.light.primary};
`;

export const StyledInput = styled.input`
  border-radius: ${({ theme }) => theme.tokens.radius.lg};
  border: 1px solid ${({ theme }) => theme.tokens.colors.border.light.default};
  padding: ${({ theme }) => theme.tokens.spacing[3]};
  font-size: ${({ theme }) => theme.tokens.typography.scale.md};
  &:focus { outline: none; box-shadow: ${({ theme }) => theme.tokens.shadows.focus}; }
`;

export function Input({ id, label, error, ...props }) {
  return (
    <InputWrapper>
      {label && <Label htmlFor={id}>{label}</Label>}
      <StyledInput id={id} {...props} aria-invalid={!!error} />
      {error && <span style={{ color: 'red', fontSize: 12 }}>{error}</span>}
    </InputWrapper>
  );
}

export const Card = styled.div`
  border-radius: ${({ theme }) => theme.tokens.radius.xl};
  background: ${({ theme }) => theme.tokens.colors.surface.light.raised};
  border: 1px solid ${({ theme }) => theme.tokens.colors.border.light.subtle};
  box-shadow: ${({ theme }) => theme.tokens.shadows.md};
  padding: ${({ theme }) => theme.tokens.spacing[4]};
`;

export function Badge({ children }) {
  return (
    <span style={{
      background: '#E0F2FE',
      color: '#0369A1',
      padding: '4px 8px',
      borderRadius: '999px',
      fontSize: 12,
      fontWeight: 600
    }}>{children}</span>
  );
}

export function LoadingState() {
  return <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Loader2 className="animate-spin" /> Loading...</div>;
}

export function ErrorState({ message }) {
  return <div style={{ color: 'red', display: 'flex', gap: 8 }}><AlertCircle /> {message}</div>;
}

export function EmptyState({ message }) {
  return <div style={{ opacity: 0.6 }}>{message}</div>;
}
