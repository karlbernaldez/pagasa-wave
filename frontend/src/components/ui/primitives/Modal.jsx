import React, { forwardRef, useEffect } from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import { Button } from "./Button";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.tokens.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.tokens.spacing[4]};
  background: ${({ theme }) => theme.tokens.colors.overlay.scrim};
  backdrop-filter: ${({ theme }) => theme.tokens.blur.md};
`;

const Dialog = styled.div`
  width: 100%;
  max-width: ${({ $size }) => {
    if ($size === "sm") return "420px";
    if ($size === "lg") return "720px";
    return "560px";
  }};
  border: 1px solid ${({ theme }) => theme.tokens.colors.border.dark.default};
  border-radius: ${({ theme }) => theme.tokens.radius["2xl"]};
  background: ${({ theme }) => theme.tokens.colors.surface.dark.raised};
  color: ${({ theme }) => theme.tokens.colors.text.dark.primary};
  box-shadow: ${({ theme }) => theme.tokens.shadows.xl};
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.tokens.spacing[4]};
  padding: ${({ theme }) => theme.tokens.spacing[5]};
  border-bottom: 1px solid ${({ theme }) => theme.tokens.colors.border.dark.subtle};
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.tokens.typography.scale.lg};
  font-weight: ${({ theme }) => theme.tokens.typography.weight.bold};
`;

const Description = styled.p`
  margin: ${({ theme }) => `${theme.tokens.spacing[1]} 0 0`};
  color: ${({ theme }) => theme.tokens.colors.text.dark.muted};
  font-size: ${({ theme }) => theme.tokens.typography.scale.sm};
  line-height: ${({ theme }) => theme.tokens.typography.lineHeight.normal};
`;

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.tokens.radius.full};
  color: ${({ theme }) => theme.tokens.colors.text.dark.muted};
  background: transparent;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.tokens.colors.studio.controlHover};
    color: ${({ theme }) => theme.tokens.colors.text.dark.primary};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.tokens.shadows.focusDark};
  }
`;

const Body = styled.div`
  padding: ${({ theme }) => theme.tokens.spacing[5]};
`;

const Footer = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.tokens.spacing[3]};
  padding: ${({ theme }) => theme.tokens.spacing[5]};
  border-top: 1px solid ${({ theme }) => theme.tokens.colors.border.dark.subtle};
`;

export const Modal = forwardRef(function Modal(
  {
    open,
    title,
    description,
    children,
    footer,
    size = "md",
    onClose,
    closeLabel = "Close modal",
    ...props
  },
  ref
) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Overlay onMouseDown={onClose}>
      <Dialog
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "ds-modal-title" : undefined}
        aria-describedby={description ? "ds-modal-description" : undefined}
        $size={size}
        onMouseDown={(event) => event.stopPropagation()}
        {...props}
      >
        {(title || description || onClose) && (
          <Header>
            <div>
              {title && <Title id="ds-modal-title">{title}</Title>}
              {description && (
                <Description id="ds-modal-description">
                  {description}
                </Description>
              )}
            </div>

            {onClose && (
              <CloseButton type="button" aria-label={closeLabel} onClick={onClose}>
                <X size={18} aria-hidden="true" />
              </CloseButton>
            )}
          </Header>
        )}

        <Body>{children}</Body>

        {footer && <Footer>{footer}</Footer>}
      </Dialog>
    </Overlay>
  );
});

export default Modal;