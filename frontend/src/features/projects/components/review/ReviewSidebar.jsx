import { Clock3, GitCompareArrows, MessageSquareText, UserRound } from 'lucide-react';
import { AnnotationDiffSummary } from '@/features/projects/components/review/AnnotationDiffSummary';

const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const formatDateTime = (value) => value ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

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
  const panel = isDarkMode
    ? 'border-white/10 bg-white/[0.035] shadow-black/10'
    : 'border-white/80 bg-white/58 shadow-slate-900/5';
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const label = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const strong = isDarkMode ? 'text-slate-100' : 'text-slate-800';

  return (
    <div className="space-y-3 p-3 sm:p-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
      <section className={`rounded-xl border p-4 shadow-sm backdrop-blur-xl ${panel}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${label}`}>Review status</p>
            <span className={`${isDarkMode ? 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200' : 'border-cyan-200 bg-cyan-50 text-cyan-700'} mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black`}>
              {statusLabel}
            </span>
          </div>
          <p className={`text-right text-xs font-semibold ${muted}`}>Updated<br />{formatDate(project?.updatedAt || project?.createdAt)}</p>
        </div>
      </section>

      <AnnotationDiffSummary diff={diff} isDarkMode={isDarkMode} />

      {!diff.hasPreviousSnapshot && (
        <div className={`${isDarkMode ? 'border-amber-300/20 bg-amber-300/[0.07] text-amber-100' : 'border-amber-200 bg-amber-50/80 text-amber-800'} rounded-xl border px-3 py-2 text-xs font-semibold leading-5`}>
          No previous annotation snapshot is available. Current annotations are shown from the live project data.
        </div>
      )}

      <section className={`rounded-xl border p-4 shadow-sm backdrop-blur-xl ${panel}`}>
        <label className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] ${label}`}>
          <MessageSquareText size={14} /> Review remarks
        </label>
        <textarea
          value={remarks}
          onChange={(event) => onRemarksChange(event.target.value)}
          disabled={!isReviewable || Boolean(busyAction)}
          placeholder="Add remarks for comments, revisions, or no-publication decisions."
          className={`mt-3 h-24 w-full resize-none rounded-xl border p-3 text-sm font-semibold leading-relaxed outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${isDarkMode ? 'border-white/10 bg-slate-950/45 text-slate-100 placeholder:text-slate-600 focus:border-cyan-300/30 focus:ring-4 focus:ring-cyan-400/10' : 'border-white/80 bg-white/65 text-slate-800 placeholder:text-slate-400 focus:border-cyan-200 focus:ring-4 focus:ring-cyan-100'}`}
        />
      </section>

      <section className={`rounded-xl border p-4 shadow-sm backdrop-blur-xl ${panel}`}>
        <div className="flex items-center justify-between gap-3">
          <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] ${label}`}><UserRound size={14} /> Reviewer</span>
          <span className={`truncate text-sm font-black ${strong}`}>{reviewer}</span>
        </div>
        <div className={`mt-3 flex items-center justify-between gap-3 text-xs font-semibold ${muted}`}>
          <span className="inline-flex items-center gap-2"><Clock3 size={14} /> Reviewed</span>
          <span>{formatDateTime(project?.reviewedAt || project?.reviewStartedAt)}</span>
        </div>
      </section>

      {(previousRemarks.length > 0 || timeline.length > 0) && (
        <section className={`rounded-xl border p-4 shadow-sm backdrop-blur-xl ${panel}`}>
          <p className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] ${label}`}><GitCompareArrows size={14} /> Review history</p>
          <div className="mt-3 space-y-3">
            {previousRemarks.slice(0, 2).map((item) => (
              <div key={item.id} className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-950/35' : 'bg-white/60'}`}>
                <p className={`line-clamp-2 text-xs font-semibold leading-5 ${muted}`}>{item.comment}</p>
                <p className={`mt-1 text-[11px] font-semibold ${label}`}>{item.actor} · {formatDateTime(item.date)}</p>
              </div>
            ))}
            {timeline.slice(0, 3).map((item) => (
              <div key={item.id} className={`${isDarkMode ? 'border-cyan-300/20' : 'border-cyan-100'} border-l-2 pl-3`}>
                <p className={`text-xs font-black capitalize ${strong}`}>{item.action.replaceAll('_', ' ')}</p>
                <p className={`text-[11px] font-semibold ${muted}`}>{item.actor} · {formatDateTime(item.date)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
