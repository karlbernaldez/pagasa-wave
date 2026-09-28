import { FileText, Image, MapPinned, UsersRound } from 'lucide-react';

import Accordion from '../ui/Accordion';
import { Field, TextareaField, inputCls, labelCls } from '../ui/FormFields';

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

  const customBounds = getCustomBounds(settings);
  const savedCustomBounds = getSavedCustomBounds(settings);
  const activePreset = normalizePreset(settings.mapBoundsPreset);
  const selectedMapBoundsOption =
    MAP_BOUNDS_OPTIONS.find((option) => option.value === activePreset) || MAP_BOUNDS_OPTIONS[0];

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

      <Accordion icon={MapPinned} title="Published Chart Map Bounds" dark={dark}>
        <div className="grid gap-4">
          <div>
            <label className={labelCls(dark)}>Map Bounds Preset</label>
            <select
              value={activePreset}
              onChange={(event) => set('mapBoundsPreset')(event.target.value)}
              className={inputCls(dark)}
            >
              {MAP_BOUNDS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p
              className={`mt-2 text-xs font-semibold leading-5 ${
                dark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {selectedMapBoundsOption.description}
            </p>
          </div>

          {activePreset === 'custom' && (
            <div
              className={`rounded-2xl border p-4 ${
                dark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="grid gap-4">
                {savedCustomBounds.length > 0 && (
                  <div>
                    <label className={labelCls(dark)}>Saved Custom Bounds</label>
                    <select
                      value={settings.selectedCustomMapBoundsId || ''}
                      onChange={(event) => loadSavedCustomBounds(event.target.value)}
                      className={inputCls(dark)}
                    >
                      <option value="">Select a saved bound</option>
                      {savedCustomBounds.map((bound) => (
                        <option key={bound.id} value={bound.id}>
                          {bound.name || 'Custom bounds'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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

                <div className="flex flex-wrap items-center justify-between gap-3">
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
                      : 'Save named bound'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Accordion>
    </div>
  );
}
