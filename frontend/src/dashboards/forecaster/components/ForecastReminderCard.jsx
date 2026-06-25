import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BellRing, Clock3 } from 'lucide-react';

const DEFAULT_TIMEZONE = 'Asia/Manila';

function parseTimeToMinutes(value) {
  const raw = String(value || '').trim();
  const twentyFourHourMatch = raw.match(/^(\d{1,2}):(\d{2})$/);

  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  const twelveHourMatch = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!twelveHourMatch) return null;

  let hours = Number(twelveHourMatch[1]);
  const minutes = Number(twelveHourMatch[2] || 0);
  const period = twelveHourMatch[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
  if (period === 'AM') hours = hours === 12 ? 0 : hours;
  if (period === 'PM') hours = hours === 12 ? 12 : hours + 12;

  return hours * 60 + minutes;
}

function getZonedMinutes(date, timezone = DEFAULT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: timezone || DEFAULT_TIMEZONE,
  }).formatToParts(date);

  const getPart = (type) => parts.find((part) => part.type === type)?.value;
  const hours = Number(getPart('hour'));
  const minutes = Number(getPart('minute'));

  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
}

function getConfiguredMessage(settings, field, fallback) {
  return String(settings?.[field] || '').trim() || fallback;
}

function getReminderState({ packageData, settings, now }) {
  if (packageData?.status === 'Revision Requested') {
    return {
      tone: 'revision',
      label: 'Revision required',
      badge: 'Action needed',
      message: getConfiguredMessage(settings, 'revisionInstructionMessage', 'Review admin comments, update affected charts, and resubmit the package for approval.'),
    };
  }

  const editable = !packageData || ['Draft', 'Revision Requested'].includes(packageData.status || 'Draft');
  if (!editable) return null;

  const operations = settings.operations || {};
  const timezone = operations.timezone || DEFAULT_TIMEZONE;
  const nowMinutes = getZonedMinutes(now, timezone);
  const deadlineMinutes = parseTimeToMinutes(operations.packageSubmissionDeadline);
  const publishTargetMinutes = parseTimeToMinutes(operations.packagePublishTarget);
  const noPublicationCutoffMinutes = parseTimeToMinutes(operations.noPublicationCutoff);
  const warningMinutes = Number(operations.deadlineWarningMinutes ?? 60);
  const reminderMessage = getConfiguredMessage(settings, 'deadlineReminderMessage', 'Complete and submit today\'s forecast package before the operational deadline.');

  if (nowMinutes === null || deadlineMinutes === null) {
    return {
      tone: 'normal',
      label: 'Action reminder',
      badge: 'Priority',
      message: reminderMessage,
    };
  }

  if (noPublicationCutoffMinutes !== null && nowMinutes >= noPublicationCutoffMinutes) {
    return {
      tone: 'critical',
      label: 'No-publication cutoff reached',
      badge: 'Admin action',
      message: getConfiguredMessage(settings, 'noPublicationCutoffMessage', 'No-publication cutoff has been reached. Complete the package immediately or coordinate with Admin for an operational exception.'),
    };
  }

  if (publishTargetMinutes !== null && nowMinutes >= publishTargetMinutes) {
    return {
      tone: 'critical',
      label: 'Publish target missed',
      badge: 'Escalate',
      message: getConfiguredMessage(settings, 'publishTargetMissedMessage', 'The publish target has passed. Submit late if possible and coordinate with Admin so the daily record can be resolved.'),
    };
  }

  if (nowMinutes >= deadlineMinutes) {
    return {
      tone: 'overdue',
      label: 'Deadline passed',
      badge: 'Late',
      message: getConfiguredMessage(settings, 'deadlinePassedMessage', 'The submission deadline has passed. Submit late if possible or coordinate with Admin before the no-publication cutoff.'),
    };
  }

  if (Number.isFinite(warningMinutes) && nowMinutes >= deadlineMinutes - warningMinutes) {
    return {
      tone: 'warning',
      label: 'Deadline approaching',
      badge: 'Due soon',
      message: getConfiguredMessage(settings, 'deadlineApproachingMessage', 'Submission deadline is approaching. Finish the required charts and submit the package as soon as possible.'),
    };
  }

  return {
    tone: 'normal',
    label: 'Action reminder',
    badge: 'Priority',
    message: reminderMessage,
  };
}

function getToneClasses(tone, isDarkMode) {
  if (tone === 'critical') {
    return isDarkMode
      ? 'border-red-300/70 bg-gradient-to-br from-red-400/28 via-orange-500/20 to-red-950/35 text-red-50 shadow-red-950/60 ring-2 ring-red-300/35'
      : 'border-red-300 bg-gradient-to-br from-red-50 via-white to-orange-50 text-red-950 shadow-red-200/70 ring-2 ring-red-200/80';
  }

  if (tone === 'overdue') {
    return isDarkMode
      ? 'border-orange-300/70 bg-gradient-to-br from-orange-400/28 via-amber-500/18 to-red-900/24 text-orange-50 shadow-orange-950/60 ring-2 ring-orange-300/35'
      : 'border-orange-300 bg-gradient-to-br from-orange-50 via-white to-red-50 text-orange-950 shadow-orange-200/70 ring-2 ring-orange-200/80';
  }

  if (tone === 'warning') {
    return isDarkMode
      ? 'border-amber-200/60 bg-gradient-to-br from-amber-300/25 via-amber-500/16 to-orange-600/18 text-amber-50 shadow-amber-950/50 ring-2 ring-amber-300/30'
      : 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 text-amber-950 shadow-amber-200/70 ring-2 ring-amber-200/70';
  }

  if (tone === 'revision') {
    return isDarkMode
      ? 'border-cyan-200/60 bg-gradient-to-br from-cyan-300/22 via-blue-500/14 to-slate-950 text-cyan-50 shadow-cyan-950/50 ring-2 ring-cyan-300/25'
      : 'border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 text-cyan-950 shadow-cyan-100/70 ring-2 ring-cyan-100/80';
  }

  return isDarkMode
    ? 'border-amber-200/60 bg-gradient-to-br from-amber-300/25 via-amber-500/16 to-orange-600/18 text-amber-50 shadow-amber-950/50 ring-2 ring-amber-300/30'
    : 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 text-amber-950 shadow-amber-200/70 ring-2 ring-amber-200/70';
}

function getIconClasses(tone, isDarkMode) {
  if (tone === 'critical') return isDarkMode ? 'bg-red-300 text-slate-950 shadow-red-950/40' : 'bg-red-600 text-white shadow-red-200';
  if (tone === 'overdue') return isDarkMode ? 'bg-orange-300 text-slate-950 shadow-orange-950/40' : 'bg-orange-600 text-white shadow-orange-200';
  if (tone === 'revision') return isDarkMode ? 'bg-cyan-300 text-slate-950 shadow-cyan-950/40' : 'bg-cyan-600 text-white shadow-cyan-200';
  return isDarkMode ? 'bg-amber-300 text-slate-950 shadow-amber-950/40' : 'bg-amber-500 text-white shadow-amber-200';
}

function getBadgeClasses(tone, isDarkMode) {
  if (tone === 'critical') return isDarkMode ? 'bg-red-100 text-red-950' : 'bg-red-700 text-white';
  if (tone === 'overdue') return isDarkMode ? 'bg-orange-100 text-orange-950' : 'bg-orange-700 text-white';
  if (tone === 'revision') return isDarkMode ? 'bg-cyan-100 text-cyan-950' : 'bg-cyan-700 text-white';
  return isDarkMode ? 'bg-amber-100 text-slate-950' : 'bg-amber-600 text-white';
}

export default function ForecastReminderCard({ packageData, settings, isDarkMode }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const state = useMemo(() => getReminderState({ packageData, settings, now }), [packageData, settings, now]);
  if (!state?.message) return null;

  const Icon = ['critical', 'overdue'].includes(state.tone) ? AlertTriangle : state.tone === 'warning' ? Clock3 : BellRing;

  return (
    <section className={`wavelab-reminder-card relative overflow-hidden rounded-[2rem] border p-5 shadow-2xl ${getToneClasses(state.tone, isDarkMode)}`}>
      <style>{`
        @keyframes wavelabReminderBellRing {
          0%, 82%, 100% { transform: rotate(0deg); }
          86% { transform: rotate(-13deg); }
          90% { transform: rotate(11deg); }
          94% { transform: rotate(-7deg); }
          98% { transform: rotate(4deg); }
        }

        @keyframes wavelabReminderIconPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.42); }
          55% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
        }

        @keyframes wavelabReminderCardPulse {
          0%, 100% { transform: translateY(0); filter: brightness(1); }
          50% { transform: translateY(-1px); filter: brightness(1.08); }
        }

        @keyframes wavelabReminderShimmer {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(110%); }
        }

        .wavelab-reminder-card {
          animation: wavelabReminderCardPulse 4.8s ease-in-out infinite;
        }

        .wavelab-reminder-icon {
          animation: wavelabReminderIconPulse 2.8s ease-out infinite;
        }

        .wavelab-reminder-bell {
          animation: wavelabReminderBellRing 3.6s ease-in-out infinite;
          transform-origin: 50% 12%;
        }

        .wavelab-reminder-shimmer::after {
          animation: wavelabReminderShimmer 2.8s ease-in-out infinite;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.85), transparent);
          content: '';
          inset: 0;
          position: absolute;
          width: 45%;
        }

        @media (prefers-reduced-motion: reduce) {
          .wavelab-reminder-card,
          .wavelab-reminder-icon,
          .wavelab-reminder-bell,
          .wavelab-reminder-shimmer::after {
            animation: none !important;
          }
        }
      `}</style>
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
      <div className="wavelab-reminder-shimmer pointer-events-none absolute bottom-0 left-0 h-1.5 w-full overflow-hidden bg-gradient-to-r from-amber-300 via-orange-400 to-red-300" />
      <div className="relative flex gap-4">
        <span className={`wavelab-reminder-icon grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-lg ${getIconClasses(state.tone, isDarkMode)}`}>
          <Icon className="wavelab-reminder-bell" size={24} />
        </span>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{state.label}</p>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${getBadgeClasses(state.tone, isDarkMode)}`}>{state.badge}</span>
          </div>
          <p className={`text-base font-black leading-7 ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{state.message}</p>
        </div>
      </div>
    </section>
  );
}
