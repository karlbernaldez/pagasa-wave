import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  User,
  Calendar,
  MapPin,
  Check,
  AlertCircle,
  Eye,
  Hash,
  MessageSquare,
  RotateCcw,
  XCircle,
} from 'lucide-react';

import {
  addReviewComment,
  approveProject,
  rejectProject,
  requestProjectRevision,
} from '@/api/projectAPI';
import MiniMapPreview from '@dashboards/admin/components/MiniMapPreview';
import { formatDate } from '../utils/projectUtils';

const REVIEWABLE_STATUSES = ['Submitted', 'Under Review'];
const TERMINAL_STATUSES = ['Approved', 'Rejected', 'Published', 'Archived'];

const StatusBadge = ({ status }) => {
  const styles = {
    Submitted: 'bg-amber-400/12 text-amber-400 ring-amber-400/25',
    'Under Review': 'bg-orange-400/12 text-orange-400 ring-orange-400/25',
    'Revision Requested': 'bg-rose-400/12 text-rose-400 ring-rose-400/25',
    Approved: 'bg-blue-400/12 text-blue-400 ring-blue-400/25',
    Published: 'bg-emerald-400/12 text-emerald-400 ring-emerald-400/25',
    Rejected: 'bg-red-400/12 text-red-400 ring-red-400/25',
    Archived: 'bg-slate-400/12 text-slate-400 ring-slate-400/25',
  };

  const dotStyles = {
    Submitted: 'bg-amber-400',
    'Under Review': 'bg-orange-400',
    'Revision Requested': 'bg-rose-400',
    Approved: 'bg-blue-400',
    Published: 'bg-emerald-400',
    Rejected: 'bg-red-400',
    Archived: 'bg-slate-400',
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${styles[status] || styles.Submitted}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status] || dotStyles.Submitted}`} />
      {status || 'Submitted'}
    </div>
  );
};

const Field = ({ icon: Icon, label, value, mono = false, accent = false, dark }) => (
  <div className="group flex items-center gap-4 py-3.5">
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors ${
        dark
          ? 'bg-white/5 ring-white/10 group-hover:bg-white/10'
          : 'bg-black/5 ring-black/10 group-hover:bg-black/10'
      }`}
    >
      <Icon size={13} className={dark ? 'text-gray-400' : 'text-gray-500'} />
    </div>

    <div className="min-w-0 flex-1">
      <p className={`mb-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
        {label}
      </p>
      <p
        className={`truncate text-[13px] font-medium leading-snug ${
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

const ReviewActionButton = ({ children, icon: Icon, variant = 'secondary', disabled, onClick }) => {
  const styles = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_8px_24px_rgba(16,185,129,0.24)]',
    danger: 'bg-red-500 text-white hover:bg-red-400 shadow-[0_8px_24px_rgba(239,68,68,0.22)]',
    warning: 'bg-amber-500 text-white hover:bg-amber-400 shadow-[0_8px_24px_rgba(245,158,11,0.20)]',
    secondary: 'bg-white/10 text-gray-200 ring-1 ring-white/10 hover:bg-white/15',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
};

function getAuditUserName(user) {
  if (!user) return 'System';
  if (typeof user === 'string') return user;
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username || user.email || 'System';
}

function getLatestReviewRemarks(project) {
  const logs = Array.isArray(project?.auditLogs) ? project.auditLogs : [];
  const latest = [...logs].reverse().find((log) => log.comment && ['comment_added', 'revision_requested', 'rejected'].includes(log.action));
  return latest?.comment || project?.reviewComment || '';
}

const ChartDetailModal = ({ chart, isDarkMode, onClose, onActionComplete }) => {
  const dark = isDarkMode;
  const mapHostRef = useRef(null);
  const [remarks, setRemarks] = useState(() => getLatestReviewRemarks(chart));
  const [actionError, setActionError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const projectId = chart?._id || chart?.id;
  const isReviewable = REVIEWABLE_STATUSES.includes(chart?.status);
  const isTerminal = TERMINAL_STATUSES.includes(chart?.status);
  const latestRemarks = useMemo(() => getLatestReviewRemarks(chart), [chart]);

  useEffect(() => {
    setRemarks(getLatestReviewRemarks(chart));
    setActionError('');
  }, [chart]);

  const handleKey = useCallback((event) => {
    if (event.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  useEffect(() => {
    if (!mapHostRef.current) return;
    const host = mapHostRef.current;

    const forceSize = () => {
      Array.from(host.children).forEach((element) => {
        element.style.setProperty('position', 'absolute', 'important');
        element.style.setProperty('width', '100%', 'important');
        element.style.setProperty('height', '100%', 'important');
        element.style.setProperty('inset', '0', 'important');
      });

      host
        .querySelectorAll('.mapboxgl-map, .maplibregl-map, canvas.mapboxgl-canvas, canvas.maplibregl-canvas')
        .forEach((element) => {
          element.style.setProperty('position', 'absolute', 'important');
          element.style.setProperty('width', '100%', 'important');
          element.style.setProperty('height', '100%', 'important');
          element.style.setProperty('inset', '0', 'important');
        });
    };

    forceSize();
    const t1 = setTimeout(forceSize, 100);
    const t2 = setTimeout(forceSize, 500);
    const observer = new MutationObserver(forceSize);
    observer.observe(host, { childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, [projectId]);

  if (!chart) return null;

  const runAction = async (name, action) => {
    if (!projectId || pendingAction) return;

    setPendingAction(name);
    setActionError('');

    try {
      const updatedProject = await action();
      await onActionComplete?.(updatedProject);

      if (['approve', 'reject', 'revision'].includes(name)) {
        onClose();
      }
    } catch (error) {
      setActionError(error?.message || 'Review action failed.');
    } finally {
      setPendingAction(null);
    }
  };

  const requireRemarks = () => {
    const value = remarks.trim();
    if (!value) {
      setActionError('Remarks are required for this action.');
      return null;
    }
    return value;
  };

  const handleAddComment = () => {
    const value = requireRemarks();
    if (!value) return;
    return runAction('comment', () => addReviewComment(projectId, value));
  };

  const handleRequestRevision = () => {
    const value = requireRemarks();
    if (!value) return;
    return runAction('revision', () => requestProjectRevision(projectId, value));
  };

  const handleReject = () => {
    const value = requireRemarks();
    if (!value) return;
    return runAction('reject', () => rejectProject(projectId, value));
  };

  const handleApprove = () => runAction('approve', () => approveProject(projectId));

  const panelBg = dark ? '#111318' : '#ffffff';
  const sidebarBg = dark ? '#0d0f14' : '#f7f8fa';
  const borderClr = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const divClr = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const projectTitle = chart.title || chart.name || 'Untitled Project';

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(14px) saturate(180%)', padding: '32px' }}
        onClick={(event) => event.target === event.currentTarget && onClose()}
      >
        <div
          className="relative flex w-full flex-col overflow-hidden rounded-2xl lg:flex-row"
          style={{
            maxWidth: 1280,
            height: '88vh',
            background: panelBg,
            border: `1px solid ${borderClr}`,
            boxShadow: dark
              ? '0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset'
              : '0 40px 120px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.8) inset',
          }}
        >
          <div className="relative min-h-[280px] flex-1 overflow-hidden lg:min-h-0">
            <div ref={mapHostRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <MiniMapPreview
                projectId={projectId}
                isDarkMode={isDarkMode}
                fullSize
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              />
            </div>

            <style>{`
              [data-review-map-host] .mapboxgl-ctrl-attrib,
              [data-review-map-host] .maplibregl-ctrl-attrib {
                font-size: 9px !important;
                opacity: 0.45 !important;
                background: transparent !important;
              }
            `}</style>

            <div className="absolute left-0 right-0 top-0 z-10 flex items-start justify-between gap-3 p-5">
              <StatusBadge status={chart.status} />
              <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ring-1 backdrop-blur-md ${dark ? 'bg-black/55 text-gray-300 ring-white/10' : 'bg-white/75 text-gray-600 ring-black/10'}`}>
                <MapPin size={10} />
                {chart.chartType}
              </span>
            </div>

            <div
              className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-7 pt-24"
              style={{
                background: dark
                  ? 'linear-gradient(to top, #111318 0%, rgba(17,19,24,0.82) 45%, transparent 100%)'
                  : 'linear-gradient(to top, #ffffff 0%, rgba(255,255,255,0.82) 45%, transparent 100%)',
              }}
            >
              <h2 className={`text-2xl font-bold leading-tight tracking-tight sm:text-3xl ${dark ? 'text-white' : 'text-gray-900'}`}>
                {projectTitle}
              </h2>
              {chart.forecastDate && (
                <p className={`mt-1.5 text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Forecast — {formatDate(chart.forecastDate)}
                </p>
              )}
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col lg:w-[420px]" style={{ background: sidebarBg, borderLeft: `1px solid ${borderClr}` }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${borderClr}` }}>
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${isReviewable ? 'bg-orange-400' : isTerminal ? 'bg-slate-400' : 'bg-blue-400'}`} />
                <span className={`text-[11px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Project Review
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-90 ${dark ? 'text-gray-500 hover:bg-white/10 hover:text-gray-200' : 'text-gray-400 hover:bg-black/10 hover:text-gray-700'}`}
                aria-label="Close review modal"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-1" style={{ scrollbarWidth: 'none' }}>
              <Field icon={User} label="Owner" value={chart.owner} dark={dark} />
              <div style={{ height: 1, background: divClr }} />
              <Field icon={MapPin} label="Chart Type" value={chart.chartType} accent dark={dark} />
              {chart.forecastDate && (
                <>
                  <div style={{ height: 1, background: divClr }} />
                  <Field icon={Calendar} label="Forecast Date" value={formatDate(chart.forecastDate)} dark={dark} />
                </>
              )}
              {chart.createdAt && (
                <>
                  <div style={{ height: 1, background: divClr }} />
                  <Field icon={Calendar} label="Created" value={formatDate(chart.createdAt)} dark={dark} />
                </>
              )}
              <div style={{ height: 1, background: divClr }} />
              <Field icon={Hash} label="Project ID" value={projectId} mono dark={dark} />

              <div style={{ height: 1, background: divClr }} />
              <div className="py-4">
                <label className={`mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <MessageSquare size={13} />
                  Remarks / Comments
                </label>
                <textarea
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  disabled={!isReviewable || Boolean(pendingAction)}
                  rows={5}
                  placeholder="Write review remarks for the forecaster..."
                  className={`w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    dark
                      ? 'border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-600 focus:border-sky-400/50'
                      : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-sky-400'
                  }`}
                />
                <p className={`mt-1.5 text-xs ${dark ? 'text-gray-600' : 'text-slate-400'}`}>
                  The same text is used as both review remarks and review comments.
                </p>
              </div>

              {latestRemarks && (
                <div className={`mb-4 rounded-xl border p-3 text-xs ${dark ? 'border-white/10 bg-white/5 text-gray-400' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                  <p className="mb-1 font-semibold">Latest remarks</p>
                  <p className="leading-relaxed">{latestRemarks}</p>
                </div>
              )}

              {Array.isArray(chart.auditLogs) && chart.auditLogs.length > 0 && (
                <div className="pb-4">
                  <p className={`mb-2 text-[11px] font-bold uppercase tracking-[0.12em] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Audit Timeline
                  </p>
                  <div className="space-y-2">
                    {[...chart.auditLogs].reverse().slice(0, 5).map((log, index) => (
                      <div key={`${log.timestamp}-${index}`} className={`rounded-lg border p-2 text-xs ${dark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={dark ? 'font-semibold text-gray-200' : 'font-semibold text-slate-700'}>
                            {String(log.action || '').replaceAll('_', ' ')}
                          </span>
                          <span className={dark ? 'text-gray-600' : 'text-slate-400'}>{formatDate(log.timestamp)}</span>
                        </div>
                        <p className={dark ? 'mt-1 text-gray-500' : 'mt-1 text-slate-500'}>
                          {getAuditUserName(log.performedBy)}
                          {log.comment ? ` — ${log.comment}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2.5 px-6 py-5" style={{ borderTop: `1px solid ${borderClr}` }}>
              {actionError && (
                <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                  {actionError}
                </div>
              )}

              {isReviewable ? (
                <>
                  <ReviewActionButton icon={MessageSquare} disabled={Boolean(pendingAction)} onClick={handleAddComment}>
                    {pendingAction === 'comment' ? 'Saving Comment...' : 'Add Comment'}
                  </ReviewActionButton>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <ReviewActionButton icon={RotateCcw} variant="warning" disabled={Boolean(pendingAction)} onClick={handleRequestRevision}>
                      {pendingAction === 'revision' ? 'Requesting...' : 'Request Revision'}
                    </ReviewActionButton>
                    <ReviewActionButton icon={XCircle} variant="danger" disabled={Boolean(pendingAction)} onClick={handleReject}>
                      {pendingAction === 'reject' ? 'Rejecting...' : 'Reject'}
                    </ReviewActionButton>
                  </div>
                  <ReviewActionButton icon={Check} variant="primary" disabled={Boolean(pendingAction)} onClick={handleApprove}>
                    {pendingAction === 'approve' ? 'Approving...' : 'Approve Project'}
                  </ReviewActionButton>
                </>
              ) : (
                <ReviewActionButton icon={Eye} disabled onClick={() => {}}>
                  {isTerminal ? `Project is ${chart.status}` : 'Not available for review'}
                </ReviewActionButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChartDetailModal;
