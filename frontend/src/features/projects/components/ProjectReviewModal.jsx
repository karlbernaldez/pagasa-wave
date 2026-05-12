import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Clock3, GitCompareArrows, MessageSquareText, Send, UserRound, X } from 'lucide-react';

import Button from '@/components/ui/Button';
import ProjectPreviewMap from '@/features/projects/components/ProjectPreviewMap';
import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';
import { addReviewComment, requestProjectRevision } from '@/api/projectAPI';
import { fetchProjectFeatureCollection } from '@/api/featureServices';
import {
  getProjectStatusLabel,
  isProjectApproved,
  isProjectReviewable,
  isProjectUnderReview,
} from '@/features/projects/projectStatuses';

const SYSTEM_REMARKS = new Set([
  'Project created',
  'Submitted for review',
  'Project review started',
]);

function getProjectName(project) {
  return project?.name || project?.title || 'Untitled project';
}

function getProjectId(project) {
  return project?._id || project?.id;
}

function getProjectType(project) {
  return project?.chartType || project?.type || 'Forecast';
}

function getOwner(project) {
  if (project?.ownerDisplay) return project.ownerDisplay;
  if (!project?.owner) return 'Project Owner';
  if (typeof project.owner === 'string') return project.owner;
  const fullName = `${project.owner.firstName ?? ''} ${project.owner.lastName ?? ''}`.trim();
  return fullName || project.owner.email || 'Project Owner';
}

function getUserLabel(user) {
  if (!user) return 'System';
  if (typeof user === 'string') return user;
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return fullName || user.username || user.email || 'User';
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getTimeline(project) {
  const logs = Array.isArray(project?.auditLogs) ? project.auditLogs : [];

  return logs
    .map((log, index) => ({
      id: log._id || `${log.action}-${index}`,
      action: log.action || 'updated',
      actor: getUserLabel(log.performedBy),
      previousStatus: log.previousStatus,
      newStatus: log.newStatus,
      comment: log.comment,
      date: log.createdAt || log.timestamp || project.updatedAt || project.createdAt,
    }))
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
}

function getPreviousRemarks(project) {
  const remarks = [];

  getTimeline(project)
    .filter((item) => item.comment && !SYSTEM_REMARKS.has(item.comment))
    .forEach((item) => remarks.push(item));

  const seen = new Set();

  return remarks
    .filter((item) => {
      const key = `${item.comment}-${item.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
}

function getReviewer(project) {
  return getUserLabel(project?.approvedBy || project?.rejectedBy || project?.reviewStartedBy);
}

function getEmbeddedCurrentFeatureSource(project) {
  return project?.features || project?.featureCollection || project?.annotations || [];
}

function getPreviousFeatureSource(project) {
  const versions = Array.isArray(project?.versions) ? project.versions : [];
  const previousVersion = versions.length > 1 ? versions[versions.length - 2] : versions[0];

  return previousVersion?.features || previousVersion?.featureCollection || previousVersion?.annotations || [];
}

function mergeProjectState(previousProject, nextProject) {
  if (!previousProject || !nextProject) return nextProject || previousProject;

  return {
    ...previousProject,
    ...nextProject,
    features: nextProject.features ?? previousProject.features,
    featureCollection: nextProject.featureCollection ?? previousProject.featureCollection,
    annotations: nextProject.annotations ?? previousProject.annotations,
    versions: nextProject.versions ?? previousProject.versions,
  };
}

function getFeatureKey(feature) {
  return (
    feature?.properties?.stableId ||
    feature?.properties?.annotationId ||
    feature?.id ||
    feature?._id ||
    feature?.properties?.id ||
    feature?.properties?.sourceId ||
    JSON.stringify(feature?.geometry || {})
  );
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== 'object') return value;

  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      if (['owner', 'project', 'sourceId'].includes(key)) return acc;
      acc[key] = sortObject(value[key]);
      return acc;
    }, {});
}

function getComparableFeatureSignature(feature) {
  return JSON.stringify({
    geometry: sortObject(feature?.geometry || null),
    properties: sortObject(feature?.properties || {}),
  });
}

function getFeatureMap(features) {
  return features.reduce((map, feature) => {
    map.set(getFeatureKey(feature), feature);
    return map;
  }, new Map());
}

function getAnnotationDiff(previousFeatureSource, currentFeatureSource) {
  const previous = normalizeFeatureCollection(previousFeatureSource).features;
  const current = normalizeFeatureCollection(currentFeatureSource).features;

  const previousMap = getFeatureMap(previous);
  const currentMap = getFeatureMap(current);
  const changed = [];
  const unchanged = [];

  currentMap.forEach((currentFeature, key) => {
    const previousFeature = previousMap.get(key);
    if (!previousFeature) return;

    if (getComparableFeatureSignature(previousFeature) === getComparableFeatureSignature(currentFeature)) {
      unchanged.push(currentFeature);
    } else {
      changed.push(currentFeature);
    }
  });

  return {
    previousCount: previous.length,
    currentCount: current.length,
    added: current.filter((feature) => !previousMap.has(getFeatureKey(feature))).length,
    changed: changed.length,
    removed: previous.filter((feature) => !currentMap.has(getFeatureKey(feature))).length,
    unchanged: unchanged.length,
    hasPreviousSnapshot: previous.length > 0,
  };
}

function DiffMetric({ label, value, tone = 'slate', isDarkMode = false }) {
  const toneClass = isDarkMode
    ? {
        blue: 'border-blue-400/20 bg-blue-500/10 text-blue-300 ring-blue-400/10',
        green: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300 ring-emerald-400/10',
        orange: 'border-orange-400/20 bg-orange-500/10 text-orange-300 ring-orange-400/10',
        red: 'border-red-400/20 bg-red-500/10 text-red-300 ring-red-400/10',
        slate: 'border-white/10 bg-slate-950/70 text-slate-300 ring-white/10',
      }[tone]
    : {
        blue: 'border-blue-100 bg-blue-50 text-blue-700 ring-blue-100',
        green: 'border-emerald-100 bg-emerald-50 text-emerald-700 ring-emerald-100',
        orange: 'border-orange-100 bg-orange-50 text-orange-700 ring-orange-100',
        red: 'border-red-100 bg-red-50 text-red-700 ring-red-100',
        slate: 'border-slate-100 bg-slate-50 text-slate-700 ring-slate-100',
      }[tone];

  return (
    <div className={`rounded-2xl border p-3 ring-1 sm:p-4 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70 sm:text-[11px]">{label}</p>
      <p className="mt-1 text-xl font-black leading-none sm:text-2xl">{value}</p>
    </div>
  );
}

export default function ProjectReviewModal({ project, isDarkMode = false, onClose, onApprove, onReject, onPublish, onActionComplete }) {
  const lastProjectIdRef = useRef(getProjectId(project));
  const [currentProject, setCurrentProject] = useState(project);
  const [currentFeatureCollection, setCurrentFeatureCollection] = useState(() => normalizeFeatureCollection(getEmbeddedCurrentFeatureSource(project)));
  const [isLoadingCurrentFeatures, setIsLoadingCurrentFeatures] = useState(false);
  const [featureLoadError, setFeatureLoadError] = useState('');
  const [remarks, setRemarks] = useState('');
  const [busyAction, setBusyAction] = useState(null);
  const [mapMode, setMapMode] = useState('preview');

  useEffect(() => {
    const incomingProjectId = getProjectId(project);
    const isSameProject = lastProjectIdRef.current === incomingProjectId;
    const embeddedFeatureCollection = normalizeFeatureCollection(getEmbeddedCurrentFeatureSource(project));
    const hasEmbeddedFeatures = embeddedFeatureCollection.features.length > 0;

    setCurrentProject((previousProject) => (
      isSameProject ? mergeProjectState(previousProject, project) : project
    ));

    if (!isSameProject || hasEmbeddedFeatures) {
      setCurrentFeatureCollection(embeddedFeatureCollection);
    }

    lastProjectIdRef.current = incomingProjectId;
    setFeatureLoadError('');
  }, [project]);

  const projectId = getProjectId(currentProject);

  useEffect(() => {
    let isMounted = true;

    if (!projectId) return undefined;

    setIsLoadingCurrentFeatures(true);
    setFeatureLoadError('');

    fetchProjectFeatureCollection(projectId)
      .then((featureCollection) => {
        if (!isMounted) return;
        setCurrentFeatureCollection(normalizeFeatureCollection(featureCollection));
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('[ProjectReviewModal] Failed to load current annotations:', error);
        setFeatureLoadError(error?.message || 'Failed to load current annotations.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingCurrentFeatures(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  if (!currentProject) return null;

  const statusLabel = getProjectStatusLabel(currentProject?.status);
  const isReviewable = isProjectReviewable(currentProject?.status);
  const isUnderReview = isProjectUnderReview(currentProject?.status);
  const isApproved = isProjectApproved(currentProject?.status);
  const timeline = getTimeline(currentProject);
  const previousRemarks = getPreviousRemarks(currentProject);
  const reviewer = getReviewer(currentProject);
  const previousFeatureSource = getPreviousFeatureSource(currentProject);
  const currentFeatureSource = currentFeatureCollection;
  const diff = getAnnotationDiff(previousFeatureSource, currentFeatureSource);
  const hasRemarks = remarks.trim().length > 0;

  const runAction = async (key, action, { requireRemarks = false, closeOnSuccess = true } = {}) => {
    if (busyAction) return;
    if (requireRemarks && !hasRemarks) {
      alert('Remarks are required for this action.');
      return;
    }

    try {
      setBusyAction(key);
      const updatedProject = await action?.(currentProject, remarks.trim());
      const nextProject = updatedProject ? mergeProjectState(currentProject, updatedProject) : currentProject;

      setCurrentProject(nextProject);
      await onActionComplete?.(nextProject);
      setRemarks('');
      if (closeOnSuccess) onClose?.();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Action failed. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const surface = isDarkMode ? 'border-white/10 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-950';
  const panel = isDarkMode ? 'border-white/10 bg-slate-950/60' : 'border-slate-200 bg-white';
  const softPanel = isDarkMode ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-slate-50';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const labelText = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const strongText = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const disabledReviewButton = isDarkMode ? 'opacity-45' : 'opacity-50';

  return (
    <div className="fixed inset-0 z-[90] flex items-stretch justify-center bg-slate-950/80 p-1 backdrop-blur-sm sm:p-4 xl:items-center xl:p-6">
      <div className={`flex h-full w-full max-w-[1480px] flex-col overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-white/10 sm:h-[min(94vh,940px)] sm:rounded-[28px] ${surface}`}>
        <header className={`flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white'}`}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500 sm:text-xs">Project Review</p>
              <span className={`${isDarkMode ? 'border-blue-400/20 bg-blue-500/10 text-blue-300' : 'border-blue-100 bg-blue-50 text-blue-700'} rounded-full border px-2.5 py-1 text-[11px] font-black`}>
                {statusLabel}
              </span>
            </div>
            <h2 className={`mt-2 truncate text-lg font-black leading-tight sm:text-2xl ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{getProjectName(currentProject)}</h2>
            <p className={`mt-1 text-xs font-semibold sm:text-sm ${mutedText}`}>
              {getProjectType(currentProject)} · {getOwner(currentProject)} · Forecast {formatDate(currentProject.forecastDate)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busyAction)}
            className={`rounded-2xl border border-transparent p-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? 'text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900'}`}
            aria-label="Close review modal"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto xl:grid-cols-[minmax(0,1.6fr)_430px] xl:overflow-hidden">
          <section className={`overflow-visible p-3 sm:p-4 xl:min-h-0 xl:overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
            <div className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border shadow-sm sm:rounded-3xl xl:h-full ${panel}`}>
              <div className={`flex shrink-0 flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                <div>
                  <p className={`text-xs font-black uppercase tracking-[0.16em] ${labelText}`}>Annotation Preview</p>
                  <p className={`mt-1 text-xs font-semibold sm:text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isLoadingCurrentFeatures ? 'Loading current annotations…' : mapMode === 'diff' ? 'Compare previous snapshot against current submission' : 'Large map review workspace'}
                  </p>
                </div>
                <div className={`grid grid-cols-2 rounded-2xl border p-1 shadow-inner sm:flex sm:shrink-0 ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                  <button
                    type="button"
                    onClick={() => setMapMode('preview')}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition ${mapMode === 'preview' ? (isDarkMode ? 'bg-slate-800 text-blue-300 shadow-sm ring-1 ring-white/10' : 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200') : (isDarkMode ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-800')}`}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapMode('diff')}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition ${mapMode === 'diff' ? (isDarkMode ? 'bg-slate-800 text-blue-300 shadow-sm ring-1 ring-white/10' : 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200') : (isDarkMode ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-800')}`}
                  >
                    Diff
                  </button>
                </div>
              </div>

              {featureLoadError && (
                <div className={`shrink-0 border-b px-5 py-2 text-sm font-semibold ${isDarkMode ? 'border-red-500/30 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {featureLoadError}
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-visible p-3 sm:p-4 xl:overflow-hidden">
                {mapMode === 'preview' ? (
                  <ProjectPreviewMap
                    projectId={projectId}
                    features={currentFeatureSource}
                    featureScope="admin"
                    isDarkMode={isDarkMode}
                    className={`h-[310px] rounded-2xl sm:h-[460px] xl:h-full ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}
                    height={null}
                    emptyLabel={isLoadingCurrentFeatures ? 'Loading current annotations…' : 'No current annotations yet'}
                    lazy={false}
                  />
                ) : (
                  <div className="grid gap-3 xl:h-full xl:min-h-0 xl:grid-cols-2 xl:gap-4">
                    <div className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border shadow-sm ${softPanel}`}>
                      <div className={`shrink-0 border-b px-4 py-3 text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'border-white/10 bg-slate-950/60 text-slate-500' : 'border-slate-200 bg-white/70 text-slate-400'}`}>
                        Previous Snapshot
                      </div>
                      <ProjectPreviewMap
                        features={previousFeatureSource}
                        featureScope="admin"
                        isDarkMode={isDarkMode}
                        className="h-[248px] flex-none rounded-none border-0 sm:h-[360px] xl:h-full xl:flex-1"
                        height={null}
                        emptyLabel="No previous snapshot"
                        lazy={false}
                      />
                    </div>
                    <div className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border shadow-sm ${isDarkMode ? 'border-blue-400/20 bg-blue-500/5' : 'border-blue-100 bg-blue-50/40'}`}>
                      <div className={`shrink-0 border-b px-4 py-3 text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'border-blue-400/20 bg-slate-950/60 text-blue-300' : 'border-blue-100 bg-white/80 text-blue-500'}`}>
                        Current Submission
                      </div>
                      <ProjectPreviewMap
                        projectId={projectId}
                        features={currentFeatureSource}
                        featureScope="admin"
                        isDarkMode={isDarkMode}
                        className="h-[248px] flex-none rounded-none border-0 sm:h-[360px] xl:h-full xl:flex-1"
                        height={null}
                        emptyLabel={isLoadingCurrentFeatures ? 'Loading current annotations…' : 'No current annotations yet'}
                        lazy={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className={`min-h-0 border-t xl:flex xl:flex-col xl:border-l xl:border-t-0 ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white'}`}>
            <div className="space-y-3 p-3 sm:space-y-4 sm:p-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
              <div className={`rounded-2xl border p-4 sm:rounded-3xl ${softPanel}`}>
                <p className={`text-xs font-black uppercase tracking-[0.16em] ${labelText}`}>Review Status</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <span className={`${isDarkMode ? 'border-blue-400/20 bg-blue-500/10 text-blue-300' : 'border-blue-200 bg-blue-50 text-blue-700'} w-fit rounded-full border px-3 py-1 text-xs font-black`}>
                    {statusLabel}
                  </span>
                  <span className={`text-xs font-semibold ${mutedText}`}>
                    Updated {formatDate(currentProject.updatedAt || currentProject.createdAt)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3 xl:grid-cols-2">
                <DiffMetric label="Previous" value={diff.previousCount} isDarkMode={isDarkMode} />
                <DiffMetric label="Current" value={diff.currentCount} tone="blue" isDarkMode={isDarkMode} />
                <DiffMetric label="Added" value={diff.added} tone="green" isDarkMode={isDarkMode} />
                <DiffMetric label="Changed" value={diff.changed} tone="orange" isDarkMode={isDarkMode} />
                <DiffMetric label="Removed" value={diff.removed} tone="red" isDarkMode={isDarkMode} />
              </div>

              {!diff.hasPreviousSnapshot && (
                <div className={`${isDarkMode ? 'border-amber-400/30 bg-amber-950/30 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'} rounded-2xl border p-4 text-sm font-semibold leading-relaxed sm:rounded-3xl`}>
                  No previous annotation snapshot is available yet. Current submission annotations are shown from the live project data.
                </div>
              )}

              <div className={`rounded-2xl border p-4 shadow-sm sm:rounded-3xl ${panel}`}>
                <label className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] ${labelText}`}>
                  <MessageSquareText size={15} />
                  Remarks / Comments
                </label>
                <textarea
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  disabled={!isReviewable || Boolean(busyAction)}
                  placeholder="Write review remarks. The same text is saved as the review comment."
                  className={`mt-3 h-20 w-full resize-none rounded-2xl border p-3 text-sm font-semibold leading-relaxed outline-none transition disabled:cursor-not-allowed disabled:opacity-60 sm:h-24 ${isDarkMode ? 'border-white/10 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:border-blue-400/40 focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/10' : 'border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100'}`}
                />
              </div>

              <div className={`rounded-2xl border p-4 shadow-sm sm:rounded-3xl ${panel}`}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <p className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] ${labelText}`}>
                    <UserRound size={15} />
                    Reviewer
                  </p>
                  <p className={`truncate text-sm font-black ${strongText}`}>{reviewer}</p>
                </div>
                <div className={`mt-3 flex flex-col gap-1 text-sm font-semibold sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${mutedText}`}>
                  <span className="inline-flex items-center gap-2"><Clock3 size={15} /> Reviewed</span>
                  <span>{formatDateTime(currentProject.reviewedAt || currentProject.reviewStartedAt)}</span>
                </div>
              </div>

              {previousRemarks.length > 0 && (
                <div className={`rounded-2xl border p-4 shadow-sm sm:rounded-3xl ${panel}`}>
                  <p className={`text-xs font-black uppercase tracking-[0.16em] ${labelText}`}>Previous Remarks</p>
                  <div className="mt-3 space-y-3">
                    {previousRemarks.slice(0, 3).map((item) => (
                      <div key={item.id} className={`rounded-2xl p-3 ring-1 ${isDarkMode ? 'bg-slate-950/70 ring-white/10' : 'bg-slate-50 ring-slate-100'}`}>
                        <p className={`line-clamp-3 text-sm font-semibold leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{item.comment}</p>
                        <p className={`mt-1 text-xs font-semibold ${labelText}`}>
                          {item.actor} · {formatDateTime(item.date)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={`rounded-2xl border p-4 shadow-sm sm:rounded-3xl ${panel}`}>
                <p className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] ${labelText}`}>
                  <GitCompareArrows size={15} />
                  Audit Timeline
                </p>
                <div className="mt-4 space-y-3">
                  {timeline.length === 0 ? (
                    <p className={`text-sm font-semibold ${labelText}`}>No audit events yet.</p>
                  ) : (
                    timeline.slice(0, 5).map((item) => (
                      <div key={item.id} className={`${isDarkMode ? 'border-blue-400/20' : 'border-blue-100'} border-l-2 pl-3`}>
                        <p className={`text-sm font-black capitalize ${strongText}`}>{item.action.replaceAll('_', ' ')}</p>
                        <p className={`text-xs font-semibold ${mutedText}`}>
                          {item.actor} · {formatDateTime(item.date)}
                        </p>
                        {item.comment && <p className={`mt-1 line-clamp-2 text-xs leading-relaxed ${mutedText}`}>{item.comment}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className={`mx-3 mb-3 mt-1 shrink-0 rounded-2xl border p-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] sm:mx-5 sm:mb-5 sm:p-4 xl:sticky xl:bottom-0 xl:mx-0 xl:mb-0 xl:mt-0 xl:rounded-none xl:border-x-0 xl:border-b-0 ${isDarkMode ? 'border-white/10 bg-slate-950/95' : 'border-slate-200 bg-white/95'}`}>
              <div className="flex flex-col gap-2">
                {isReviewable && (
                  <div className="grid grid-cols-2 gap-2 [&>button]:min-h-10 [&>button]:w-full">
                    <Button
                      variant={hasRemarks ? 'secondary' : 'ghost'}
                      icon={MessageSquareText}
                      loading={busyAction === 'comment'}
                      disabled={!hasRemarks || Boolean(busyAction)}
                      onClick={() => runAction('comment', () => addReviewComment(projectId, remarks.trim()), { requireRemarks: true, closeOnSuccess: false })}
                    >
                      Add Comment
                    </Button>
                    <Button
                      variant={hasRemarks && isUnderReview ? 'secondary' : 'ghost'}
                      icon={AlertCircle}
                      loading={busyAction === 'revision'}
                      disabled={!hasRemarks || !isUnderReview || Boolean(busyAction)}
                      onClick={() => runAction('revision', () => requestProjectRevision(projectId, remarks.trim()), { requireRemarks: true })}
                    >
                      Request Revision
                    </Button>
                    <Button
                      icon={Check}
                      loading={busyAction === 'approve'}
                      disabled={!isUnderReview || Boolean(busyAction)}
                      onClick={() => runAction('approve', () => onApprove(currentProject))}
                    >
                      Approve
                    </Button>
                    <Button
                      variant={hasRemarks && isUnderReview ? 'danger' : 'ghost'}
                      icon={AlertCircle}
                      loading={busyAction === 'reject'}
                      disabled={!hasRemarks || !isUnderReview || Boolean(busyAction)}
                      onClick={() => runAction('reject', () => onReject(currentProject, remarks.trim()), { requireRemarks: true })}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {isApproved && (
                  <Button
                    icon={Send}
                    loading={busyAction === 'publish'}
                    disabled={Boolean(busyAction)}
                    onClick={() => runAction('publish', () => onPublish(currentProject))}
                  >
                    Publish
                  </Button>
                )}

                <Button variant="ghost" disabled={Boolean(busyAction)} onClick={onClose}>
                  Close
                </Button>
              </div>
              {!hasRemarks && isReviewable && (
                <p className={`mt-2 text-center text-[11px] font-semibold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} ${disabledReviewButton}`}>
                  Add remarks to enable comment, revision, or reject actions.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
