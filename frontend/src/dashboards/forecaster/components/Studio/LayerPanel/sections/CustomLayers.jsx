import React from 'react';
import Swal from 'sweetalert2';
import { ChevronDown, Eye, EyeOff, Lock, Unlock, Trash2, GripVertical, Edit2, Check, X } from 'lucide-react';
import {
  toggleLayerVisibility,
  toggleLayerLock,
  handleDragStart,
  handleDragOver,
  handleDrop,
} from '@dashboards/forecaster/utils/layerUtils';

const CustomLayersSection = ({
  layers,
  setLayers,
  mapRef,
  draw,
  expanded,
  onToggleExpand,
  activeLayerId,
  onSetActiveLayer,
  // Edit state (from useCustomLayerEdit)
  editingLayerId,
  editingName,
  setEditingName,
  draggedLayerIndex,
  setDragging,
  setDraggedLayerIndex,
  startEditing,
  saveEdit,
  cancelEdit,
  // Delete dialog
  onRequestDelete,
  isDarkMode,
}) => (
  <div className="p-3">
    {/* Section header */}
    <button
      onClick={onToggleExpand}
      className={`w-full flex items-center justify-between px-2 py-2 rounded-lg mb-2 transition-colors ${
        isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>
          Custom Layers
        </span>
        <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
          isDarkMode ? 'bg-white/10 text-white/70' : 'bg-black/10 text-slate-700'
        }`}>
          {layers.length}
        </div>
      </div>
      <ChevronDown
        size={12}
        strokeWidth={3}
        className={`transition-transform ${expanded ? 'rotate-180' : ''} ${
          isDarkMode ? 'text-white/60' : 'text-slate-600'
        }`}
      />
    </button>

    {expanded && (
      <div className="space-y-1">
        {layers.map((layer, index) => (
          <div
            key={layer.id || `layer-${index}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index, setDragging, setDraggedLayerIndex)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index, draggedLayerIndex, layers, setLayers, setDragging)}
            onClick={() => onSetActiveLayer(layer.id)}
            className={`group flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
              activeLayerId === layer.id
                ? isDarkMode
                  ? 'bg-cyan-400/10 border border-cyan-400/30'
                  : 'bg-blue-500/10 border border-blue-500/30'
                : isDarkMode
                  ? 'bg-white/5 hover:bg-white/10 border border-transparent'
                  : 'bg-black/5 hover:bg-black/10 border border-transparent'
            }`}
          >
            {/* Drag handle */}
            <button
              className={`cursor-grab active:cursor-grabbing ${
                isDarkMode ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={14} strokeWidth={2} />
            </button>

            {/* Name / inline editor */}
            <div className="flex-1 min-w-0">
              {editingLayerId === layer.id ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')  { e.preventDefault(); saveEdit();   }
                      if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                    }}
                    className={`flex-1 px-1 py-0.5 text-xs rounded border outline-none focus:ring-1 focus:ring-cyan-400 ${
                      isDarkMode
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                    autoFocus
                  />
                  
                </div>
              ) : (
                <div className={`text-xs font-medium truncate ${
                  isDarkMode ? 'text-white/90' : 'text-slate-800'
                }`}>
                  {layer.name}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <ActionBtn onClick={(e) => { e.stopPropagation(); startEditing(layer); }} isDarkMode={isDarkMode}>
                <Edit2 size={12} strokeWidth={2} />
              </ActionBtn>

              <ActionBtn
                onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(mapRef.current, layer, setLayers); }}
                isDarkMode={isDarkMode}
              >
                {layer.visible
                  ? <Eye    size={14} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} strokeWidth={2} />
                  : <EyeOff size={14} className={isDarkMode ? 'text-white/40' : 'text-slate-400'} strokeWidth={2} />
                }
              </ActionBtn>

              <ActionBtn
                onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer, setLayers); }}
                isDarkMode={isDarkMode}
              >
                {layer.locked
                  ? <Lock   size={14} className={isDarkMode ? 'text-orange-400' : 'text-orange-600'} strokeWidth={2} />
                  : <Unlock size={14} className={isDarkMode ? 'text-white/40'   : 'text-slate-400'}  strokeWidth={2} />
                }
              </ActionBtn>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (layer.locked) {
                    Swal.fire({
                      toast: true, position: 'top-end', icon: 'warning',
                      title: 'This layer is locked and cannot be deleted.',
                      showConfirmButton: false, timer: 2000,
                    });
                    return;
                  }
                  onRequestDelete(layer);
                }}
                disabled={layer.locked}
                className={`p-1 rounded transition-colors ${
                  layer.locked
                    ? 'opacity-40 cursor-not-allowed'
                    : isDarkMode
                      ? 'hover:bg-red-500/20 text-white/40 hover:text-red-400'
                      : 'hover:bg-red-500/20 text-slate-400 hover:text-red-600'
                }`}
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Tiny shared icon button to keep the JSX above clean
const ActionBtn = ({ onClick, isDarkMode, children }) => (
  <button
    onClick={onClick}
    className={`p-1 rounded transition-colors ${
      isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
    }`}
  >
    {children}
  </button>
);

export default React.memo(CustomLayersSection);