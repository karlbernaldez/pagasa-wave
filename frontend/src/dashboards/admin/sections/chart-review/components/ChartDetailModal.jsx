import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Calendar,
  MapPin,
  Check,
  AlertCircle,
  Eye,
  Download,
  Hash,
  ArrowRight,
} from 'lucide-react';
import MiniMapPreview from '@dashboards/admin/components/MiniMapPreview';
import { formatDate } from '../utils/projectUtils';

// ─────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const pending = status === 'Pending';
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase ${
        pending
          ? 'bg-amber-400/12 text-amber-400 ring-1 ring-inset ring-amber-400/25'
          : 'bg-emerald-400/12 text-emerald-400 ring-1 ring-inset ring-emerald-400/25'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${pending ? 'bg-amber-400' : 'bg-emerald-400'}`} />
      {status}
    </div>
  );
};

// ─────────────────────────────────────────────
// Detail field
// ─────────────────────────────────────────────
const Field = ({ icon: Icon, label, value, mono = false, accent = false, dark }) => (
  <div className="group flex items-center gap-4 py-3.5">
    <div
      className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ring-1 transition-colors ${
        dark
          ? 'bg-white/5 ring-white/8 group-hover:bg-white/9 group-hover:ring-white/14'
          : 'bg-black/4 ring-black/8 group-hover:bg-black/7'
      }`}
    >
      <Icon size={13} className={dark ? 'text-gray-400' : 'text-gray-500'} />
    </div>

    <div className="min-w-0 flex-1">
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.12em] mb-0.5 ${
          dark ? 'text-gray-600' : 'text-gray-400'
        }`}
      >
        {label}
      </p>
      <p
        className={`text-[13px] leading-snug font-medium truncate ${
          accent
            ? 'text-sky-400'
            : mono
            ? `font-mono text-[11px] ${dark ? 'text-gray-500' : 'text-gray-400'}`
            : dark
            ? 'text-gray-100'
            : 'text-gray-800'
        }`}
      >
        {value ?? '—'}
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// ChartDetailModal
// ─────────────────────────────────────────────
const ChartDetailModal = ({ chart, isDarkMode, onClose }) => {
  const dark = isDarkMode;
  const isPending = chart?.status === 'Pending';
  const mapHostRef = useRef(null);

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  // Imperatively force every descendant of the map host to fill its container.
  // This handles cases where MiniMapPreview sets fixed px dimensions inline or via JS.
  useEffect(() => {
    if (!mapHostRef.current) return;
    const host = mapHostRef.current;

    const SKIP = [
      'mapboxgl-ctrl', 'maplibregl-ctrl',
      'mapboxgl-ctrl-attrib', 'maplibregl-ctrl-attrib',
      'mapboxgl-ctrl-logo', 'maplibregl-ctrl-logo',
      'mapboxgl-control-container', 'maplibregl-control-container',
    ];

    const forceSize = () => {
      // Stretch direct children (the MiniMapPreview root wrapper)
      Array.from(host.children).forEach((el) => {
        el.style.setProperty('position', 'absolute', 'important');
        el.style.setProperty('width',    '100%',      'important');
        el.style.setProperty('height',   '100%',      'important');
        el.style.setProperty('inset',    '0',         'important');
      });

      // Stretch the map and canvas elements specifically
      const targets = host.querySelectorAll(
        '.mapboxgl-map, .maplibregl-map, canvas.mapboxgl-canvas, canvas.maplibregl-canvas'
      );
      targets.forEach((el) => {
        el.style.setProperty('position', 'absolute', 'important');
        el.style.setProperty('width',    '100%',      'important');
        el.style.setProperty('height',   '100%',      'important');
        el.style.setProperty('inset',    '0',         'important');
      });
    };

    // Run immediately and again once the map likely finishes mounting
    forceSize();
    const t1 = setTimeout(forceSize, 100);
    const t2 = setTimeout(forceSize, 500);

    // Also observe DOM additions (map tiles / canvas injected after mount)
    const observer = new MutationObserver(forceSize);
    observer.observe(host, { childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, [chart?.id]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  if (!chart) return null;

  /* ─ Design tokens ─ */
  const panelBg   = dark ? '#111318'                  : '#ffffff';
  const sidebarBg = dark ? '#0d0f14'                  : '#f7f8fa';
  const borderClr = dark ? 'rgba(255,255,255,0.07)'   : 'rgba(0,0,0,0.07)';
  const divClr    = dark ? 'rgba(255,255,255,0.05)'   : 'rgba(0,0,0,0.05)';

  return createPortal(
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(14px) saturate(180%)', padding: '32px' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="relative w-full flex flex-col lg:flex-row overflow-hidden rounded-2xl"
          style={{
            width: '100%',
            maxWidth: 1280,
            height: '88vh',
            background: panelBg,
            border: `1px solid ${borderClr}`,
            boxShadow: dark
              ? '0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset'
              : '0 40px 120px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.8) inset',
            animation: 'modalIn 0.24s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >

          {/* ══════════════════════════════
              LEFT COLUMN — full-height map
          ══════════════════════════════ */}
          <div className="relative flex-1 min-h-[280px] lg:min-h-0 overflow-hidden">

            {/* Nuclear map fill — overrides any internal sizing MiniMapPreview applies */}
            <div
              id="map-fill-host"
              ref={mapHostRef}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
              <MiniMapPreview
                projectId={chart.id}
                isDarkMode={isDarkMode}
                fullSize
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              />
            </div>
            <style>{`
              /* ── Stretch only the map container and its canvas ── */
              #map-fill-host,
              #map-fill-host > * {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                max-width: none !important;
                max-height: none !important;
                border-radius: 0 !important;
              }

              #map-fill-host .mapboxgl-map,
              #map-fill-host .maplibregl-map {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background-color: #0d1117 !important;
              }

              #map-fill-host canvas.mapboxgl-canvas,
              #map-fill-host canvas.maplibregl-canvas {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
              }

              /* ── Reset ALL control containers so they sit in corners naturally ── */
              #map-fill-host .mapboxgl-control-container,
              #map-fill-host .maplibregl-control-container {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                pointer-events: none !important;
              }

              #map-fill-host .mapboxgl-ctrl-top-left,
              #map-fill-host .mapboxgl-ctrl-top-right,
              #map-fill-host .mapboxgl-ctrl-bottom-left,
              #map-fill-host .mapboxgl-ctrl-bottom-right,
              #map-fill-host .maplibregl-ctrl-top-left,
              #map-fill-host .maplibregl-ctrl-top-right,
              #map-fill-host .maplibregl-ctrl-bottom-left,
              #map-fill-host .maplibregl-ctrl-bottom-right {
                position: absolute !important;
                width: auto !important;
                height: auto !important;
                inset: auto !important;
                pointer-events: auto !important;
              }
              #map-fill-host .mapboxgl-ctrl-top-left,
              #map-fill-host .maplibregl-ctrl-top-left     { top: 0    !important; left: 0   !important; }
              #map-fill-host .mapboxgl-ctrl-top-right,
              #map-fill-host .maplibregl-ctrl-top-right    { top: 0    !important; right: 0  !important; }
              #map-fill-host .mapboxgl-ctrl-bottom-left,
              #map-fill-host .maplibregl-ctrl-bottom-left  { bottom: 0 !important; left: 0   !important; }
              #map-fill-host .mapboxgl-ctrl-bottom-right,
              #map-fill-host .maplibregl-ctrl-bottom-right { bottom: 0 !important; right: 0  !important; }

              /* ── Every individual control widget — natural size ── */
              #map-fill-host .mapboxgl-ctrl,
              #map-fill-host .maplibregl-ctrl,
              #map-fill-host .mapboxgl-ctrl *,
              #map-fill-host .maplibregl-ctrl * {
                position: relative !important;
                inset: auto !important;
                width: auto !important;
                height: auto !important;
                max-width: none !important;
                max-height: none !important;
              }

              /* ── Attribution — small and unobtrusive ── */
              #map-fill-host .mapboxgl-ctrl-attrib,
              #map-fill-host .maplibregl-ctrl-attrib {
                font-size: 9px !important;
                opacity: 0.45 !important;
                background: transparent !important;
              }

              /* ── Logo — natural size, no stretching ── */
              #map-fill-host .mapboxgl-ctrl-logo,
              #map-fill-host .maplibregl-ctrl-logo {
                width: 88px !important;
                height: 23px !important;
                background-size: contain !important;
                opacity: 0.5 !important;
              }
            `}</style>

            {/* ── Top bar (status + chart type pill) ── */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between gap-3 p-5">
              <StatusBadge status={chart.status} />

              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium
                  px-2.5 py-1.5 rounded-lg backdrop-blur-md ring-1
                  ${dark
                    ? 'bg-black/55 text-gray-300 ring-white/10'
                    : 'bg-white/75 text-gray-600 ring-black/8'
                  }`}
              >
                <MapPin size={10} />
                {chart.chartType}
              </span>
            </div>

            {/* ── Bottom scrim + title ── */}
            <div
              className="absolute bottom-0 left-0 right-0 z-10 px-6 pt-24 pb-7"
              style={{
                background: dark
                  ? 'linear-gradient(to top, #111318 0%, rgba(17,19,24,0.82) 45%, transparent 100%)'
                  : 'linear-gradient(to top, #ffffff 0%, rgba(255,255,255,0.82) 45%, transparent 100%)',
              }}
            >
              <h2
                className={`text-2xl sm:text-3xl font-bold leading-tight tracking-tight ${
                  dark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {chart.title}
              </h2>
              {chart.forecastDate && (
                <p className={`mt-1.5 text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Forecast — {formatDate(chart.forecastDate)}
                </p>
              )}
            </div>
          </div>

          {/* ══════════════════════════════
              RIGHT COLUMN — details panel
          ══════════════════════════════ */}
          <div
            className="flex flex-col shrink-0 w-full lg:w-[380px] xl:w-[420px]"
            style={{ background: sidebarBg, borderLeft: `1px solid ${borderClr}` }}
          >
            {/* ── Panel header ── */}
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: `1px solid ${borderClr}` }}
            >
              <div className="flex items-center gap-3">
                {/* Accent dot */}
                <div className={`w-2 h-2 rounded-full ${isPending ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span
                  className={`text-[11px] font-bold uppercase tracking-[0.14em] ${
                    dark ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  Project Details
                </span>
              </div>

              <button
                onClick={onClose}
                className={`w-7 h-7 flex items-center justify-center rounded-lg
                  transition-all duration-150 active:scale-90
                  ${dark
                    ? 'text-gray-600 hover:text-gray-300 hover:bg-white/8'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-black/6'
                  }`}
              >
                <X size={15} />
              </button>
            </div>

            {/* ── Fields ── */}
            <div
              className="flex-1 overflow-y-auto px-6 py-1"
              style={{ scrollbarWidth: 'none' }}
            >
              <Field icon={User}     label="Owner"         value={chart.owner}                    dark={dark} />
              <div style={{ height: '1px', background: divClr }} />
              <Field icon={MapPin}   label="Chart Type"    value={chart.chartType} accent         dark={dark} />
              {chart.forecastDate && (
                <>
                  <div style={{ height: '1px', background: divClr }} />
                  <Field icon={Calendar} label="Forecast Date" value={formatDate(chart.forecastDate)} dark={dark} />
                </>
              )}
              {chart.createdAt && (
                <>
                  <div style={{ height: '1px', background: divClr }} />
                  <Field icon={Calendar} label="Created"       value={formatDate(chart.createdAt)}    dark={dark} />
                </>
              )}
              <div style={{ height: '1px', background: divClr }} />
              <Field icon={Hash} label="Project ID" value={chart.id} mono dark={dark} />
            </div>

            {/* ── Action footer ── */}
            <div
              className="px-6 py-5 space-y-2.5"
              style={{ borderTop: `1px solid ${borderClr}` }}
            >
              {isPending ? (
                <>
                  {/* PRIMARY — Approve */}
                  <button
                    className="group relative w-full overflow-hidden flex items-center justify-between
                      px-5 py-3.5 rounded-xl
                      bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98]
                      text-white text-sm font-semibold
                      transition-all duration-200
                      shadow-[0_8px_24px_rgba(16,185,129,0.28)]"
                  >
                    {/* Radial glow on hover */}
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      bg-[radial-gradient(ellipse_at_50%_-20%,rgba(255,255,255,0.15),transparent_65%)]
                      pointer-events-none" />
                    <span className="flex items-center gap-2.5">
                      <Check size={15} strokeWidth={2.5} />
                      Approve Project
                    </span>
                    <ArrowRight size={14} className="opacity-50 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* SECONDARY — Revision */}
                  <button
                    className={`w-full flex items-center justify-center gap-2
                      px-5 py-3 rounded-xl text-sm font-medium
                      transition-all duration-150 active:scale-[0.98]
                      ${dark
                        ? 'text-gray-400 hover:text-gray-200 ring-1 ring-white/8 hover:ring-white/15 hover:bg-white/5'
                        : 'text-gray-500 hover:text-gray-700 ring-1 ring-black/8 hover:ring-black/14 hover:bg-black/4'
                      }`}
                  >
                    <AlertCircle size={14} />
                    Request Revision
                  </button>
                </>
              ) : (
                <>
                  {/* PRIMARY — Full View */}
                  <button
                    className="group relative w-full overflow-hidden flex items-center justify-between
                      px-5 py-3.5 rounded-xl
                      bg-blue-500 hover:bg-blue-400 active:scale-[0.98]
                      text-white text-sm font-semibold
                      transition-all duration-200
                      shadow-[0_8px_24px_rgba(59,130,246,0.28)]"
                  >
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      bg-[radial-gradient(ellipse_at_50%_-20%,rgba(255,255,255,0.15),transparent_65%)]
                      pointer-events-none" />
                    <span className="flex items-center gap-2.5">
                      <Eye size={15} />
                      Open Full View
                    </span>
                    <ArrowRight size={14} className="opacity-50 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* SECONDARY — Download */}
                  <button
                    className={`w-full flex items-center justify-center gap-2
                      px-5 py-3 rounded-xl text-sm font-medium
                      transition-all duration-150 active:scale-[0.98]
                      ${dark
                        ? 'text-gray-400 hover:text-gray-200 ring-1 ring-white/8 hover:ring-white/15 hover:bg-white/5'
                        : 'text-gray-500 hover:text-gray-700 ring-1 ring-black/8 hover:ring-black/14 hover:bg-black/4'
                      }`}
                  >
                    <Download size={14} />
                    Download
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(14px); }
          to   { opacity: 1; transform: scale(1)    translateY(0px);  }
        }
      `}</style>
    </>,
    document.body
  );
};

export default ChartDetailModal;