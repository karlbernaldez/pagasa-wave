import { formatPackageDate, getDateKey } from '@/features/projects/utils/forecastPackageGrouping';

export const CALENDAR_TIME_ZONE = 'Asia/Manila';

export const EVENT_TYPE_META = Object.freeze({
  Package: { label: 'Forecast', tone: 'cyan' },
  Review: { label: 'Review', tone: 'amber' },
  Publication: { label: 'Publication', tone: 'emerald' },
  Returned: { label: 'Returned', tone: 'rose' },
  Deadline: { label: 'Deadline', tone: 'orange' },
  Meeting: { label: 'Meeting', tone: 'blue' },
  Maintenance: { label: 'Maintenance', tone: 'violet' },
  Training: { label: 'Training', tone: 'indigo' },
  Reminder: { label: 'Reminder', tone: 'slate' },
  Deployment: { label: 'Deployment', tone: 'purple' },
  Other: { label: 'Other', tone: 'slate' },
});

const REVIEW_STATUSES = new Set(['Submitted', 'Under Review', 'Needs Review']);
const RETURNED_STATUSES = new Set(['Rejected', 'Revision Requested', 'Returned']);
const APPROVED_STATUSES = new Set(['Approved', 'Published']);

const pad = (value) => String(value).padStart(2, '0');

export function manilaDateTime(dateKey, time) {
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  if (!/^\d{2}:\d{2}$/.test(String(time || ''))) return null;
  return `${dateKey}T${time}:00+08:00`;
}

export function monthRange(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return {
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export function dateKeysInRange(start, end) {
  const keys = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const stop = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cursor < stop) {
    keys.push(`${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

export function buildScheduleEvents(start, end, settings = {}) {
  const milestones = [
    {
      key: 'open',
      title: 'Forecast production opens',
      time: settings.packageOpenTime || '06:00',
      action: 'Begin the daily Forecast Package production workflow.',
    },
    {
      key: 'submit',
      title: 'Submission deadline',
      time: settings.packageSubmissionDeadline || '10:00',
      action: 'Forecast Package should be complete and submitted for review.',
    },
    {
      key: 'publish',
      title: 'Publication target',
      time: settings.packagePublishTarget || '12:00',
      action: 'Approved daily package should be published by the operational target.',
    },
    {
      key: 'cutoff',
      title: 'No-publication cutoff',
      time: settings.noPublicationCutoff || '18:00',
      action: 'Resolve the daily package or record the operational exception.',
    },
  ];

  return dateKeysInRange(start, end).flatMap((dateKey) =>
    milestones
      .map((milestone) => {
        const startsAt = manilaDateTime(dateKey, milestone.time);
        if (!startsAt) return null;
        return {
          id: `schedule-${dateKey}-${milestone.key}`,
          title: milestone.title,
          startsAt,
          date: dateKey,
          type: 'Deadline',
          source: 'schedule',
          timing: 'scheduled',
          owner: 'Forecast Operations',
          detail: `${milestone.time} Asia/Manila`,
          action: milestone.action,
          readOnly: true,
        };
      })
      .filter(Boolean)
  );
}

function packageTitle(forecastPackage) {
  return (
    forecastPackage.title ||
    (forecastPackage.dateKey
      ? `${formatPackageDate(forecastPackage.dateKey)} Forecast Package`
      : 'Forecast Package')
  );
}

function workflowEvent(forecastPackage, suffix, timestamp, type, title, detail, action, href) {
  if (!timestamp) return null;
  return {
    id: `${forecastPackage.id || forecastPackage._id}-${suffix}`,
    title,
    startsAt: timestamp,
    date: getDateKey(timestamp),
    type,
    source: 'workflow',
    timing: 'actual',
    owner: 'Forecast Operations',
    detail,
    action,
    href,
    packageId: forecastPackage.id || forecastPackage._id,
    readOnly: true,
  };
}

export function buildPackageEvents(packages = []) {
  return packages.flatMap((forecastPackage) => {
    const id = forecastPackage.id || forecastPackage._id;
    const dateKey =
      forecastPackage.dateKey ||
      getDateKey(forecastPackage.forecastDate || forecastPackage.createdAt);
    const title = packageTitle(forecastPackage);
    const packageHref = id ? `/forecasts/${id}` : '/forecasts';
    const reviewHref = '/forecasts/review';
    const events = [];

    if (dateKey) {
      events.push({
        id: `${id || dateKey}-package-day`,
        title,
        startsAt: manilaDateTime(dateKey, '00:00'),
        date: dateKey,
        type: 'Package',
        source: 'workflow',
        timing: 'actual',
        owner: forecastPackage.contributorLabel || 'Forecast team',
        detail: `${forecastPackage.chartCount || 0} of 4 charts linked · ${forecastPackage.status || 'In Production'}`,
        action: 'Open the Forecast Package.',
        href: packageHref,
        packageId: id,
        allDay: true,
        readOnly: true,
      });
    }

    events.push(
      workflowEvent(
        forecastPackage,
        'submitted',
        forecastPackage.submittedAt,
        'Review',
        `Submitted ${title}`,
        'Forecast Package submitted for review.',
        'Open the Review Queue.',
        reviewHref
      )
    );

    events.push(
      workflowEvent(
        forecastPackage,
        'review-started',
        forecastPackage.reviewStartedAt,
        'Review',
        `Review started · ${title}`,
        'A reviewer started the package review.',
        'Continue package review.',
        reviewHref
      )
    );

    if (RETURNED_STATUSES.has(forecastPackage.status) && forecastPackage.reviewedAt) {
      events.push(
        workflowEvent(
          forecastPackage,
          'returned',
          forecastPackage.reviewedAt,
          'Returned',
          `Revision requested · ${title}`,
          forecastPackage.reviewComment || 'Package returned for revision.',
          'Open the Forecast Package and resolve requested revisions.',
          packageHref
        )
      );
    }

    if (APPROVED_STATUSES.has(forecastPackage.status) && forecastPackage.reviewedAt) {
      events.push(
        workflowEvent(
          forecastPackage,
          'approved',
          forecastPackage.reviewedAt,
          'Publication',
          `Approved ${title}`,
          'Forecast Package approved and ready for publication.',
          'Open the package and proceed to publication.',
          packageHref
        )
      );
    }

    events.push(
      workflowEvent(
        forecastPackage,
        'published',
        forecastPackage.publishedAt,
        'Publication',
        `Published ${title}`,
        'Forecast Package publication completed.',
        'Open the published package.',
        packageHref
      )
    );

    if (
      REVIEW_STATUSES.has(forecastPackage.status) &&
      !forecastPackage.submittedAt &&
      forecastPackage.updatedAt
    ) {
      events.push(
        workflowEvent(
          forecastPackage,
          'review-state',
          new Date(forecastPackage.updatedAt).toISOString(),
          'Review',
          `Review needed · ${title}`,
          'Package is waiting for a review decision.',
          'Open the Review Queue.',
          reviewHref
        )
      );
    }

    if (
      APPROVED_STATUSES.has(forecastPackage.status) &&
      !forecastPackage.reviewedAt &&
      !forecastPackage.publishedAt &&
      forecastPackage.updatedAt
    ) {
      events.push(
        workflowEvent(
          forecastPackage,
          'publication-state',
          new Date(forecastPackage.updatedAt).toISOString(),
          'Publication',
          `Publication ready · ${title}`,
          'Package is approved or published.',
          'Open the Forecast Package.',
          packageHref
        )
      );
    }

    return events.filter(Boolean);
  });
}

export function normalizeManualEvents(events = []) {
  return events.map((event) => ({
    ...event,
    type: event.type ? event.type.charAt(0).toUpperCase() + event.type.slice(1) : 'Other',
    date: getDateKey(event.startsAt),
    source: 'manual',
    timing: 'scheduled',
    owner: event.ownerLabel || 'Operations',
    detail: event.description || event.location || '',
    action:
      event.status === 'cancelled'
        ? 'Cancelled operational event.'
        : event.location
          ? `Location: ${event.location}`
          : 'Shared operational calendar event.',
    readOnly: false,
  }));
}

export function sortCalendarEvents(events = []) {
  return [...events].sort((left, right) => {
    const leftTime = new Date(left.startsAt || `${left.date}T00:00:00+08:00`).getTime();
    const rightTime = new Date(right.startsAt || `${right.date}T00:00:00+08:00`).getTime();
    if (leftTime !== rightTime) return leftTime - rightTime;
    return String(left.title || '').localeCompare(String(right.title || ''));
  });
}
