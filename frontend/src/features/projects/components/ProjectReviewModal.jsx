import { useState } from 'react';
import { AlertCircle, Check, Clock3, GitCompareArrows, MessageSquareText, Send, UserRound, X } from 'lucide-react';

import Button from '@/components/ui/Button';
import ProjectPreviewMap from '@/features/projects/components/ProjectPreviewMap';
import { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';
import { addReviewComment, requestProjectRevision } from '@/api/projectAPI';

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

  if (project?.reviewComment) {
    remarks.push({
      id: 'review-comment',
      comment: project.reviewComment,
      actor: getUserLabel(project.rejectedBy || project.approvedBy || project.reviewStartedBy),
      date: project.reviewedAt || project.updatedAt,
      action: 'review_comment',
    });
  }

  getTimeline(project)
    .filter((item) => item.comment && !['Project created', 'Submitted for review', 'Project review started'].includes(item.comment))
    .forEach((item) => remarks.push(item));

  const seen = new Set();
  return remarks.filter((item) => {
    const key = `${item.comment}-${item.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getReviewer(project) {
  return getUserLabel(project?.approvedBy || project?.rejectedBy || project?.reviewStartedBy);
}

function getCurrentFeatureSource(project) {
  return project?.features || project?.featureCollection || project?.annotations || [];
}

function getPreviousFeatureSource(project) {
  const versions = Array.isArray(project?.versions) ? project.versions : [];
  const previousVersion = versions.length > 1 ? versions[versions.length - 2] : versions[0];

  return previousVersion?.features || previousVersion?.featureCollection || previousVersion?.annotations || [];
}

function getFeatureKey(feature) {
  return feature?._id || feature?.id || feature?.properties?.id || JSON.stringify(feature?.geometry || {});
}

function getAnnotationDiff(project) {
  const previous = normalizeFeatureCollection(getPreviousFeatureSource(project)).features;
  const current = normalizeFeatureCollection(getCurrentFeatureSource(project)).features;

  const previousKeys = new Set(previous.map(getFeatureKey));
  const currentKeys = new Set(current.map(getFeatureKey));

  return {
    previousCount: previous.length,
    currentCount: current.length,
    added: current.filter((feature) => !previousKeys.has(getFeatureKey(feature))).length,
    removed: previous.filter((feature) => !currentKeys.has(getFeatureKey(feature))).length,
    unchanged: current.filter((feature) => previousKeys.has(getFeatureKey(feature))).length,
    hasPreviousSnapshot: previous.length > 0,
  };
}

export default function ProjectReviewModal({
  project,
  onClose,
  onApprove,
  onReject,
  onPublish,
  onActionComplete,
}) {
  const [remarks, setRemarks] = useState('');
  const [busyAction, setBusyAction] = useState(null);

  if (!project) return null;

  const projectId = getProjectId(project);
  const status = project?.status || 'Draft';
  const isReviewable = ['Submitted', 'Under Review'].includes(status);
  const isApproved = status === 'Approved';

  const runAction = async (key, action) => {
    try {
      setBusyAction(key);
      await action();
      await onActionComplete?.();
      onClose?.();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Action failed.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border bg-white p-6">
        <h2 className="text-lg font-bold">Review Project</h2>

        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add remarks..."
          className="mt-4 w-full rounded border p-2"
        />

        <div className="mt-4 flex gap-2">
          {isReviewable && (
            <>
              <Button
                loading={busyAction === 'comment'}
                onClick={() =>
                  runAction('comment', () => addReviewComment(projectId, remarks))
                }
              >
                Add Comment
              </Button>

              <Button
                loading={busyAction === 'revision'}
                disabled={!remarks.trim()}
                onClick={() =>
                  runAction('revision', () => requestProjectRevision(projectId, remarks))
                }
              >
                Request Revision
              </Button>

              <Button
                loading={busyAction === 'approve'}
                onClick={() => runAction('approve', () => onApprove(project))}
              >
                Approve
              </Button>

              <Button
                loading={busyAction === 'reject'}
                onClick={() => runAction('reject', () => onReject(project, remarks))}
              >
                Reject
              </Button>
            </>
          )}

          {isApproved && (
            <Button
              loading={busyAction === 'publish'}
              onClick={() => runAction('publish', () => onPublish(project))}
            >
              Publish
            </Button>
          )}

          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
