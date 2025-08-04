import React from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex; justify-content: center; align-items: center;
  z-index: 1100;
`;

const ModalContainer = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 320px;
  text-align: center;
`;

const ImageOption = styled.img`
  width: 60px;
  height: 60px;
  margin: 8px;
  cursor: pointer;
  border-radius: 8px;
  border: 2px solid transparent;

  &:hover, &.selected {
    border-color: #2563eb;
  }
`;

const MarkerImageChoiceModal = ({ isOpen, onClose, onSelect, options = [], selectedKey }) => {
  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <h3>Select Marker Image</h3>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
          {options.map(({ key, src, label }) => (
            <div key={key} onClick={() => onSelect(key)} title={label}>
              <ImageOption
                src={src}
                alt={label}
                className={selectedKey === key ? 'selected' : ''}
              />
            </div>
          ))}
        </div>
      </ModalContainer>
    </Overlay>
  );
};

export default MarkerImageChoiceModal;
