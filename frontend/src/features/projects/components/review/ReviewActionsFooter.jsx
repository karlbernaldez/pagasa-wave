import { AlertCircle, Check, MessageSquareText, Send, ShieldAlert } from 'lucide-react';

import Button from '@/components/ui/Button';

const NO_PUBLICATION_REASON = 'Operational exception / no verified publication';

function ActionHint({ isReviewable, isUnderReview, isApproved, hasRemarks, canPublish, isDarkMode }) {
  if (!isReviewable && !isApproved) return null;

  const surface = isDarkMode
    ? 'border-white/10 bg-white/[0.035] text-slate-300'
    : 'border-white/75 bg-white/58 text-slate-700';

  if (isApproved) {
    return (
      <div className={`rounded-xl border px-3 py-2 text-xs font-semibold leading-5 backdrop-blur-xl ${surface}`}>
        {canPublish
          ? 'This chart is approved and ready to publish.'
          : 'This chart is approved. Complete the remaining package charts before publishing the package.'}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border px-3 py-2 text-xs font-semibold leading-5 backdrop-blur-xl ${surface}`}>
      {!isUnderReview
        ? 'Start review before making a decision.'
        : hasRemarks
          ? 'Approve the chart or return it with your remarks.'
          : 'Approve now, or add remarks to enable revision and no-publication actions.'}
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
  const canPublish = typeof onPublish === 'function';

  return (
    <div className={`mx-3 mb-3 mt-1 shrink-0 rounded-2xl border p-3 shadow-2xl backdrop-blur-2xl sm:mx-4 sm:mb-4 xl:sticky xl:bottom-0 xl:mx-0 xl:mb-0 xl:mt-0 xl:rounded-none xl:border-x-0 xl:border-b-0 ${
      isDarkMode
        ? 'border-white/10 bg-[#06182b]/82 shadow-black/25'
        : 'border-white/80 bg-white/74 shadow-slate-900/10'
    }`}>
      <div className="space-y-3">
        {actionError && (
          <div className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-xs font-semibold ${isDarkMode ? 'border-red-500/30 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`} role="alert">
            <span className="inline-flex items-start gap-2">
              <AlertCircle className="mt-0.5 shrink-0" size={14} />
              {actionError}
            </span>
            <button type="button" className="shrink-0 font-black uppercase tracking-wide" onClick={onClearActionError}>Dismiss</button>
          </div>
        )}

        <ActionHint isReviewable={isReviewable} isUnderReview={isUnderReview} isApproved={isApproved} hasRemarks={hasRemarks} canPublish={canPublish} isDarkMode={isDarkMode} />

        {isReviewable && (
          <>
            <Button
              className="min-h-11 w-full"
              icon={Check}
              loading={busyAction === 'approve'}
              disabled={!isUnderReview || Boolean(busyAction)}
              onClick={onApprove}
            >
              Approve chart
            </Button>

            <div className="grid grid-cols-2 gap-2 [&>button]:min-h-10 [&>button]:w-full">
              <Button
                variant="secondary"
                icon={MessageSquareText}
                loading={busyAction === 'comment'}
                disabled={!hasRemarks || Boolean(busyAction)}
                onClick={onAddComment}
              >
                Comment
              </Button>
              <Button
                variant="secondary"
                icon={AlertCircle}
                loading={busyAction === 'revision'}
                disabled={!hasRemarks || !isUnderReview || Boolean(busyAction)}
                onClick={onRequestRevision}
              >
                Request revision
              </Button>
            </div>

            <Button
              variant="ghost"
              icon={ShieldAlert}
              loading={busyAction === 'noPublication'}
              disabled={!hasRemarks || !isUnderReview || Boolean(busyAction)}
              onClick={() => onNoPublication?.(NO_PUBLICATION_REASON)}
            >
              Mark as no publication
            </Button>
          </>
        )}

        {isApproved && canPublish && (
          <Button className="min-h-11 w-full" icon={Send} loading={busyAction === 'publish'} disabled={Boolean(busyAction)} onClick={onPublish}>
            Publish chart
          </Button>
        )}

        <button
          type="button"
          disabled={Boolean(busyAction)}
          onClick={onClose}
          className={`w-full rounded-lg py-2 text-xs font-black uppercase tracking-[0.12em] transition disabled:opacity-50 ${isDarkMode ? 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
        >
          Close
        </button>
      </div>
    </div>
  );
}
