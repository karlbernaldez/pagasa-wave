import styled, { css } from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.tokens.spacing[1]};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.tokens.typography.scale.sm};
  font-weight: ${({ theme }) => theme.tokens.typography.weight.semibold};
  color: ${({ theme }) => theme.tokens.colors.text.light.primary};
`;

const Hint = styled.span`
  font-size: ${({ theme }) => theme.tokens.typography.scale.xs};
  color: ${({ theme }) => theme.tokens.colors.text.light.muted};
`;

const Field = styled.input`
  border-radius: ${({ theme }) => theme.tokens.radius.lg};
  border: 1px solid ${({ theme }) => theme.tokens.colors.border.light.default};
  padding: ${({ theme }) => theme.tokens.spacing[3]};
  font-size: ${({ theme }) => theme.tokens.typography.scale.md};
  background: ${({ theme }) => theme.tokens.colors.surface.light.raised};

  ${({ $state, theme }) =>
    $state === 'error' &&
    css`
      border-color: ${theme.tokens.colors.state.error};
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    `}

  ${({ $state, theme }) =>
    $state === 'success' &&
    css`
      border-color: ${theme.tokens.colors.state.success};
    `}

  &:focus {
    outline: none;
    box-shadow: ${({ theme }) => theme.tokens.shadows.focus};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Message = styled.span`
  font-size: ${({ theme }) => theme.tokens.typography.scale.xs};
`;

export default function Input({
  id,
  label,
  hint,
  error,
  success,
  required,
  disabled,
  ...props
}) {
  const message = error || success;
  const state = error ? 'error' : success ? 'success' : 'default';

  return (
    <Wrapper>
      {label && (
        <Label htmlFor={id}>
          {label} {required && '*'}
        </Label>
      )}

      <Field
        id={id}
        $state={state}
        disabled={disabled}
        aria-invalid={!!error}
        aria-required={required}
        {...props}
      />

      {hint && !error && <Hint>{hint}</Hint>}

      {message && (
        <Message style={{ color: error ? 'red' : 'green' }}>
          {message}
        </Message>
      )}
    </Wrapper>
  );
}
