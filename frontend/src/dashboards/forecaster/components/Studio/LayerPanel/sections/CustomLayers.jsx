import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  ChevronDown, ChevronRight,
  Eye, EyeOff, Lock, Unlock, Trash2, GripVertical, Edit2,
  Waves, Wind, TrendingDown, TrendingUp, Layers, Check, X, Search, MoreHorizontal,
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
const GROUP_MAX_ROWS = 6;
const ROW_HEIGHT_PX = 42;
const GROUP_MAX_HEIGHT = GROUP_MAX_ROWS * ROW_HEIGHT_PX;

function resolveGroup(layer) {
  const t = (layer.type ?? '').toLowerCase();
  for (const group of TYPE_GROUPS) {
    if (group.match.length && group.match.some((m) => t.includes(m))) return group.key;
  }
  return 'other';
}

// ─── Shared action button ─────────────────────────────────────────────────────
// ─── Single layer row ─────────────────────────────────────────────────────────
const LayerRow = ({
  layer, index, layers, setLayers, mapRef,
  activeLayerId, onSetActiveLayer,
  editingLayerId, editingName, setEditingName,
  draggedLayerIndex, setDragging, setDraggedLayerIndex,
  startEditing, saveEdit, cancelEdit,
  onRequestDelete, isDarkMode,
  openMenuLayerId, setOpenMenuLayerId,
}) => {
  const isActive = activeLayerId === layer.id;
  const isEditing = editingLayerId === layer.id;
  const isLocked = !!layer.locked;
  const isMenuOpen = openMenuLayerId === layer.id;
  const rowTone = isEditing
    ? isDarkMode
      ? 'border-emerald-300/35 bg-emerald-400/[0.08] ring-1 ring-emerald-300/15'
      : 'border-emerald-200 bg-emerald-50/80 ring-1 ring-emerald-200/70'
    : isActive
      ? isDarkMode
        ? 'border-cyan-400/35 bg-cyan-400/10 ring-1 ring-cyan-300/10'
        : 'border-blue-300/70 bg-blue-500/[0.08] ring-1 ring-blue-200/70'
      : isLocked
        ? isDarkMode
          ? 'border-amber-300/20 bg-amber-400/[0.06] hover:border-amber-300/30 hover:bg-amber-400/[0.09]'
          : 'border-amber-200 bg-amber-50/80 hover:border-amber-300 hover:bg-amber-100/70'
        : isDarkMode
          ? 'border-white/10 bg-white/[0.045] hover:border-white/15 hover:bg-white/[0.075]'
          : 'border-white/75 bg-white/[0.54] hover:border-white hover:bg-white/[0.76]';
  const railTone = isEditing
    ? 'bg-emerald-400'
    : isActive
      ? isDarkMode ? 'bg-cyan-400' : 'bg-blue-500'
      : isLocked
        ? 'bg-amber-400'
        : 'bg-transparent';

  const menuButtonTone = isMenuOpen
    ? isDarkMode
      ? 'border-cyan-300/25 bg-cyan-400/[0.12] text-cyan-100'
      : 'border-blue-200 bg-blue-100 text-blue-800'
    : isDarkMode
      ? 'border-transparent text-white/45 hover:border-white/10 hover:bg-white/[0.08] hover:text-white/80'
      : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-800';
  const menuSurface = isDarkMode
    ? 'border-white/10 bg-slate-950/75 shadow-[0_16px_40px_rgba(0,0,0,0.35)]'
    : 'border-white/80 bg-white/90 shadow-[0_16px_36px_rgba(15,23,42,0.12)]';
  const menuItem = (tone = 'default') => {
    if (tone === 'danger') {
      return isDarkMode
        ? 'text-red-200 hover:border-red-300/20 hover:bg-red-500/[0.12]'
        : 'text-red-700 hover:border-red-200 hover:bg-red-50';
    }

    return isDarkMode
      ? 'text-white/70 hover:border-white/10 hover:bg-white/[0.08] hover:text-white/90'
      : 'text-slate-700 hover:border-slate-200 hover:bg-slate-100';
  };
  const closeMenu = () => setOpenMenuLayerId(null);

  return (
    <div className="relative">
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, index, setDragging, setDraggedLayerIndex)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index, draggedLayerIndex, layers, setLayers, setDragging)}
        onClick={() => {
          if (!isEditing) {
            onSetActiveLayer(layer);
            setOpenMenuLayerId(null);
          }
        }}
        className={`
          studio-liquid-control group relative flex min-h-10 items-center gap-1.5 overflow-hidden rounded-lg border px-2 py-1
          transition-all duration-150 cursor-pointer
          ${rowTone}
        `}
      >
        <span className={`absolute bottom-2 left-0 top-2 w-1 rounded-r-full ${railTone}`} />

        <button
          type="button"
          className={`flex h-8 w-6 flex-shrink-0 cursor-grab items-center justify-center active:cursor-grabbing ${isDarkMode ? 'text-white/25 hover:text-white/55' : 'text-slate-300 hover:text-slate-500'
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={13} strokeWidth={2} />
        </button>

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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
                  min-h-8 flex-1 rounded-lg border px-2.5 py-1 text-[12px] font-bold outline-none
                  transition-all focus:ring-2 focus:ring-emerald-400/35
                  ${isDarkMode
                    ? 'bg-slate-950/50 border-white/15 text-white placeholder:text-white/30'
                    : 'bg-white border-emerald-200 text-slate-900 shadow-sm'
                  }
                `}
              />
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); saveEdit(); }}
                title="Save layer name"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${isDarkMode
                  ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15'
                  : 'border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200/70'
                }`}
              >
                <Check size={13} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); cancelEdit(); }}
                title="Cancel rename"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${isDarkMode
                  ? 'border-white/10 bg-white/[0.06] text-white/55 hover:bg-white/[0.1] hover:text-white/80'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`block min-w-0 flex-1 truncate text-[12px] font-black leading-snug ${isDarkMode ? 'text-white/85' : 'text-slate-800'
                  }`}
                title={layer.name}
              >
                {layer.name}
              </span>
              {isLocked && (
                <span className={`hidden rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide sm:inline-flex ${isDarkMode ? 'bg-amber-400/10 text-amber-200/80' : 'bg-amber-200/70 text-amber-800'
                  }`}>
                  Locked
                </span>
              )}
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex shrink-0 items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full ${layer.visible
                ? isDarkMode ? 'bg-cyan-400/70' : 'bg-blue-500/70'
                : isDarkMode ? 'bg-white/[0.18]' : 'bg-slate-300'
              }`}
              title={layer.visible ? 'Visible' : 'Hidden'}
            />
            <button
              type="button"
              title="Layer actions"
              aria-expanded={isMenuOpen}
              onClick={(e) => {
                e.stopPropagation();
                onSetActiveLayer(layer);
                setOpenMenuLayerId(isMenuOpen ? null : layer.id);
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/35 ${menuButtonTone}`}
            >
              <MoreHorizontal size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {isMenuOpen && !isEditing && (
        <div
          className={`ml-8 mt-1 grid grid-cols-2 gap-1 rounded-lg border p-1 backdrop-blur-xl ${menuSurface}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => { startEditing(layer); closeMenu(); }}
            className={`flex min-h-8 items-center gap-2 rounded-md border border-transparent px-2 text-left text-[10px] font-black uppercase tracking-wide transition-colors ${menuItem()}`}
          >
            <Edit2 size={13} strokeWidth={2.3} />
            Rename
          </button>
          <button
            type="button"
            onClick={() => { toggleLayerVisibility(mapRef.current, layer, setLayers); closeMenu(); }}
            className={`flex min-h-8 items-center gap-2 rounded-md border border-transparent px-2 text-left text-[10px] font-black uppercase tracking-wide transition-colors ${menuItem()}`}
          >
            {layer.visible ? <EyeOff size={13} strokeWidth={2.3} /> : <Eye size={13} strokeWidth={2.3} />}
            {layer.visible ? 'Hide' : 'Show'}
          </button>
          <button
            type="button"
            onClick={() => { toggleLayerLock(layer, setLayers); closeMenu(); }}
            className={`flex min-h-8 items-center gap-2 rounded-md border border-transparent px-2 text-left text-[10px] font-black uppercase tracking-wide transition-colors ${menuItem()}`}
          >
            {isLocked ? <Unlock size={13} strokeWidth={2.3} /> : <Lock size={13} strokeWidth={2.3} />}
            {isLocked ? 'Unlock' : 'Lock'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (isLocked) {
                Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Layer is locked.', showConfirmButton: false, timer: 2000 });
                return;
              }
              closeMenu();
              onRequestDelete(layer);
            }}
            className={`flex min-h-8 items-center gap-2 rounded-md border border-transparent px-2 text-left text-[10px] font-black uppercase tracking-wide transition-colors ${menuItem('danger')}`}
          >
            <Trash2 size={13} strokeWidth={2.3} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Group header row ─────────────────────────────────────────────────────────
const GroupHeader = ({ group, count, isOpen, onToggle, onToggleAll, allVisible, isDarkMode }) => {
  const Icon = group.icon;
  return (
    <div className={`group/gh mb-0.5 flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 ${isDarkMode ? 'hover:bg-white/[0.05]' : 'hover:bg-slate-50'
      }`}>
      <button onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-1.5">
        {isOpen
          ? <ChevronDown size={12} strokeWidth={3} className={isDarkMode ? 'text-white/35' : 'text-slate-400'} />
          : <ChevronRight size={12} strokeWidth={3} className={isDarkMode ? 'text-white/35' : 'text-slate-400'} />
        }
        <span className={`flex h-6 w-6 items-center justify-center rounded-md ${isDarkMode ? 'bg-white/[0.08] text-white/55' : 'bg-slate-100 text-slate-500'}`}>
          <Icon size={13} strokeWidth={2} />
        </span>
        <span className={`truncate text-[10px] font-black uppercase tracking-wide ${isDarkMode ? 'text-white/55' : 'text-slate-500'
          }`}>
          {group.label}
        </span>
        <span className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black ${isDarkMode ? 'bg-white/[0.08] text-white/40' : 'bg-slate-100 text-slate-500'
          }`}>
          {count}
        </span>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleAll(); }}
        title={allVisible ? 'Hide all in group' : 'Show all in group'}
        className={`
          flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all
          opacity-100
          ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'}
        `}
      >
        {allVisible
          ? <Eye size={13} strokeWidth={2} className={isDarkMode ? 'text-white/50' : 'text-slate-400'} />
          : <EyeOff size={13} strokeWidth={2} className={isDarkMode ? 'text-white/30' : 'text-slate-300'} />
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
  const [query, setQuery] = useState('');
  const [openMenuLayerId, setOpenMenuLayerId] = useState(null);

  const visibleLayerCount = useMemo(
    () => layers.filter((layer) => layer.visible).length,
    [layers]
  );
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return layers
      .map((layer, index) => ({ layer, index, groupKey: resolveGroup(layer) }))
      .filter(({ layer }) => {
        const matchesQuery = !normalizedQuery
          || `${layer.name ?? ''} ${layer.type ?? ''}`.toLowerCase().includes(normalizedQuery);

        return matchesQuery;
      });
  }, [layers, query]);
  const grouped = useMemo(() => {
    const map = Object.fromEntries(TYPE_GROUPS.map((g) => [g.key, []]));
    filteredItems.forEach(({ layer, index, groupKey }) => map[groupKey].push({ layer, index }));
    return TYPE_GROUPS
      .map((g) => ({ group: g, items: map[g.key] }))
      .filter(({ items }) => items.length > 0);
  }, [filteredItems]);

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
    openMenuLayerId, setOpenMenuLayerId,
  };

  return (
    <div className="px-2 pb-2 pt-2">
      {/* Section header */}
      <button
        onClick={onToggleExpand}
        className={`studio-liquid-control mb-1.5 flex min-h-9 w-full items-center justify-between rounded-lg border px-2.5 py-1.5 transition-colors ${isDarkMode ? 'border-white/10 bg-white/[0.055] hover:bg-white/[0.08]' : 'border-white/80 bg-white/[0.58] hover:bg-white/[0.82]'
          }`}
      >
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-black uppercase tracking-wide ${isDarkMode ? 'text-white/70' : 'text-slate-600'}`}>
            Layer Stack
          </span>
          <div className={`rounded-full px-1.5 py-0.5 text-[9px] font-black tabular-nums ${isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-500/10 text-blue-700'
            }`} title={`${visibleLayerCount} visible`}>
            {layers.length}
          </div>
          <span className={`hidden text-[9px] font-black uppercase tracking-wide sm:inline ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>
            {visibleLayerCount} visible
          </span>
        </div>
        <ChevronDown
          size={14}
          strokeWidth={3}
          className={`transition-transform ${expanded ? 'rotate-180' : ''} ${isDarkMode ? 'text-white/50' : 'text-slate-500'
            }`}
        />
      </button>

      {expanded && (
        <div className="space-y-1.5">
          <div className={`studio-liquid-control rounded-lg border p-1.5 ${isDarkMode ? 'border-white/10 bg-white/[0.045]' : 'border-white/80 bg-white/[0.58]'}`}>
            <div className="relative">
              <Search
                size={13}
                strokeWidth={2.4}
                className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/35' : 'text-slate-400'}`}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search layers"
                className={`min-h-9 w-full rounded-lg border py-1.5 pl-8 pr-2.5 text-[12px] font-bold outline-none transition-colors focus:ring-2 focus:ring-cyan-400/30 ${isDarkMode
                  ? 'border-white/10 bg-slate-950/35 text-white placeholder:text-white/30'
                  : 'border-white/80 bg-white/70 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>
          </div>

          {grouped.length === 0 && (
            <div className={`studio-liquid-control rounded-lg border px-3 py-4 text-center text-sm font-semibold ${isDarkMode ? 'border-white/10 bg-white/[0.045] text-white/35' : 'border-white/80 bg-white/[0.58] text-slate-500'}`}>
              {layers.length ? 'No matching layers' : 'No annotation layers'}
            </div>
          )}
          {grouped.map(({ group, items }) => (
            <div
              key={group.key}
              className={`studio-liquid-control overflow-hidden rounded-lg border ${isDarkMode ? 'border-white/10 bg-white/[0.045]' : 'border-white/80 bg-white/[0.58]'}`}
            >
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
                  className={`space-y-1 overflow-y-auto border-t p-1.5 ${isDarkMode ? 'border-white/[0.08]' : 'border-slate-100'
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
