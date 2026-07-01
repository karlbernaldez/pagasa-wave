import { AlertCircle, Check, MessageSquareText, Send, ShieldAlert } from 'lucide-react';

import Button from '@/components/ui/Button';

const NO_PUBLICATION_REASON = 'Operational exception / no verified publication';

function ActionImpactGuide({ isReviewable, isUnderReview, isApproved, hasRemarks, isDarkMode }) {
  if (!isReviewable && !isApproved) return null;

  const surfaceClass = isDarkMode
    ? 'border-white/10 bg-white/[0.04] text-slate-300'
    : 'border-slate-200 bg-slate-50 text-slate-700';
  const mutedClass = isDarkMode ? 'text-slate-500' : 'text-slate-500';

  if (isApproved) {
    return (
      <div className={`rounded-2xl border px-3 py-2 text-xs font-semibold ${surfaceClass}`}>
        <p className="font-black uppercase tracking-[0.14em]">Publish action</p>
        <p className="mt-1 leading-5">Publish finalizes this approved chart as an operational output. Use it only after confirming the reviewed package is ready for release.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border px-3 py-2 text-xs font-semibold ${surfaceClass}`}>
      <p className="font-black uppercase tracking-[0.14em]">Review action impact</p>
      <ul className="mt-1 space-y-1 leading-5">
        <li><span className="font-black">Approve</span> moves this chart to Approved and counts toward package approval.</li>
        <li><span className="font-black">Request Revision</span> returns this chart and package to the forecaster with your remarks.</li>
        <li><span className="font-black">No Publication</span> closes this chart with an operational exception note.</li>
      </ul>
      {!isUnderReview && <p className={`mt-2 ${mutedClass}`}>Start review before making approval, revision, or no-publication decisions.</p>}
      {!hasRemarks && <p className={`mt-2 ${mutedClass}`}>Remarks are required before comment, revision, or no-publication actions are enabled.</p>}
    </div>
  );
}

export default function ReviewActionsFooter({
  isReviewable = false,
  isUnderReview = false,
  isApproved = false,
  hasRemarks = false,
  busyAction = null,
  actionError = '',
  onClearActionError,
  isDarkMode = false,
  onAddComment,
  onRequestRevision,
  onApprove,
  onReject,
  onNoPublication,
  onPublish,
  onClose,
}) {
  const disabledReviewButton = isDarkMode ? 'opacity-45' : 'opacity-50';

  return (
    <div className={`mx-3 mb-3 mt-1 shrink-0 rounded-2xl border p-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] sm:mx-5 sm:mb-5 sm:p-4 xl:sticky xl:bottom-0 xl:mx-0 xl:mb-0 xl:mt-0 xl:rounded-none xl:border-x-0 xl:border-b-0 ${isDarkMode ? 'border-white/10 bg-slate-950/95' : 'border-slate-200 bg-white/95'}`}>
      <div className="flex flex-col gap-2">
        {actionError && (
          <div className={`flex items-start justify-between gap-3 rounded-2xl border px-3 py-2 text-xs font-semibold ${isDarkMode ? 'border-red-500/30 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`} role="alert">
            <span className="inline-flex items-start gap-2">
              <AlertCircle className="mt-0.5 shrink-0" size={14} />
              {actionError}
            </span>
            <button
              type="button"
              className={`shrink-0 font-black uppercase tracking-wide ${isDarkMode ? 'text-red-200 hover:text-white' : 'text-red-700 hover:text-red-900'}`}
              onClick={onClearActionError}
            >
              Dismiss
            </button>
          </div>
        )}

        <ActionImpactGuide isReviewable={isReviewable} isUnderReview={isUnderReview} isApproved={isApproved} hasRemarks={hasRemarks} isDarkMode={isDarkMode} />

        {isReviewable && (
          <div className="grid grid-cols-2 gap-2 [&>button]:min-h-10 [&>button]:w-full">
            <Button
              variant={hasRemarks ? 'secondary' : 'ghost'}
              icon={MessageSquareText}
              loading={busyAction === 'comment'}
              disabled={!hasRemarks || Boolean(busyAction)}
              onClick={onAddComment}
            >
              Add Comment
            </Button>
            <Button
              variant={hasRemarks && isUnderReview ? 'secondary' : 'ghost'}
              icon={AlertCircle}
              loading={busyAction === 'revision'}
              disabled={!hasRemarks || !isUnderReview || Boolean(busyAction)}
              onClick={onRequestRevision}
            >
              Request Revision
            </Button>
            <Button
              icon={Check}
              loading={busyAction === 'approve'}
              disabled={!isUnderReview || Boolean(busyAction)}
              onClick={onApprove}
            >
              Approve
            </Button>
            <Button
              variant={hasRemarks && isUnderReview ? 'secondary' : 'ghost'}
              icon={ShieldAlert}
              loading={busyAction === 'noPublication'}
              disabled={!hasRemarks || !isUnderReview || Boolean(busyAction)}
              onClick={() => onNoPublication?.(NO_PUBLICATION_REASON)}
            >
              No Publication
            </Button>
          </div>
        )}

        {isApproved && (
          <Button
            icon={Send}
            loading={busyAction === 'publish'}
            disabled={Boolean(busyAction)}
            onClick={onPublish}
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
          Add remarks to enable comment, revision, or no-publication actions.
        </p>
      )}
    </div>
  );
}
