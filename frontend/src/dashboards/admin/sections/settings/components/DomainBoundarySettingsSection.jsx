import { FileUp, MapPinned, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Field, inputCls, labelCls } from './ui/FormFields';
import {
  boundaryFileToGeoJson,
  coordinatesTextToGeoJson,
} from '../utils/domainBoundaryImport';

const DEFAULT_BOUNDARY = {
  enabled: false,
  name: 'Published chart domain',
  showLine: true,
  showFill: false,
  clipAnnotations: false,
  lineColor: '#0f172a',
  lineWidth: 2,
  lineOpacity: 0.9,
  fillColor: '#38bdf8',
  fillOpacity: 0.08,
  geojson: {
    type: 'FeatureCollection',
    features: [],
  },
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

function NumberField({ label, value, onChange, min, max, step, dark }) {
  return (
    <div>
      <label className={labelCls(dark)}>{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        onChange={(event) => onChange(Number(event.target.value))}
        className={inputCls(dark)}
      />
    </div>
  );
}

function Toggle({ label, checked, onChange, dark, description }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border p-3',
        dark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
      />
      <span>
        <span className={cn('block text-sm font-bold', dark ? 'text-white' : 'text-slate-900')}>
          {label}
        </span>
        {description && (
          <span
            className={cn(
              'mt-1 block text-xs leading-5',
              dark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

function StatusMessage({ status, dark }) {
  if (!status) return null;

  return (
    <p
      className={cn(
        'rounded-xl border px-3 py-2 text-xs font-semibold',
        status.type === 'error'
          ? dark
            ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
            : 'border-rose-200 bg-rose-50 text-rose-700'
          : dark
            ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      )}
    >
      {status.message}
    </p>
  );
}

export default function DomainBoundarySettingsSection({ settings = {}, setSettings, dark }) {
  const boundary = { ...DEFAULT_BOUNDARY, ...(settings.publishedDomainBoundary || {}) };
  const [coordinateRows, setCoordinateRows] = useState([
    { id: crypto.randomUUID(), longitude: '', latitude: '' },
    { id: crypto.randomUUID(), longitude: '', latitude: '' },
    { id: crypto.randomUUID(), longitude: '', latitude: '' },
    { id: crypto.randomUUID(), longitude: '', latitude: '' },
  ]);
  const [importStatus, setImportStatus] = useState(null);
  const [sourceMode, setSourceMode] = useState('manual');

  const featureCount = useMemo(
    () => boundary.geojson?.features?.length || 0,
    [boundary.geojson]
  );

  const setBoundary = (patch) =>
    setSettings((current) => ({
      ...current,
      publishedDomainBoundary: {
        ...DEFAULT_BOUNDARY,
        ...(current.publishedDomainBoundary || {}),
        ...patch,
      },
    }));

  const updateCoordinateRow = (id, field, value) =>
    setCoordinateRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );

  const addCoordinateRow = () =>
    setCoordinateRows((rows) => [
      ...rows,
      { id: crypto.randomUUID(), longitude: '', latitude: '' },
    ]);

  const removeCoordinateRow = (id) =>
    setCoordinateRows((rows) => (rows.length <= 3 ? rows : rows.filter((row) => row.id !== id)));

  const importCoordinates = () => {
    try {
      const completeRows = coordinateRows.filter(
        (row) => String(row.longitude).trim() !== '' || String(row.latitude).trim() !== ''
      );

      if (completeRows.length < 3) {
        throw new Error('Enter at least three longitude/latitude points.');
      }

      if (
        completeRows.some(
          (row) =>
            String(row.longitude).trim() === '' || String(row.latitude).trim() === ''
        )
      ) {
        throw new Error('Each boundary point needs both longitude and latitude.');
      }

      const coordinateText = completeRows
        .map((row) => `${row.longitude},${row.latitude}`)
        .join('\n');

      const geojson = coordinatesTextToGeoJson(coordinateText);
      setBoundary({ geojson });
      setImportStatus({
        type: 'success',
        message: `Loaded ${completeRows.length} boundary points as one polygon.`,
      });
    } catch (error) {
      setImportStatus({ type: 'error', message: error.message });
    }
  };

  const importFile = async (file) => {
    try {
      const geojson = await boundaryFileToGeoJson(file);
      setBoundary({ geojson });
      setImportStatus({
        type: 'success',
        message: `Loaded ${geojson.features.length} polygon feature${geojson.features.length === 1 ? '' : 's'} from ${file.name}.`,
      });
    } catch (error) {
      setImportStatus({ type: 'error', message: error.message });
    }
  };

  return (
    <div className="grid gap-4">
      <Toggle
        label="Show domain boundary on published charts"
        checked={boundary.enabled}
        onChange={(enabled) => setBoundary({ enabled })}
        dark={dark}
        description="Applies to the public published-chart map and exported/PDF map. It does not modify forecast annotations."
      />

      {boundary.enabled && (
        <>
          <Field
            label="Boundary name"
            value={boundary.name}
            onChange={(name) => setBoundary({ name })}
            dark={dark}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Toggle
              label="Boundary line"
              checked={boundary.showLine}
              onChange={(showLine) => setBoundary({ showLine })}
              dark={dark}
              description="Draw the polygon outline."
            />
            <Toggle
              label="Boundary fill"
              checked={boundary.showFill}
              onChange={(showFill) => setBoundary({ showFill })}
              dark={dark}
              description="Shade the configured domain polygon."
            />
          </div>

          {boundary.showLine && (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className={labelCls(dark)}>Line color</label>
                <input
                  type="color"
                  value={boundary.lineColor}
                  onChange={(event) => setBoundary({ lineColor: event.target.value })}
                  className={cn(inputCls(dark), 'h-11 p-1')}
                />
              </div>
              <NumberField
                label="Line width"
                value={boundary.lineWidth}
                onChange={(lineWidth) => setBoundary({ lineWidth })}
                min={0.5}
                max={12}
                step={0.5}
                dark={dark}
              />
              <NumberField
                label="Line opacity"
                value={boundary.lineOpacity}
                onChange={(lineOpacity) => setBoundary({ lineOpacity })}
                min={0}
                max={1}
                step={0.05}
                dark={dark}
              />
            </div>
          )}

          {boundary.showFill && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls(dark)}>Fill color</label>
                <input
                  type="color"
                  value={boundary.fillColor}
                  onChange={(event) => setBoundary({ fillColor: event.target.value })}
                  className={cn(inputCls(dark), 'h-11 p-1')}
                />
              </div>
              <NumberField
                label="Fill opacity"
                value={boundary.fillOpacity}
                onChange={(fillOpacity) => setBoundary({ fillOpacity })}
                min={0}
                max={1}
                step={0.05}
                dark={dark}
              />
            </div>
          )}

          {featureCount > 0 && (
            <Toggle
              label="Clip annotations to domain boundary"
              checked={boundary.clipAnnotations === true}
              onChange={(clipAnnotations) => setBoundary({ clipAnnotations })}
              dark={dark}
              description="Hides annotation content outside the configured domain while preserving the original certified annotation geometry."
            />
          )}

          {!boundary.showLine && !boundary.showFill && (
            <p
              className={cn(
                'rounded-xl border px-4 py-3 text-xs font-semibold',
                dark
                  ? 'border-amber-400/20 bg-amber-500/10 text-amber-200'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              )}
            >
              Enable Boundary line, Boundary fill, or both to make the domain visible.
            </p>
          )}

          <div>
            <label className={labelCls(dark)}>Boundary source</label>
            <div
              className={cn(
                'inline-flex w-full max-w-xl rounded-xl border p-1',
                dark ? 'border-white/10 bg-slate-950/40' : 'border-slate-200 bg-slate-100'
              )}
            >
              {[
                { value: 'manual', label: 'Manual coordinates', icon: MapPinned },
                { value: 'file', label: 'Upload file', icon: FileUp },
              ].map((option) => {
                const Icon = option.icon;
                const active = sourceMode === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSourceMode(option.value);
                      setImportStatus(null);
                    }}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black transition',
                      active
                        ? dark
                          ? 'bg-cyan-400/15 text-cyan-100 shadow-sm'
                          : 'bg-white text-cyan-800 shadow-sm'
                        : dark
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    <Icon size={14} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {sourceMode === 'manual' && (
            <div
              className={cn(
                'rounded-2xl border p-4',
                dark ? 'border-white/10 bg-slate-950/30' : 'border-slate-200 bg-slate-50'
              )}
            >
              <div className="mb-3 flex items-center gap-2">
                <MapPinned size={16} />
                <p className={cn('text-sm font-black', dark ? 'text-white' : 'text-slate-900')}>
                  Manual longitude / latitude polygon
                </p>
              </div>

              <div className="grid gap-3">
                <div className="grid grid-cols-[52px_minmax(0,1fr)_minmax(0,1fr)_40px] items-end gap-3">
                  <span className={cn('pb-3 text-[10px] font-black uppercase tracking-wide', dark ? 'text-slate-500' : 'text-slate-400')}>
                    Point
                  </span>
                  <span className={cn('pb-3 text-[10px] font-black uppercase tracking-wide', dark ? 'text-slate-500' : 'text-slate-400')}>
                    Longitude
                  </span>
                  <span className={cn('pb-3 text-[10px] font-black uppercase tracking-wide', dark ? 'text-slate-500' : 'text-slate-400')}>
                    Latitude
                  </span>
                  <span />
                </div>

                {coordinateRows.map((row, index) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[52px_minmax(0,1fr)_minmax(0,1fr)_40px] items-center gap-3"
                  >
                    <span className={cn('text-sm font-black', dark ? 'text-slate-300' : 'text-slate-600')}>
                      {index + 1}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      value={row.longitude}
                      onChange={(event) =>
                        updateCoordinateRow(row.id, 'longitude', event.target.value)
                      }
                      placeholder="e.g. 116.0"
                      className={inputCls(dark)}
                      aria-label={`Point ${index + 1} longitude`}
                    />
                    <input
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      value={row.latitude}
                      onChange={(event) =>
                        updateCoordinateRow(row.id, 'latitude', event.target.value)
                      }
                      placeholder="e.g. 4.0"
                      className={inputCls(dark)}
                      aria-label={`Point ${index + 1} latitude`}
                    />
                    <button
                      type="button"
                      onClick={() => removeCoordinateRow(row.id)}
                      disabled={coordinateRows.length <= 3}
                      className={cn(
                        'inline-flex h-10 w-10 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-30',
                        dark
                          ? 'border-white/10 text-rose-300 hover:bg-rose-500/10'
                          : 'border-slate-200 text-rose-600 hover:bg-rose-50'
                      )}
                      aria-label={`Remove point ${index + 1}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className={cn('text-xs font-semibold leading-5', dark ? 'text-slate-400' : 'text-slate-500')}>
                  Enter at least three WGS84 points. WaveLab closes the polygon automatically.
                </p>
                <button
                  type="button"
                  onClick={addCoordinateRow}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black',
                    dark
                      ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <Plus size={14} />
                  Add point
                </button>
              </div>

              <button
                type="button"
                onClick={importCoordinates}
                className={cn(
                  'mt-3 rounded-xl px-4 py-2 text-xs font-black',
                  dark
                    ? 'bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                Use coordinate polygon
              </button>

              <div className="mt-3">
                <StatusMessage status={importStatus} dark={dark} />
              </div>
            </div>
          )}

          {sourceMode === 'file' && (
            <div
              className={cn(
                'rounded-2xl border p-4',
                dark ? 'border-white/10 bg-slate-950/30' : 'border-slate-200 bg-slate-50'
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={cn('text-sm font-black', dark ? 'text-white' : 'text-slate-900')}>
                    Import boundary file
                  </p>
                  <p className={cn('mt-1 text-xs font-semibold leading-5', dark ? 'text-slate-400' : 'text-slate-500')}>
                    Accepts Polygon GeoJSON/JSON and Polygon .shp files. Shapefiles must already use WGS84 longitude/latitude coordinates; .prj reprojection is not performed in the browser.
                  </p>
                </div>
                <label
                  className={cn(
                    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-black',
                    dark
                      ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <FileUp size={15} />
                  Upload GeoJSON / SHP
                  <input
                    type="file"
                    accept=".geojson,.json,.shp,application/geo+json,application/json"
                    className="hidden"
                    onChange={(event) => {
                      const [file] = event.target.files || [];
                      if (file) void importFile(file);
                      event.target.value = '';
                    }}
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className={cn('text-xs font-black', dark ? 'text-cyan-200' : 'text-cyan-800')}>
                  {featureCount} polygon feature{featureCount === 1 ? '' : 's'} loaded
                </span>
                {featureCount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setBoundary({ geojson: { type: 'FeatureCollection', features: [] } })
                    }
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold',
                      dark ? 'text-rose-300 hover:bg-rose-500/10' : 'text-rose-600 hover:bg-rose-50'
                    )}
                  >
                    <Trash2 size={13} />
                    Clear boundary
                  </button>
                )}
              </div>

              <div className="mt-3">
                <StatusMessage status={importStatus} dark={dark} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
