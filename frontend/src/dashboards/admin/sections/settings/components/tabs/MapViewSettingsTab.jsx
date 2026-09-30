import { Layers3, MapPinned, MoveHorizontal, Scan, SquareStack, ZoomIn } from 'lucide-react';

import { MAP_STYLE_PRESETS } from '@/config/mapViewDefaults';
import Accordion from '../ui/Accordion';
import { Field } from '../ui/FormFields';
import { inputCls, labelCls } from '../ui/formFieldStyles';

const cn = (...classes) => classes.filter(Boolean).join(' ');

function SectionNote({ dark, children }) {
  return (
    <p className={cn('text-xs font-semibold leading-5', dark ? 'text-slate-400' : 'text-slate-500')}>
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
  const preset = mapStyle.preset || 'wavelab';
  const themeMode = mapStyle.themeMode || 'adaptive';

  return (
    <div className="flex flex-col gap-4">
      <Accordion icon={Layers3} title="Basemap Style" dark={dark} defaultOpen>
        <div className="grid gap-4">
          <SectionNote dark={dark}>
            Select the Mapbox basemap used in Studio. Choose Adaptive to let WaveLab recolor the selected style for light and dark mode, or Native to preserve the Mapbox style exactly as authored.
          </SectionNote>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className={labelCls(dark)}>Map style</label>
              <select
                value={preset}
                onChange={(event) => setNested(['mapStyle', 'preset'], event.target.value)}
                className={inputCls(dark)}
              >
                {Object.entries(MAP_STYLE_PRESETS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls(dark)}>Theme treatment</label>
              <select
                value={themeMode}
                onChange={(event) => setNested(['mapStyle', 'themeMode'], event.target.value)}
                className={inputCls(dark)}
              >
                <option value="adaptive">Adaptive — follow WaveLab light/dark mode</option>
                <option value="native">Native — preserve Mapbox style colors</option>
              </select>
            </div>
          </div>

          {preset === 'custom' && (
            <Field
              label="Custom Mapbox style URL"
              value={mapStyle.customStyleUrl || ''}
              onChange={(value) => setNested(['mapStyle', 'customStyleUrl'], value)}
              placeholder="mapbox://styles/username/style-id"
              dark={dark}
            />
          )}

          <div
            className={cn(
              'rounded-xl border px-4 py-3 text-xs font-semibold leading-5',
              dark
                ? 'border-white/10 bg-white/[0.04] text-slate-400'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            )}
          >
            Custom styles must use the Mapbox style URL format
            <span className="mx-1 font-mono">mapbox://styles/&lt;username&gt;/&lt;style-id&gt;</span>.
            The configured WaveLab Mapbox access token must also be authorized to load that style.
          </div>
        </div>
      </Accordion>

      <Accordion icon={MapPinned} title="Studio Initial View" dark={dark}>
        <div className="grid gap-4">
          <SectionNote dark={dark}>
            Controls the editor map startup center and initial zoom. These values are the current Studio defaults unless changed by an admin.
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
            Keep min zoom less than or equal to default zoom, and default zoom less than or equal to max zoom.
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
            Limits how far users can pan in Studio. Bounds must be ordered west &lt; east and south &lt; north.
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
            Controls the fitted operational viewport after the map initializes. This should usually be tighter than the maximum pan bounds.
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
            Padding is applied when Studio fits the configured bounds. Values must be between 0 and 1000 pixels.
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
