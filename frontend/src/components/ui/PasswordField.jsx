import { useId, useState } from 'react';
import styled from 'styled-components';
import { Eye, EyeOff } from 'lucide-react';

import Input from './Input.jsx';
import Button from './Button.jsx';

const FieldShell = styled.div`
  position: relative;
`;

const Toggle = styled.div`
  position: absolute;
  right: ${({ theme }) => theme.tokens.spacing[2]};
  top: 50%;
  transform: translateY(-50%);
`;

export default function PasswordField({
  id,
  label = 'Password',
  value,
  onChange,
  autoComplete = 'current-password',
  showLabel = 'Show password',
  hideLabel = 'Hide password',
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <FieldShell>
      <Input
        id={inputId}
        label={label}
        type={isVisible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        style={{ paddingRight: '48px' }}
        {...props}
      />

      <Toggle>
        <Button
          type="button"
          variant="icon"
          size="sm"
          aria-label={isVisible ? hideLabel : showLabel}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((current) => !current)}
        >
          {isVisible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </Button>
      </Toggle>
    </FieldShell>
  );
}
