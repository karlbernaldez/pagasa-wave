import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  ChevronDown, ChevronRight,
  Eye, EyeOff, Lock, Unlock, Trash2, GripVertical, Edit2,
  Waves, Wind, TrendingDown, TrendingUp, Layers,
} from 'lucide-react';
import {
  toggleLayerVisibility,
  toggleLayerLock,
  handleDragStart,
  handleDragOver,
  handleDrop,
} from '@dashboards/forecaster/utils/layers';

// ─── Layer type registry ──────────────────────────────────────────────────────
const TYPE_GROUPS = [
  { key: 'wave', label: 'Wave Heights', icon: Waves, match: ['wave', 'swell', 'ocean', 'tide'] },
  { key: 'cyclone', label: 'Tropical Cyclones', icon: Wind, match: ['cyclone', 'typhoon', 'tropical', 'storm', 'track'] },
  { key: 'lpa', label: 'Low Pressure', icon: TrendingDown, match: ['low', 'lpa', 'depression', 'trough'] },
  { key: 'hpa', label: 'High Pressure', icon: TrendingUp, match: ['high', 'hpa', 'ridge', 'anticyclone'] },
  { key: 'other', label: 'Other', icon: Layers, match: [] },
];

// How many rows to show before the group starts scrolling
const GROUP_MAX_ROWS = 5;
const ROW_HEIGHT_PX = 28; // approx px per LayerRow
const GROUP_MAX_HEIGHT = GROUP_MAX_ROWS * ROW_HEIGHT_PX; // 140px

function resolveGroup(layer) {
  const t = (layer.type ?? '').toLowerCase();
  for (const group of TYPE_GROUPS) {
    if (group.match.length && group.match.some((m) => t.includes(m))) return group.key;
  }
  return 'other';
}

// ─── Shared action button ─────────────────────────────────────────────────────
const ActionBtn = ({ onClick, isDarkMode, disabled, danger, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-0.5 rounded transition-colors ${disabled
        ? 'opacity-30 cursor-not-allowed'
        : danger
          ? isDarkMode
            ? 'hover:bg-red-500/20 text-white/30 hover:text-red-400'
            : 'hover:bg-red-500/20 text-slate-400 hover:text-red-500'
          : isDarkMode
            ? 'hover:bg-white/10 text-white/35 hover:text-white/75'
            : 'hover:bg-black/10 text-slate-400 hover:text-slate-700'
      }`}
  >
    {children}
  </button>
);

// ─── Single layer row ─────────────────────────────────────────────────────────
const LayerRow = ({
  layer, index, layers, setLayers, mapRef,
  activeLayerId, onSetActiveLayer,
  editingLayerId, editingName, setEditingName,
  draggedLayerIndex, setDragging, setDraggedLayerIndex,
  startEditing, saveEdit, cancelEdit,
  onRequestDelete, isDarkMode,
}) => {
  const isActive = activeLayerId === layer.id;
  const isEditing = editingLayerId === layer.id;

  return (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, index, setDragging, setDraggedLayerIndex)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, index, draggedLayerIndex, layers, setLayers, setDragging)}
      onClick={() => !isEditing && onSetActiveLayer(layer)}
      className={`
        group relative flex items-center gap-1.5 px-1.5 py-1 rounded-md
        transition-all duration-150 cursor-pointer
        ${isActive
          ? isDarkMode
            ? 'bg-cyan-400/10 border border-cyan-400/30'
            : 'bg-blue-500/10 border border-blue-500/30'
          : isDarkMode
            ? 'hover:bg-white/8 border border-transparent'
            : 'hover:bg-black/5 border border-transparent'
        }
      `}
    >
      {/* Drag handle */}
      <button
        className={`flex-shrink-0 cursor-grab active:cursor-grabbing ${isDarkMode ? 'text-white/15 hover:text-white/40' : 'text-slate-200 hover:text-slate-400'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={10} strokeWidth={2} />
      </button>

      {/* Name / inline editor */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={cancelEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
                if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
              }}
              className={`
                flex-1 px-1 py-0.5 text-[11px] rounded border outline-none
                focus:ring-1 focus:ring-cyan-400/60
                ${isDarkMode
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
                }
              `}
            />
          </div>
        ) : (
          <span className={`block text-[11px] font-medium truncate ${isDarkMode ? 'text-white/75' : 'text-slate-700'
            }`}>
            {layer.name}
          </span>
        )}
      </div>

      {/* Hover-revealed controls */}
      {!isEditing && (
        <div className={`
          flex items-center gap-0.5 flex-shrink-0
          opacity-0 group-hover:opacity-100
          translate-x-1 group-hover:translate-x-0
          transition-all duration-150
        `}>
          <ActionBtn isDarkMode={isDarkMode} onClick={(e) => { e.stopPropagation(); startEditing(layer); }}>
            <Edit2 size={10} strokeWidth={2} />
          </ActionBtn>

          <ActionBtn isDarkMode={isDarkMode} onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(mapRef.current, layer, setLayers); }}>
            {layer.visible
              ? <Eye size={10} strokeWidth={2} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} />
              : <EyeOff size={10} strokeWidth={2} />
            }
          </ActionBtn>

          <ActionBtn isDarkMode={isDarkMode} onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer, setLayers); }}>
            {layer.locked
              ? <Lock size={10} strokeWidth={2} className={isDarkMode ? 'text-orange-400' : 'text-orange-500'} />
              : <Unlock size={10} strokeWidth={2} />
            }
          </ActionBtn>

          <ActionBtn
            isDarkMode={isDarkMode}
            danger
            disabled={layer.locked}
            onClick={(e) => {
              e.stopPropagation();
              if (layer.locked) {
                Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Layer is locked.', showConfirmButton: false, timer: 2000 });
                return;
              }
              onRequestDelete(layer);
            }}
          >
            <Trash2 size={10} strokeWidth={2} />
          </ActionBtn>
        </div>
      )}

      {/* Visibility dot */}
      {!isEditing && (
        <div className={`
          absolute right-2 w-1.5 h-1.5 rounded-full
          opacity-100 group-hover:opacity-0 transition-opacity duration-150
          ${layer.visible
            ? isDarkMode ? 'bg-cyan-400/50' : 'bg-blue-500/40'
            : isDarkMode ? 'bg-white/15' : 'bg-slate-300'
          }
        `} />
      )}
    </div>
  );
};

// ─── Group header row ─────────────────────────────────────────────────────────
const GroupHeader = ({ group, count, isOpen, onToggle, onToggleAll, allVisible, isDarkMode }) => {
  const Icon = group.icon;
  return (
    <div className={`flex items-center gap-1 px-1 py-0.5 rounded-md mb-0.5 group/gh cursor-pointer ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
      }`}>
      <button onClick={onToggle} className="flex items-center gap-1 flex-1 min-w-0">
        {isOpen
          ? <ChevronDown size={9} strokeWidth={3} className={isDarkMode ? 'text-white/35' : 'text-slate-400'} />
          : <ChevronRight size={9} strokeWidth={3} className={isDarkMode ? 'text-white/35' : 'text-slate-400'} />
        }
        <Icon size={9} strokeWidth={2} className={isDarkMode ? 'text-white/45' : 'text-slate-500'} />
        <span className={`text-[9px] font-semibold uppercase tracking-wider truncate ${isDarkMode ? 'text-white/45' : 'text-slate-500'
          }`}>
          {group.label}
        </span>
        <span className={`text-[9px] px-1 py-0.5 rounded font-bold flex-shrink-0 ${isDarkMode ? 'bg-white/8 text-white/35' : 'bg-black/8 text-slate-400'
          }`}>
          {count}
        </span>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleAll(); }}
        title={allVisible ? 'Hide all in group' : 'Show all in group'}
        className={`
          p-0.5 rounded transition-all flex-shrink-0
          opacity-0 group-hover/gh:opacity-100
          ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'}
        `}
      >
        {allVisible
          ? <Eye size={9} strokeWidth={2} className={isDarkMode ? 'text-white/50' : 'text-slate-400'} />
          : <EyeOff size={9} strokeWidth={2} className={isDarkMode ? 'text-white/30' : 'text-slate-300'} />
        }
      </button>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const CustomLayersSection = ({
  layers, setLayers, mapRef, draw,
  expanded, onToggleExpand,
  activeLayerId, onSetActiveLayer,
  editingLayerId, editingName, setEditingName,
  draggedLayerIndex, setDragging, setDraggedLayerIndex,
  startEditing, saveEdit, cancelEdit,
  onRequestDelete, isDarkMode,
}) => {
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(TYPE_GROUPS.map((g) => [g.key, true]))
  );

  const grouped = useMemo(() => {
    const map = Object.fromEntries(TYPE_GROUPS.map((g) => [g.key, []]));
    layers.forEach((layer, index) => map[resolveGroup(layer)].push({ layer, index }));
    return TYPE_GROUPS
      .map((g) => ({ group: g, items: map[g.key] }))
      .filter(({ items }) => items.length > 0);
  }, [layers]);

  const toggleGroup = (key) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleGroupVisibility = (items) => {
    const allVisible = items.every(({ layer }) => layer.visible);
    items.forEach(({ layer }) => {
      if (layer.visible === allVisible)
        toggleLayerVisibility(mapRef.current, layer, setLayers);
    });
  };

  const rowProps = {
    layers, setLayers, mapRef,
    activeLayerId, onSetActiveLayer,
    editingLayerId, editingName, setEditingName,
    draggedLayerIndex, setDragging, setDraggedLayerIndex,
    startEditing, saveEdit, cancelEdit,
    onRequestDelete, isDarkMode,
  };

  return (
    <div className="px-2.5 pt-2.5 pb-2">
      {/* Section header */}
      <button
        onClick={onToggleExpand}
        className={`w-full flex items-center justify-between px-1.5 py-1.5 rounded-lg mb-1.5 transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
          }`}
      >
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-bold ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>
            Annotations
          </span>
          <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isDarkMode ? 'bg-white/10 text-white/55' : 'bg-black/10 text-slate-500'
            }`}>
            {layers.length}
          </div>
        </div>
        <ChevronDown
          size={11}
          strokeWidth={3}
          className={`transition-transform ${expanded ? 'rotate-180' : ''} ${isDarkMode ? 'text-white/50' : 'text-slate-500'
            }`}
        />
      </button>

      {expanded && (
        <div className="space-y-2">
          {grouped.map(({ group, items }) => (
            <div key={group.key}>
              <GroupHeader
                group={group}
                count={items.length}
                isOpen={openGroups[group.key]}
                onToggle={() => toggleGroup(group.key)}
                onToggleAll={() => toggleGroupVisibility(items)}
                allVisible={items.every(({ layer }) => layer.visible)}
                isDarkMode={isDarkMode}
              />

              {openGroups[group.key] && (
                <div
                  className={`pl-2 border-l space-y-0.5 overflow-y-auto ${isDarkMode ? 'border-white/8' : 'border-slate-200/60'
                    }`}
                  style={{
                    maxHeight: `${GROUP_MAX_HEIGHT}px`,
                    scrollbarWidth: 'thin',
                    scrollbarColor: isDarkMode
                      ? 'rgba(255,255,255,0.15) transparent'
                      : 'rgba(0,0,0,0.12) transparent',
                  }}
                >
                  {items.map(({ layer, index }) => (
                    <LayerRow
                      key={layer.id ?? `layer-${index}`}
                      layer={layer}
                      index={index}
                      {...rowProps}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(CustomLayersSection);