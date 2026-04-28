import { useState } from 'react';
import { updateLayerName } from '@dashboards/forecaster/utils/layers';

/**
 * Manages inline rename editing and drag-and-drop state for custom layers.
 */
export const useCustomLayerEdit = ({ setLayers, mapRef }) => {
  const [editingLayerId, setEditingLayerId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isDragging, setDragging] = useState(false);
  const [draggedLayerIndex, setDraggedLayerIndex] = useState(null);

  const startEditing = (layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  const saveEdit = () => {
    if (!editingName.trim()) return;
    updateLayerName(editingLayerId, editingName, setLayers, mapRef.current);
    setEditingLayerId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingLayerId(null);
    setEditingName('');
  };

  return {
    editingLayerId,
    editingName,
    setEditingName,
    isDragging,
    setDragging,
    draggedLayerIndex,
    setDraggedLayerIndex,
    startEditing,
    saveEdit,
    cancelEdit,
  };
};