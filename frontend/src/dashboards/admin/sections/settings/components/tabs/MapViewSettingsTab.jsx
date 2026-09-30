import {
  Layers3,
  MapPinned,
  MoveHorizontal,
  Plus,
  Scan,
  SquareStack,
  Trash2,
  ZoomIn,
} from 'lucide-react';

import { MAP_STYLE_PRESETS } from '@/config/mapViewDefaults';
import Accordion from '../ui/Accordion';
import { Field } from '../ui/FormFields';
import { inputCls, labelCls } from '../ui/formFieldStyles';

const cn = (...classes) => classes.filter(Boolean).join(' ');

function SectionNote({ dark, children }) {
  return (
    <p
      className={cn('text-xs font-semibold leading-5', dark ? 'text-slate-400' : 'text-slate-500')}
    >
      {children}
    </p>
  );
}

function NumberGrid({ fields, settings, setNested, dark }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {fields.map(({ path, label, step = 'any' }) => (
        <Field
          key={path.join('.')}
          label={label}
          type="number"
          step={step}
          value={path.reduce((value, key) => value?.[key], settings) ?? ''}
          onChange={(value) => setNested(path, value)}
          dark={dark}
        />
      ))}
    </div>
  );
}

const MapViewSettingsTab = ({ settings = {}, setSettings, dark }) => {
  const setNested = (path, value) => {
    setSettings((prev) => {
      const next = { ...prev };
      let target = next;

      path.slice(0, -1).forEach((key) => {
        target[key] = { ...(target[key] || {}) };
        target = target[key];
      });

      target[path[path.length - 1]] = value;
      return next;
    });
  };

  const mapStyle = settings.mapStyle || {};
  const customStyles = Array.isArray(mapStyle.customStyles) ? mapStyle.customStyles : [];
  const themeMode = mapStyle.themeMode || 'adaptive';

  const styleOptions = [
    ...Object.entries(MAP_STYLE_PRESETS).map(([key, config]) => ({
      value: `preset:${key}`,
      label: config.label,
    })),
    ...customStyles.map((style) => ({
      value: `custom:${style.id}`,
      label: style.name,
    })),
  ];

  const addCustomStyle = () => {
    const id = `style-${Date.now().toString(36)}`;
    setNested(
      ['mapStyle', 'customStyles'],
      [
        ...customStyles,
        {
          id,
          name: 'New Map Style',
          url: '',
        },
      ]
    );
  };

  const updateCustomStyle = (id, field, value) => {
    setNested(
      ['mapStyle', 'customStyles'],
      customStyles.map((style) => (style.id === id ? { ...style, [field]: value } : style))
    );
  };

  const removeCustomStyle = (id) => {
    const removedStyleId = `custom:${id}`;
    const nextStyles = customStyles.filter((style) => style.id !== id);

    setSettings((prev) => {
      const current = prev.mapStyle || {};
      return {
        ...prev,
        mapStyle: {
          ...current,
          customStyles: nextStyles,
          lightStyleId:
            current.lightStyleId === removedStyleId ? 'preset:wavelab' : current.lightStyleId,
          darkStyleId:
            current.darkStyleId === removedStyleId ? 'preset:wavelab' : current.darkStyleId,
        },
      };
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Accordion icon={Layers3} title="Basemap Styles" dark={dark} defaultOpen>
        <div className="grid gap-5">
          <SectionNote dark={dark}>
            Choose a separate basemap for WaveLab light and dark themes. Built-in Mapbox styles are
            always available, and admins can add reusable custom Mapbox styles to the library below.
          </SectionNote>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className={labelCls(dark)}>Light theme basemap</label>
              <select
                value={mapStyle.lightStyleId || 'preset:wavelab'}
                onChange={(event) => setNested(['mapStyle', 'lightStyleId'], event.target.value)}
                className={inputCls(dark)}
              >
                {styleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls(dark)}>Dark theme basemap</label>
              <select
                value={mapStyle.darkStyleId || 'preset:wavelab'}
                onChange={(event) => setNested(['mapStyle', 'darkStyleId'], event.target.value)}
                className={inputCls(dark)}
              >
                {styleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls(dark)}>Theme treatment</label>
            <select
              value={themeMode}
              onChange={(event) => setNested(['mapStyle', 'themeMode'], event.target.value)}
              className={inputCls(dark)}
            >
              <option value="adaptive">Adaptive — apply WaveLab light/dark palette</option>
              <option value="native">Native — preserve each Mapbox style exactly</option>
            </select>
          </div>

          <div
            className={cn(
              'rounded-2xl border p-4',
              dark ? 'border-white/10 bg-white/[0.035]' : 'border-slate-200 bg-slate-50/80'
            )}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className={cn('text-sm font-black', dark ? 'text-white' : 'text-slate-900')}>
                  Custom Map Style Library
                </h4>
                <p
                  className={cn(
                    'mt-1 text-xs font-semibold',
                    dark ? 'text-slate-400' : 'text-slate-500'
                  )}
                >
                  Add as many Mapbox styles as needed, then assign any of them to the light or dark
                  theme.
                </p>
              </div>

              <button
                type="button"
                onClick={addCustomStyle}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-black transition-colors',
                  dark
                    ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15'
                    : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                )}
              >
                <Plus size={14} />
                Add Map Style
              </button>
            </div>

            {customStyles.length === 0 ? (
              <div
                className={cn(
                  'rounded-xl border border-dashed px-4 py-6 text-center text-xs font-semibold',
                  dark ? 'border-white/10 text-slate-500' : 'border-slate-300 text-slate-500'
                )}
              >
                No custom map styles added yet.
              </div>
            ) : (
              <div className="grid gap-3">
                {customStyles.map((style) => (
                  <div
                    key={style.id}
                    className={cn(
                      'grid gap-3 rounded-xl border p-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)_auto]',
                      dark ? 'border-white/10 bg-slate-950/20' : 'border-white bg-white shadow-sm'
                    )}
                  >
                    <Field
                      label="Style name"
                      value={style.name}
                      onChange={(value) => updateCustomStyle(style.id, 'name', value)}
                      placeholder="Operational Dark"
                      dark={dark}
                    />
                    <Field
                      label="Mapbox style URL"
                      value={style.url}
                      onChange={(value) => updateCustomStyle(style.id, 'url', value)}
                      placeholder="mapbox://styles/username/style-id"
                      dark={dark}
                    />
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeCustomStyle(style.id)}
                        className={cn(
                          'flex h-[42px] w-[42px] items-center justify-center rounded-xl border transition-colors',
                          dark
                            ? 'border-red-300/15 bg-red-400/[0.06] text-red-300 hover:bg-red-400/10'
                            : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        )}
                        title="Remove map style"
                        aria-label={`Remove ${style.name || 'custom map style'}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p
              className={cn(
                'mt-3 text-[11px] font-semibold leading-5',
                dark ? 'text-slate-500' : 'text-slate-500'
              )}
            >
              Use Mapbox style URLs in the format
              <span className="mx-1 font-mono">
                mapbox://styles/&lt;username&gt;/&lt;style-id&gt;
              </span>
              . The WaveLab Mapbox access token must be authorized to load each style.
            </p>
          </div>
        </div>
      </Accordion>

      <Accordion icon={MapPinned} title="Studio Initial View" dark={dark}>
        <div className="grid gap-4">
          <SectionNote dark={dark}>
            Controls the editor map startup center and initial zoom. These values are the current
            Studio defaults unless changed by an admin.
          </SectionNote>
          <NumberGrid
            settings={settings}
            setNested={setNested}
            dark={dark}
            fields={[
              { path: ['center', 'longitude'], label: 'Center longitude' },
              { path: ['center', 'latitude'], label: 'Center latitude' },
              { path: ['zoom', 'default'], label: 'Default zoom', step: '0.1' },
              { path: ['fitBoundsMaxZoom'], label: 'Fit bounds max zoom', step: '0.1' },
            ]}
          />
        </div>
      </Accordion>

      <Accordion icon={ZoomIn} title="Zoom Limits" dark={dark}>
        <div className="grid gap-4">
          <SectionNote dark={dark}>
            Keep min zoom less than or equal to default zoom, and default zoom less than or equal to
            max zoom.
          </SectionNote>
          <NumberGrid
            settings={settings}
            setNested={setNested}
            dark={dark}
            fields={[
              { path: ['zoom', 'min'], label: 'Minimum zoom', step: '0.1' },
              { path: ['zoom', 'default'], label: 'Default zoom', step: '0.1' },
              { path: ['zoom', 'max'], label: 'Maximum zoom', step: '0.1' },
            ]}
          />
        </div>
      </Accordion>

      <Accordion icon={Scan} title="Maximum Pan Bounds" dark={dark}>
        <div className="grid gap-4">
          <SectionNote dark={dark}>
            Limits how far users can pan in Studio. Bounds must be ordered west &lt; east and south
            &lt; north.
          </SectionNote>
          <NumberGrid
            settings={settings}
            setNested={setNested}
            dark={dark}
            fields={[
              { path: ['maxBounds', 'west'], label: 'West longitude' },
              { path: ['maxBounds', 'south'], label: 'South latitude' },
              { path: ['maxBounds', 'east'], label: 'East longitude' },
              { path: ['maxBounds', 'north'], label: 'North latitude' },
            ]}
          />
        </div>
      </Accordion>

      <Accordion icon={MoveHorizontal} title="Fit Bounds" dark={dark}>
        <div className="grid gap-4">
          <SectionNote dark={dark}>
            Controls the fitted operational viewport after the map initializes. This should usually
            be tighter than the maximum pan bounds.
          </SectionNote>
          <NumberGrid
            settings={settings}
            setNested={setNested}
            dark={dark}
            fields={[
              { path: ['fitBounds', 'west'], label: 'West longitude' },
              { path: ['fitBounds', 'south'], label: 'South latitude' },
              { path: ['fitBounds', 'east'], label: 'East longitude' },
              { path: ['fitBounds', 'north'], label: 'North latitude' },
            ]}
          />
        </div>
      </Accordion>

      <Accordion icon={SquareStack} title="Viewport Padding" dark={dark}>
        <div className="grid gap-4">
          <SectionNote dark={dark}>
            Padding is applied when Studio fits the configured bounds. Values must be between 0 and
            1000 pixels.
          </SectionNote>
          <NumberGrid
            settings={settings}
            setNested={setNested}
            dark={dark}
            fields={[
              { path: ['padding', 'top'], label: 'Top padding' },
              { path: ['padding', 'right'], label: 'Right padding' },
              { path: ['padding', 'bottom'], label: 'Bottom padding' },
              { path: ['padding', 'left'], label: 'Left padding' },
            ]}
          />
        </div>
      </Accordion>
    </div>
  );
};

export default MapViewSettingsTab;
