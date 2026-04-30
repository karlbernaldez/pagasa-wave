import React, { forwardRef, useId } from "react";
import styled from "styled-components";

const Field = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.tokens.spacing[2]};
  width: 100%;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.tokens.typography.scale.sm};
  font-weight: ${({ theme }) => theme.tokens.typography.weight.semibold};
  color: ${({ theme }) => theme.tokens.colors.text.dark.secondary};
`;

const InputWrap = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.tokens.spacing[2]};
  min-height: 42px;
  padding: 0 ${({ theme }) => theme.tokens.spacing[3]};
  border-radius: ${({ theme }) => theme.tokens.radius.lg};
  border: 1px solid
    ${({ theme, $hasError }) =>
      $hasError
        ? theme.tokens.colors.state.error
        : theme.tokens.colors.border.dark.default};
  background: ${({ theme }) => theme.tokens.colors.surface.dark.raised};
  transition: all ${({ theme }) => theme.tokens.animation.duration.normal};

  &:focus-within {
    border-color: ${({ theme, $hasError }) =>
      $hasError
        ? theme.tokens.colors.state.error
        : theme.tokens.colors.border.dark.focus};
    box-shadow: ${({ theme }) => theme.tokens.shadows.focusDark};
  }
`;

const IconSlot = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.tokens.colors.text.dark.muted};
`;

const StyledInput = styled.input`
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.tokens.colors.text.dark.primary};
  font-size: ${({ theme }) => theme.tokens.typography.scale.sm};
  font-family: ${({ theme }) => theme.tokens.typography.fontFamily.sans};

  &::placeholder {
    color: ${({ theme }) => theme.tokens.colors.text.dark.muted};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const HelperText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.tokens.typography.scale.xs};
  color: ${({ theme, $error }) =>
    $error
      ? theme.tokens.colors.state.error
      : theme.tokens.colors.text.dark.muted};
`;

export const Input = forwardRef(function Input(
  {
    id,
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    disabled,
    required,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;
  const helperId = helperText || error ? `${inputId}-helper` : undefined;

  return (
    <Field>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required ? " *" : ""}
        </Label>
      )}

      <InputWrap $hasError={Boolean(error)}>
        {leftIcon && <IconSlot aria-hidden="true">{leftIcon}</IconSlot>}

        <StyledInput
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={helperId}
          {...props}
        />

        {rightIcon && <IconSlot aria-hidden="true">{rightIcon}</IconSlot>}
      </InputWrap>

      {(error || helperText) && (
        <HelperText id={helperId} $error={Boolean(error)}>
          {error || helperText}
        </HelperText>
      )}
    </Field>
  );
});

export default Input;