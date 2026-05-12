import { Clock3, GitCompareArrows, MessageSquareText, UserRound } from 'lucide-react';

import { AnnotationDiffSummary } from '@/features/projects/components/review/AnnotationDiffSummary';

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

export default function ReviewSidebar({
  project,
  statusLabel,
  diff,
  remarks,
  onRemarksChange,
  isReviewable = false,
  busyAction = null,
  reviewer = 'System',
  previousRemarks = [],
  timeline = [],
  isDarkMode = false,
}) {
  const panel = isDarkMode ? 'border-white/10 bg-slate-950/60' : 'border-slate-200 bg-white';
  const softPanel = isDarkMode ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-slate-50';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const labelText = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const strongText = isDarkMode ? 'text-slate-100' : 'text-slate-800';

  return (
    <div className="space-y-3 p-3 sm:space-y-4 sm:p-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
      <div className={`rounded-2xl border p-4 sm:rounded-3xl ${softPanel}`}>
        <p className={`text-xs font-black uppercase tracking-[0.16em] ${labelText}`}>Review Status</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className={`${isDarkMode ? 'border-blue-400/20 bg-blue-500/10 text-blue-300' : 'border-blue-200 bg-blue-50 text-blue-700'} w-fit rounded-full border px-3 py-1 text-xs font-black`}>
            {statusLabel}
          </span>
          <span className={`text-xs font-semibold ${mutedText}`}>
            Updated {formatDate(project?.updatedAt || project?.createdAt)}
          </span>
        </div>
      </div>

      <AnnotationDiffSummary diff={diff} isDarkMode={isDarkMode} />

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
          onChange={(event) => onRemarksChange(event.target.value)}
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
          <span>{formatDateTime(project?.reviewedAt || project?.reviewStartedAt)}</span>
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
  );
}
