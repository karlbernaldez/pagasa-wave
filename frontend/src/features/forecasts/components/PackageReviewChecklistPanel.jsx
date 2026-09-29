import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Loader2,
  MinusCircle,
  RotateCcw,
} from 'lucide-react';

import { getPackageReviewChecklist, updatePackageReviewChecklistItem } from '@/api/reviewChecklist';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const STATUS_META = {
  Pending: { label: 'Pending', icon: RotateCcw },
  Pass: { label: 'Pass', icon: Check },
  'Needs Attention': { label: 'Needs attention', icon: AlertTriangle },
  'N/A': { label: 'N/A', icon: MinusCircle },
};

function reviewerName(user) {
  if (!user) return '';
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username || user.email || '';
}

export default function PackageReviewChecklistPanel({
  packageId,
  isDarkMode,
  canReview = false,
  enabled = false,
  onProgressChange,
}) {
  const [checklist, setChecklist] = useState(null);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(enabled);
  const [busyItemId, setBusyItemId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!enabled || !packageId) {
      queueMicrotask(() => {
        if (cancelled) return;
        setChecklist(null);
        setLoading(false);
        setError('');
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError('');
    });

    getPackageReviewChecklist(packageId)
      .then((data) => {
        if (cancelled) return;
        setChecklist(data);
        setComments(
          Object.fromEntries((data?.items || []).map((item) => [item._id, item.comment || '']))
        );
        onProgressChange?.(data?.progress || null);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, packageId, onProgressChange]);

  const orderedItems = useMemo(
    () =>
      [...(checklist?.items || [])].sort(
        (a, b) => Number(a?.sortOrderSnapshot || 0) - Number(b?.sortOrderSnapshot || 0)
      ),
    [checklist?.items]
  );

  const updateItem = async (item, nextStatus) => {
    if (!canReview || busyItemId) return;

    setBusyItemId(item._id);
    setError('');

    try {
      const result = await updatePackageReviewChecklistItem(packageId, item._id, {
        status: nextStatus,
        comment: comments[item._id] || '',
        version: item.version,
      });

      const updatedChecklist = result?.checklist;
      const progress = result?.progress || null;

      setChecklist((current) => ({
        ...(current || {}),
        ...(updatedChecklist || {}),
        progress,
      }));
      if (updatedChecklist?.items) {
        setComments(
          Object.fromEntries(
            updatedChecklist.items.map((updatedItem) => [
              updatedItem._id,
              updatedItem.comment || '',
            ])
          )
        );
      }
      onProgressChange?.(progress);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyItemId(null);
    }
  };

  if (!enabled) {
    return (
      <div
        className={cn(
          'rounded-xl border px-4 py-4 text-sm font-semibold',
          isDarkMode
            ? 'border-white/10 bg-white/[0.03] text-slate-400'
            : 'border-slate-200 bg-slate-50 text-slate-600'
        )}
      >
        Start package review to activate the operational checklist.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center py-6 text-sm font-semibold text-slate-500">
        <Loader2 size={16} className="mr-2 animate-spin" />
        Loading review checklist...
      </div>
    );
  }

  if (error && !checklist) {
    return (
      <div
        role="alert"
        className={cn(
          'rounded-xl border px-4 py-3 text-sm font-semibold',
          isDarkMode
            ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
            : 'border-rose-200 bg-rose-50 text-rose-700'
        )}
      >
        {error}
      </div>
    );
  }

  if (!checklist) return null;

  const progress = checklist.progress || {};
  const completedRequired = Number(progress.requiredCompleted || 0);
  const required = Number(progress.required || 0);

  return (
    <section
      className={cn(
        'rounded-2xl border p-4 sm:p-5',
        isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-slate-200 bg-white/70'
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck size={18} className={isDarkMode ? 'text-cyan-300' : 'text-cyan-700'} />
            <h3 className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
              Review Checklist
            </h3>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {checklist.definitionNameSnapshot} · Version {checklist.definitionVersion} · Review
            attempt {checklist.reviewAttempt}
          </p>
        </div>
        <span
          className={cn(
            'w-fit rounded-full border px-3 py-1 text-xs font-black',
            progress.canApprove
              ? isDarkMode
                ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : isDarkMode
                ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
                : 'border-amber-200 bg-amber-50 text-amber-700'
          )}
        >
          {completedRequired}/{required} required
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className={cn(
            'mt-4 rounded-xl border px-3 py-2 text-xs font-semibold',
            isDarkMode
              ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          )}
        >
          {error}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {orderedItems.map((item) => {
          const busy = busyItemId === item._id;
          const reviewer = reviewerName(item.reviewedBy);
          const availableStatuses = ['Pass', 'Needs Attention'];
          if (item.allowNotApplicableSnapshot) availableStatuses.push('N/A');

          return (
            <div
              key={item._id}
              className={cn(
                'rounded-xl border p-4',
                isDarkMode ? 'border-white/10 bg-slate-950/35' : 'border-slate-200 bg-slate-50/70'
              )}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        'text-sm font-black',
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      )}
                    >
                      {item.labelSnapshot}
                    </p>
                    {item.requiredSnapshot && (
                      <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-rose-500">
                        Required
                      </span>
                    )}
                  </div>
                  {item.descriptionSnapshot && (
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                      {item.descriptionSnapshot}
                    </p>
                  )}
                </div>
                <span className="text-xs font-black text-slate-500">{item.status}</span>
              </div>

              <textarea
                value={comments[item._id] ?? ''}
                disabled={!canReview || busy}
                onChange={(event) =>
                  setComments((current) => ({ ...current, [item._id]: event.target.value }))
                }
                rows={2}
                placeholder="Reviewer note (required for Needs Attention)"
                className={cn(
                  'mt-3 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-60',
                  isDarkMode
                    ? 'border-white/10 bg-slate-950/50 text-white placeholder-slate-600'
                    : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400'
                )}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {availableStatuses.map((status) => {
                  const meta = STATUS_META[status];
                  const Icon = meta.icon;
                  const selected = item.status === status;

                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={!canReview || busy}
                      onClick={() => updateItem(item, status)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50',
                        selected
                          ? status === 'Pass'
                            ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-500'
                            : status === 'Needs Attention'
                              ? 'border-amber-400/30 bg-amber-500/15 text-amber-500'
                              : 'border-slate-400/30 bg-slate-500/15 text-slate-500'
                          : isDarkMode
                            ? 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {busy ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
                      {meta.label}
                    </button>
                  );
                })}
              </div>

              {(reviewer || item.reviewedAt) && (
                <p className="mt-3 text-[11px] font-semibold text-slate-500">
                  Last reviewed{reviewer ? ` by ${reviewer}` : ''}
                  {item.reviewedAt ? ` · ${new Date(item.reviewedAt).toLocaleString()}` : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!canReview && (
        <p className="mt-4 text-xs font-semibold text-slate-500">
          View-only checklist access. Review evidence can only be changed by users with forecast
          review permission.
        </p>
      )}
    </section>
  );
}
