import React, { useState, useEffect, useCallback, useRef } from "react";
import { FaTrash, FaLock, FaLockOpen, FaEye, FaEyeSlash } from "react-icons/fa";
import styled from "styled-components";
import { removeFeature } from "./utils/layerUtils";

const ListItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  padding: 0.4rem 0.6rem;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: ${({ isDarkMode }) => (isDarkMode ? "#fff" : "#222")};
  font-size: 0.8rem;
  cursor: move;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  user-select: none;

  ${({ isActive }) =>
    isActive &&
    `border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);`}
`;

const Name = styled.span`
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${({ isEditing }) => (isEditing ? 600 : 400)};
  cursor: ${({ isEditing }) => (isEditing ? "text" : "pointer")};
`;

const NameInput = styled.input`
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font-weight: 600;
  width: 100%;
  font-size: 0.8rem;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 0.85rem;
  opacity: 0.8;
  padding: 2px;

  &:hover {
    opacity: 1;
    color: ${({ danger }) => (danger ? "#e11d48" : "#3b82f6")};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const LayerItem = ({
  layer,
  toggleLayerVisibility,
  toggleLayerLock,
  removeLayer,
  updateLayerName,
  isActiveLayer,
  setActiveLayer,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  isDarkMode,
  draw,
  mapRef,
  setDragging,
  setDraggedLayerIndex,
  setLayers
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(layer.name);
  const [hasUserModified, setHasUserModified] = useState(false);

  const nameInputRef = useRef(null); // To handle focus on input

  useEffect(() => {
    if (!editedName.trim() && !hasUserModified) {
      setEditedName("Untitled Layer");
    }
  }, [editedName, hasUserModified]);

  const handleNameChange = (e) => {
    setEditedName(e.target.value);
    setHasUserModified(true);
  };

  const finalizeEdit = useCallback(() => {
    const trimmed = editedName.trim();
    if (!trimmed) {
      setEditedName(layer.name);
    }
    setIsEditing(false);

    if (trimmed && trimmed !== layer.name) {
      updateLayerName(layer.id, trimmed, setLayers);
    }
  }, [editedName, layer.id, updateLayerName, setLayers]);

  const handleDelete = () => {
    if (layer.locked) {
      if (window.confirm("Are you sure you want to delete this locked layer?")) {
        removeLayer(layer.id);
      }
    } else {
      removeLayer(layer.id);
      removeFeature(draw, layer.id, layer.sourceID, mapRef);
    }
  };

  const handleVisibilityToggle = (e) => {
    e.stopPropagation();
    toggleLayerVisibility(layer.id);
  };

  const handleLockToggle = (e) => {
    e.stopPropagation();
    toggleLayerLock(layer.id);
  };

  const handleLayerClick = () => {
    setActiveLayer(layer.id);
  };

  return (
    <ListItem
      isDarkMode={isDarkMode}
      isActive={isActiveLayer}
      draggable
      onClick={handleLayerClick}
      onDragStart={(e) => onDragStart(e, index, setDragging, setDraggedLayerIndex)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
    >
      <IconButton onClick={handleVisibilityToggle}>
        {layer.visible ? <FaEye /> : <FaEyeSlash />}
      </IconButton>

      <Name isEditing={isEditing} onDoubleClick={() => setIsEditing(true)}>
        {isEditing ? (
          <NameInput
            ref={nameInputRef}
            value={editedName}
            onChange={handleNameChange}
            onBlur={finalizeEdit}
            onKeyDown={(e) => e.key === "Enter" && finalizeEdit()}
            autoFocus
          />
        ) : (
          editedName || "Untitled Layer"
        )}
      </Name>

      <IconButton onClick={handleLockToggle} disabled={layer.isMap}>
        {layer.locked ? <FaLock /> : <FaLockOpen />}
      </IconButton>

      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        disabled={layer.isMap || layer.locked}
        danger
      >
        <FaTrash />
      </IconButton>
    </ListItem>
  );
};

export default LayerItem;
