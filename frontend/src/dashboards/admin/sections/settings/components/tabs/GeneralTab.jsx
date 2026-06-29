// ╔══════════════════════════════════════════════════════╗
// ║                 tabs/GeneralTab.jsx                  ║
// ║  Accordions: Public Content, Branding, Map, Maintenance ║
// ╚══════════════════════════════════════════════════════╝

import { Globe, Image, Shield, AlertTriangle, MapPinned, UsersRound } from 'lucide-react';
import Accordion from '../ui/Accordion';
import { Field, TextareaField, inputCls, labelCls } from '../ui/FormFields';

const MAP_BOUNDS_OPTIONS = [
  {
    value: 'tcad',
    label: 'TCAD default',
    description: 'Current WaveLab production viewport: west 93, south 0, east 153.8595159535438, north 25.',
  },
  {
    value: 'tcid',
    label: 'TCID default',
    description: 'TCID public viewport: west 116, south 4, east 127, north 22.',
  },
  {
    value: 'custom',
    label: 'Custom bounds',
    description: 'Use admin-entered west, south, east, and north bounds for published public chart outputs.',
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
  const slug = String(name || 'custom-bounds')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'custom-bounds';
  return `${slug}-${Date.now()}`;
}

function normalizePreset(value) {
  return value === 'philippinesRegional' ? 'tcid' : (value || 'tcad');
}

const GeneralTab = ({ settings = {}, setSettings, dark }) => {

  /* =========================================================
     SAFE FIELD SETTER (no mutation, undo-ready)
  ========================================================= */

  const set = (field) => (val) =>
    setSettings(prev => ({
      ...prev,
      [field]: val,
    }));

  const setCustomBounds = (field) => (value) =>
    setSettings(prev => ({
      ...prev,
      mapBoundsCustom: {
        ...getCustomBounds(prev),
        [field]: value,
      },
    }));

  const saveCurrentCustomBounds = () =>
    setSettings(prev => {
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
      const nextSavedBounds = existingIndex >= 0
        ? savedBounds.map((item, index) => index === existingIndex ? nextRecord : item)
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
    setSettings(prev => {
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


  /* =========================================================
     FILE UPLOAD (history-safe)
  ========================================================= */

  const onLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      set('logoPreview')(String(reader.result));
    };
    reader.readAsDataURL(file);

    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const customBounds = getCustomBounds(settings);
  const savedCustomBounds = getSavedCustomBounds(settings);
  const activePreset = normalizePreset(settings.mapBoundsPreset);
  const selectedMapBoundsOption = MAP_BOUNDS_OPTIONS.find((option) => option.value === activePreset) || MAP_BOUNDS_OPTIONS[0];


  return (
    <div className="flex flex-col gap-4">

      {/* ─────────────────────────────────────────────── */}
      {/* Public Content */}
      {/* ─────────────────────────────────────────────── */}

      <Accordion icon={Globe} title="Public Content" dark={dark} defaultOpen>
        <div className="grid gap-4">

          <Field
            label="Dashboard Title"
            value={settings.publicDashboardTitle ?? ''}
            onChange={set('publicDashboardTitle')}
            dark={dark}
          />

          <TextareaField
            label="Public Description"
            value={settings.publicDescription ?? ''}
            onChange={set('publicDescription')}
            dark={dark}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Field
              label="Alert Email"
              type="email"
              value={settings.contactEmail ?? ''}
              onChange={set('contactEmail')}
              dark={dark}
            />

            <Field
              label="Default Region"
              value={settings.defaultRegion ?? ''}
              onChange={set('defaultRegion')}
              dark={dark}
            />

          </div>

        </div>
      </Accordion>


      {/* ─────────────────────────────────────────────── */}
      {/* Branding */}
      {/* ─────────────────────────────────────────────── */}

      <Accordion icon={Image} title="Branding" dark={dark}>
        <div className="flex flex-col gap-4">

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-400">
              Upload Logo
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={onLogoUpload}
              className={`w-full text-sm rounded-xl border p-3 ${
                dark
                  ? 'border-slate-700 text-slate-300 bg-slate-800'
                  : 'border-slate-200 text-slate-600 bg-white'
              }`}
            />
          </div>

          {settings.logoPreview && (
            <div className={`p-4 rounded-xl border ${
              dark
                ? 'border-slate-700 bg-slate-800/40'
                : 'border-slate-200 bg-slate-50'
            }`}>
              <p className={`text-xs mb-3 ${
                dark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Preview
              </p>

              <img
                src={settings.logoPreview}
                alt="Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
          )}

        </div>
      </Accordion>

      {/* ─────────────────────────────────────────────── */}
      {/* Public Staff Visibility */}
      {/* ─────────────────────────────────────────────── */}

      <Accordion icon={UsersRound} title="Public Staff Visibility" dark={dark}>
        <div className="grid gap-4">
          <label className={`flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
            settings.showPublicStaffInfo !== false
              ? dark
                ? 'border-cyan-400/30 bg-cyan-400/10'
                : 'border-blue-200 bg-blue-50'
              : dark
                ? 'border-slate-700 bg-slate-800/30'
                : 'border-slate-200 bg-slate-50'
          }`}>
            <div className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${settings.showPublicStaffInfo !== false ? 'bg-cyan-500' : dark ? 'bg-slate-700' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${settings.showPublicStaffInfo !== false ? 'left-6' : 'left-1'}`} />
              <input
                type="checkbox"
                checked={settings.showPublicStaffInfo !== false}
                onChange={(e) => set('showPublicStaffInfo')(e.target.checked)}
                className="sr-only"
              />
            </div>
            <div>
              <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Show editors / forecasters publicly</p>
              <p className={`text-xs leading-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Controls whether public chart cards, chart detail metadata, and exports show the forecaster/editor names.</p>
            </div>
          </label>
        </div>
      </Accordion>

      {/* ─────────────────────────────────────────────── */}
      {/* Published Map Bounds */}
      {/* ─────────────────────────────────────────────── */}

      <Accordion icon={MapPinned} title="Published Chart Map Bounds" dark={dark}>
        <div className="grid gap-4">
          <div>
            <label className={labelCls(dark)}>Map Bounds Preset</label>
            <select
              value={activePreset}
              onChange={(e) => set('mapBoundsPreset')(e.target.value)}
              className={inputCls(dark)}
            >
              {MAP_BOUNDS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className={`mt-2 text-xs font-semibold leading-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              {selectedMapBoundsOption.description}
            </p>
          </div>

          {activePreset === 'custom' && (
            <div className={`rounded-2xl border p-4 ${dark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
              <div className="grid gap-4">
                {savedCustomBounds.length > 0 && (
                  <div>
                    <label className={labelCls(dark)}>Saved Custom Bounds</label>
                    <select
                      value={settings.selectedCustomMapBoundsId || ''}
                      onChange={(e) => loadSavedCustomBounds(e.target.value)}
                      className={inputCls(dark)}
                    >
                      <option value="">Select a saved bound</option>
                      {savedCustomBounds.map((bound) => (
                        <option key={bound.id} value={bound.id}>{bound.name || 'Custom bounds'}</option>
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
                  <Field
                    label="West longitude"
                    type="number"
                    value={customBounds.westLng ?? ''}
                    onChange={setCustomBounds('westLng')}
                    dark={dark}
                  />
                  <Field
                    label="South latitude"
                    type="number"
                    value={customBounds.southLat ?? ''}
                    onChange={setCustomBounds('southLat')}
                    dark={dark}
                  />
                  <Field
                    label="East longitude"
                    type="number"
                    value={customBounds.eastLng ?? ''}
                    onChange={setCustomBounds('eastLng')}
                    dark={dark}
                  />
                  <Field
                    label="North latitude"
                    type="number"
                    value={customBounds.northLat ?? ''}
                    onChange={setCustomBounds('northLat')}
                    dark={dark}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className={`text-xs font-semibold leading-5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Bounds must be ordered west &lt; east and south &lt; north. Invalid values automatically fall back to TCAD bounds in public chart rendering.
                  </p>
                  <button
                    type="button"
                    onClick={saveCurrentCustomBounds}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition ${dark ? 'bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {settings.selectedCustomMapBoundsId ? 'Update saved bound' : 'Save named bound'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Accordion>


      {/* ─────────────────────────────────────────────── */}
      {/* Maintenance Mode */}
      {/* ─────────────────────────────────────────────── */}

      <Accordion icon={Shield} title="Maintenance Mode" dark={dark}>
        <div className="flex flex-col gap-4">

          <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
            settings.maintenanceMode
              ? dark
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-amber-300 bg-amber-50'
              : dark
                ? 'border-slate-700 bg-slate-800/30'
                : 'border-slate-200 bg-slate-50'
          }`}>

            {/* Toggle */}
            <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
              settings.maintenanceMode
                ? 'bg-amber-500'
                : dark
                  ? 'bg-slate-700'
                  : 'bg-slate-300'
            }`}>

              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                settings.maintenanceMode ? 'left-6' : 'left-1'
              }`} />

              <input
                type="checkbox"
                checked={!!settings.maintenanceMode}
                onChange={(e) =>
                  set('maintenanceMode')(e.target.checked)
                }
                className="sr-only"
              />
            </div>

            <div>
              <p className={`text-sm font-semibold ${
                dark ? 'text-white' : 'text-slate-900'
              }`}>
                Enable Maintenance Mode
              </p>

              <p className={`text-xs ${
                dark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Displays a message to all public visitors
              </p>
            </div>

            {settings.maintenanceMode && (
              <span className="ml-auto text-xs font-bold text-amber-500 flex items-center gap-1">
                <AlertTriangle size={12} />
                Active
              </span>
            )}

          </label>

          {/* Only editable if enabled */}
          {settings.maintenanceMode && (
            <TextareaField
              label="Maintenance Message"
              value={settings.maintenanceMessage ?? ''}
              onChange={set('maintenanceMessage')}
              dark={dark}
            />
          )}

        </div>
      </Accordion>

    </div>
  );
};

export default GeneralTab;
