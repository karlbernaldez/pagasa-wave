import styled from 'styled-components';
import { X } from 'lucide-react';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.tokens.colors.overlay.scrim};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${({ theme }) => theme.tokens.zIndex.modal};
`;

const Dialog = styled.div`
  background: ${({ theme }) => theme.tokens.surfaces.light.raised};
  border-radius: ${({ theme }) => theme.tokens.radius.xl};
  width: 100%;
  max-width: 480px;
  padding: ${({ theme }) => theme.tokens.spacing[4]};
`;

export default function Modal({ title, children, onClose }) {
  return (
    <Overlay role="dialog" aria-modal="true">
      <Dialog>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>{title}</h3>
          <button onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <div>{children}</div>
      </Dialog>
    </Overlay>
  );
}
