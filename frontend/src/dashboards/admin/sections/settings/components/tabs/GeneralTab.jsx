import {
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileText,
  Image,
  MapPinned,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import Accordion from '../ui/Accordion';
import DomainBoundarySettingsSection from '../DomainBoundarySettingsSection';
import { Field, TextareaField } from '../ui/FormFields';
import { labelCls } from '../ui/formFieldStyles';

const MAP_BOUNDS_OPTIONS = [
  {
    value: 'tcad',
    label: 'TCAD default',
    description:
      'Current WaveLab production viewport: west 93, south 0, east 153.8595159535438, north 25.',
  },
  {
    value: 'tcid',
    label: 'TCID default',
    description: 'TCID public viewport: west 116, south 4, east 127, north 22.',
  },
  {
    value: 'custom',
    label: 'Custom bounds',
    description:
      'Use admin-entered west, south, east, and north bounds for published public chart outputs.',
  },
];

const DEFAULT_CUSTOM_BOUNDS = {
  westLng: 93,
  southLat: 0,
  eastLng: 153.8595159535438,
  northLat: 25,
};

function getCustomBounds(settings) {
  return {
    ...DEFAULT_CUSTOM_BOUNDS,
    ...(settings.mapBoundsCustom || {}),
  };
}

function getSavedCustomBounds(settings) {
  return Array.isArray(settings.savedCustomMapBounds) ? settings.savedCustomMapBounds : [];
}

function createCustomBoundsId(name) {
  const slug =
    String(name || 'custom-bounds')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'custom-bounds';
  return `${slug}-${Date.now()}`;
}

function normalizePreset(value) {
  return value === 'philippinesRegional' ? 'tcid' : value || 'tcad';
}


function MapBoundsSelector({
  dark,
  activePreset,
  selectedCustomId,
  savedBounds,
  onSelectPreset,
  onSelectSaved,
  onCreateCustom,
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return undefined;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportPadding = 12;
      const gap = 8;
      const belowSpace = window.innerHeight - rect.bottom - viewportPadding;
      const aboveSpace = rect.top - viewportPadding;
      const placeAbove = belowSpace < 260 && aboveSpace > belowSpace;
      const availableHeight = Math.max(
        180,
        Math.min(420, (placeAbove ? aboveSpace : belowSpace) - gap)
      );

      setMenuStyle({
        position: 'fixed',
        left: Math.max(viewportPadding, rect.left),
        width: Math.max(280, Math.min(rect.width, window.innerWidth - viewportPadding * 2)),
        maxHeight: availableHeight,
        ...(placeAbove
          ? { bottom: window.innerHeight - rect.top + gap }
          : { top: rect.bottom + gap }),
        zIndex: 10000,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      const insideTrigger = rootRef.current?.contains(event.target);
      const insideMenu = menuRef.current?.contains(event.target);
      if (!insideTrigger && !insideMenu) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selectedSaved =
    activePreset === 'custom'
      ? savedBounds.find((bound) => bound.id === selectedCustomId)
      : null;

  const selectedBuiltIn = MAP_BOUNDS_OPTIONS.find(
    (option) => option.value === activePreset && option.value !== 'custom'
  );

  const currentLabel =
    selectedSaved?.name ||
    selectedBuiltIn?.label ||
    (activePreset === 'custom' ? 'New custom bound' : 'Select map bounds');

  const currentDescription =
    selectedSaved
      ? `W ${selectedSaved.westLng} · S ${selectedSaved.southLat} · E ${selectedSaved.eastLng} · N ${selectedSaved.northLat}`
      : selectedBuiltIn?.description ||
        'Create or select a saved custom published-chart extent.';

  const choose = (callback) => {
    callback();
    setOpen(false);
  };

  const optionClass = (active) =>
    `flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${
      active
        ? dark
          ? 'bg-cyan-400/12 text-cyan-100'
          : 'bg-cyan-50 text-cyan-900'
        : dark
          ? 'text-slate-200 hover:bg-white/[0.06]'
          : 'text-slate-700 hover:bg-slate-50'
    }`;

  return (
    <div ref={rootRef} className="relative">
      <label className={labelCls(dark)}>Map Bounds</label>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left shadow-sm transition ${
          open
            ? dark
              ? 'border-cyan-400/50 bg-slate-800 ring-2 ring-cyan-400/10'
              : 'border-cyan-400 bg-white ring-2 ring-cyan-100'
            : dark
              ? 'border-slate-700 bg-slate-800/90 hover:border-slate-600'
              : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <span className="min-w-0">
          <span className={`block truncate text-sm font-black ${
            dark ? 'text-white' : 'text-slate-900'
          }`}>
            {currentLabel}
          </span>
          <span className={`mt-1 block truncate text-xs font-semibold ${
            dark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {currentDescription}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${
            dark ? 'text-slate-400' : 'text-slate-500'
          }`}
        />
      </button>

      {open && menuStyle && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={menuStyle}
          className={`overflow-y-auto overscroll-contain rounded-2xl border p-2 shadow-2xl ${
            dark
              ? 'border-slate-700 bg-slate-900'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div className="px-3 pb-2 pt-1">
            <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${
              dark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Built-in presets
            </p>
          </div>

          {MAP_BOUNDS_OPTIONS.filter((option) => option.value !== 'custom').map((option) => {
            const active = activePreset === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => choose(() => onSelectPreset(option.value))}
                className={optionClass(active)}
              >
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  dark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'
                }`}>
                  <MapPinned size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black">{option.label}</span>
                  <span className={`mt-1 block text-xs font-semibold leading-5 ${
                    dark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {option.description}
                  </span>
                </span>
                {active && <Check size={16} className="mt-1 shrink-0 text-cyan-500" />}
              </button>
            );
          })}

          {savedBounds.length > 0 && (
            <>
              <div className={`mx-2 my-2 border-t ${
                dark ? 'border-white/10' : 'border-slate-200'
              }`} />
              <div className="px-3 pb-2 pt-1">
                <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${
                  dark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Saved custom bounds
                </p>
              </div>

              {savedBounds.map((bound) => {
                const active =
                  activePreset === 'custom' && selectedCustomId === bound.id;

                return (
                  <button
                    key={bound.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => choose(() => onSelectSaved(bound.id))}
                    className={optionClass(active)}
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      dark ? 'bg-cyan-500/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700'
                    }`}>
                      <MapPinned size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black">
                        {bound.name || 'Custom bounds'}
                      </span>
                      <span className={`mt-1 block text-xs font-semibold leading-5 ${
                        dark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        W {bound.westLng} · S {bound.southLat} · E {bound.eastLng} · N {bound.northLat}
                      </span>
                    </span>
                    {active && <Check size={16} className="mt-1 shrink-0 text-cyan-500" />}
                  </button>
                );
              })}
            </>
          )}

          <div className={`mx-2 my-2 border-t ${
            dark ? 'border-white/10' : 'border-slate-200'
          }`} />

          <button
            type="button"
            role="option"
            aria-selected={activePreset === 'custom' && !selectedCustomId}
            onClick={() => choose(onCreateCustom)}
            className={optionClass(activePreset === 'custom' && !selectedCustomId)}
          >
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              dark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
            }`}>
              <Plus size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black">New custom bound</span>
              <span className={`mt-1 block text-xs font-semibold ${
                dark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Create a reusable custom published-chart extent.
              </span>
            </span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function GeneralTab({ settings = {}, setSettings, dark }) {
  const set = (field) => (value) =>
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));

  const setCustomBounds = (field) => (value) =>
    setSettings((prev) => ({
      ...prev,
      mapBoundsCustom: {
        ...getCustomBounds(prev),
        [field]: value,
      },
    }));

  const saveCurrentCustomBounds = () =>
    setSettings((prev) => {
      const name = String(prev.mapBoundsCustomName || '').trim() || 'Custom bounds';
      const activeBounds = getCustomBounds(prev);
      const savedBounds = getSavedCustomBounds(prev);
      const selectedId = prev.selectedCustomMapBoundsId;
      const existingIndex = savedBounds.findIndex((item) => item.id === selectedId);
      const nextRecord = {
        id: existingIndex >= 0 ? savedBounds[existingIndex].id : createCustomBoundsId(name),
        name,
        ...activeBounds,
      };
      const nextSavedBounds =
        existingIndex >= 0
          ? savedBounds.map((item, index) => (index === existingIndex ? nextRecord : item))
          : [...savedBounds, nextRecord];

      return {
        ...prev,
        mapBoundsPreset: 'custom',
        mapBoundsCustomName: name,
        mapBoundsCustom: activeBounds,
        selectedCustomMapBoundsId: nextRecord.id,
        savedCustomMapBounds: nextSavedBounds,
      };
    });

  const loadSavedCustomBounds = (id) =>
    setSettings((prev) => {
      const saved = getSavedCustomBounds(prev).find((item) => item.id === id);
      if (!saved) return { ...prev, selectedCustomMapBoundsId: '' };

      return {
        ...prev,
        mapBoundsPreset: 'custom',
        selectedCustomMapBoundsId: saved.id,
        mapBoundsCustomName: saved.name || 'Custom bounds',
        mapBoundsCustom: {
          westLng: saved.westLng,
          southLat: saved.southLat,
          eastLng: saved.eastLng,
          northLat: saved.northLat,
        },
      };
    });

  const startNewCustomBounds = () =>
    setSettings((prev) => ({
      ...prev,
      mapBoundsPreset: 'custom',
      selectedCustomMapBoundsId: '',
      mapBoundsCustomName: '',
      mapBoundsCustom: {
        ...DEFAULT_CUSTOM_BOUNDS,
      },
    }));

  const duplicateSavedCustomBounds = (id) =>
    setSettings((prev) => {
      const savedBounds = getSavedCustomBounds(prev);
      const source = savedBounds.find((item) => item.id === id);
      if (!source) return prev;

      const copy = {
        ...source,
        id: createCustomBoundsId(`${source.name || 'Custom bounds'} copy`),
        name: `${source.name || 'Custom bounds'} copy`,
      };

      return {
        ...prev,
        mapBoundsPreset: 'custom',
        selectedCustomMapBoundsId: copy.id,
        mapBoundsCustomName: copy.name,
        mapBoundsCustom: {
          westLng: copy.westLng,
          southLat: copy.southLat,
          eastLng: copy.eastLng,
          northLat: copy.northLat,
        },
        savedCustomMapBounds: [...savedBounds, copy],
      };
    });

  const deleteSavedCustomBounds = (id) =>
    setSettings((prev) => {
      const savedBounds = getSavedCustomBounds(prev);
      const nextSavedBounds = savedBounds.filter((item) => item.id !== id);
      const deletingSelected = prev.selectedCustomMapBoundsId === id;

      return {
        ...prev,
        savedCustomMapBounds: nextSavedBounds,
        selectedCustomMapBoundsId: deletingSelected ? '' : prev.selectedCustomMapBoundsId,
        mapBoundsCustomName: deletingSelected ? '' : prev.mapBoundsCustomName,
      };
    });

  const customBounds = getCustomBounds(settings);
  const savedCustomBounds = getSavedCustomBounds(settings);
  const activePreset = normalizePreset(settings.mapBoundsPreset);

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-xl border p-4 text-sm font-semibold leading-6 ${
          dark
            ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100'
            : 'border-cyan-100 bg-cyan-50/80 text-cyan-800'
        }`}
      >
        Every option on this page is used by published chart views or their exported PDF output.
      </div>

      <Accordion icon={FileText} title="Published Chart Output" dark={dark} defaultOpen>
        <TextareaField
          label="Published Chart PDF Note"
          value={settings.publicChartPdfNote ?? ''}
          onChange={set('publicChartPdfNote')}
          rows={4}
          dark={dark}
        />
      </Accordion>

      <Accordion icon={Image} title="PDF Branding" dark={dark}>
        <div className="grid gap-4">
          <Field
            label="Logo URL / app asset path"
            value={settings.logoPreview ?? ''}
            onChange={set('logoPreview')}
            dark={dark}
            placeholder="/pagasa-logo.png"
          />
          <p className={`text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Use an app asset path such as /pagasa-logo.png or an http/https image URL.
          </p>
          {settings.logoPreview && (
            <div
              className={`rounded-xl border p-4 ${
                dark ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <img
                src={settings.logoPreview}
                alt="Published chart PDF logo preview"
                className="h-12 w-auto object-contain"
              />
            </div>
          )}
        </div>
      </Accordion>

      <Accordion icon={UsersRound} title="Public Staff Visibility" dark={dark}>
        <label
          className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${
            settings.showPublicStaffInfo !== false
              ? dark
                ? 'border-cyan-400/30 bg-cyan-400/10'
                : 'border-blue-200 bg-blue-50'
              : dark
                ? 'border-slate-700 bg-slate-800/30'
                : 'border-slate-200 bg-slate-50'
          }`}
        >
          <input
            type="checkbox"
            checked={settings.showPublicStaffInfo !== false}
            onChange={(event) => set('showPublicStaffInfo')(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          <div>
            <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
              Show editors / forecasters publicly
            </p>
            <p className={`text-xs leading-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Controls public chart metadata, chart detail attribution, and exported PDF staff names.
            </p>
          </div>
        </label>
      </Accordion>

      <Accordion icon={MapPinned} title="Published Chart Domain Boundary" dark={dark}>
        <DomainBoundarySettingsSection settings={settings} setSettings={setSettings} dark={dark} />
      </Accordion>

      <Accordion icon={MapPinned} title="Published Chart Map Bounds" dark={dark}>
        <div className="grid gap-4">
          <MapBoundsSelector
            dark={dark}
            activePreset={activePreset}
            selectedCustomId={settings.selectedCustomMapBoundsId || ''}
            savedBounds={savedCustomBounds}
            onSelectPreset={(preset) =>
              setSettings((prev) => ({
                ...prev,
                mapBoundsPreset: preset,
              }))
            }
            onSelectSaved={loadSavedCustomBounds}
            onCreateCustom={startNewCustomBounds}
          />

          {activePreset === 'custom' && (
            <div
              className={`rounded-2xl border p-4 ${
                dark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="grid gap-4">
                <div
                  className={`rounded-2xl border p-4 ${
                    dark ? 'border-slate-700 bg-slate-950/25' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className={`text-sm font-black ${dark ? 'text-white' : 'text-slate-900'}`}>
                        Saved Bounds Manager
                      </p>
                      <p className={`mt-1 text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {savedCustomBounds.length} saved custom bound{savedCustomBounds.length === 1 ? '' : 's'}.
                        Select one to edit or use as the active published-chart extent.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startNewCustomBounds}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-black transition ${
                        dark
                          ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Plus size={14} />
                      New custom bound
                    </button>
                  </div>

                  {savedCustomBounds.length > 0 ? (
                    <div className="mt-4 grid gap-3 xl:grid-cols-2">
                      {savedCustomBounds.map((bound) => {
                        const isSelected = settings.selectedCustomMapBoundsId === bound.id;
                        return (
                          <div
                            key={bound.id}
                            className={`rounded-xl border p-4 transition ${
                              isSelected
                                ? dark
                                  ? 'border-cyan-400/40 bg-cyan-400/10'
                                  : 'border-cyan-300 bg-cyan-50'
                                : dark
                                  ? 'border-white/10 bg-white/[0.025]'
                                  : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className={`truncate text-sm font-black ${dark ? 'text-white' : 'text-slate-900'}`}>
                                    {bound.name || 'Custom bounds'}
                                  </p>
                                  {isSelected && (
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                                      dark
                                        ? 'bg-cyan-400/15 text-cyan-200'
                                        : 'bg-cyan-100 text-cyan-800'
                                    }`}>
                                      <CheckCircle2 size={11} />
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className={`mt-2 text-xs font-semibold leading-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  W {bound.westLng} · S {bound.southLat} · E {bound.eastLng} · N {bound.northLat}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => loadSavedCustomBounds(bound.id)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black transition ${
                                  isSelected
                                    ? dark
                                      ? 'bg-cyan-400/15 text-cyan-100'
                                      : 'bg-cyan-600 text-white'
                                    : dark
                                      ? 'bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                                      : 'bg-white text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <Pencil size={13} />
                                {isSelected ? 'Editing' : 'Edit / use'}
                              </button>

                              <button
                                type="button"
                                onClick={() => duplicateSavedCustomBounds(bound.id)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black transition ${
                                  dark
                                    ? 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                                    : 'bg-white text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <Copy size={13} />
                                Duplicate
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Delete saved bound "${bound.name || 'Custom bounds'}"? This removes it from Settings after you save changes.`
                                    )
                                  ) {
                                    deleteSavedCustomBounds(bound.id);
                                  }
                                }}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black transition ${
                                  dark
                                    ? 'text-rose-300 hover:bg-rose-500/10'
                                    : 'text-rose-600 hover:bg-rose-50'
                                }`}
                              >
                                <Trash2 size={13} />
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      className={`mt-4 rounded-xl border border-dashed px-4 py-6 text-center text-sm font-semibold ${
                        dark
                          ? 'border-white/10 text-slate-500'
                          : 'border-slate-300 text-slate-500'
                      }`}
                    >
                      No custom bounds saved yet. Create one below, then save it to this list.
                    </div>
                  )}
                </div>

                <div
                  className={`rounded-2xl border p-4 ${
                    dark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="mb-4">
                    <p className={`text-sm font-black ${dark ? 'text-white' : 'text-slate-900'}`}>
                      {settings.selectedCustomMapBoundsId ? 'Edit Custom Bound' : 'Create Custom Bound'}
                    </p>
                    <p className={`mt-1 text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {settings.selectedCustomMapBoundsId
                        ? 'Changes update the selected saved record when you use Update saved bound.'
                        : 'Enter a name and coordinates, then save it as a reusable custom bound.'}
                    </p>
                  </div>

                  <Field
                    label="Custom bounds name"
                    value={settings.mapBoundsCustomName ?? ''}
                    onChange={set('mapBoundsCustomName')}
                    dark={dark}
                  />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="West longitude" type="number" value={customBounds.westLng ?? ''} onChange={setCustomBounds('westLng')} dark={dark} />
                  <Field label="South latitude" type="number" value={customBounds.southLat ?? ''} onChange={setCustomBounds('southLat')} dark={dark} />
                  <Field label="East longitude" type="number" value={customBounds.eastLng ?? ''} onChange={setCustomBounds('eastLng')} dark={dark} />
                  <Field label="North latitude" type="number" value={customBounds.northLat ?? ''} onChange={setCustomBounds('northLat')} dark={dark} />
                </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p
                      className={`text-xs font-semibold leading-5 ${
                        dark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Bounds must be ordered west &lt; east and south &lt; north. The backend rejects
                      invalid coordinates instead of silently saving them.
                    </p>
                    <button
                      type="button"
                      onClick={saveCurrentCustomBounds}
                      className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                        dark
                          ? 'bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {settings.selectedCustomMapBoundsId
                        ? 'Update saved bound'
                        : 'Save new bound'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Accordion>
    </div>
  );
}
