const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const SUPPORTED_TIMEZONES = new Set(['Asia/Manila', 'UTC']);
const MAP_PRESETS = new Set(['tcad', 'tcid', 'custom']);

function validationError(message, details = []) {
  const error = new Error(message);
  error.statusCode = 400;
  error.details = details;
  return error;
}

function cleanString(value, { field, max = 1000, allowEmpty = true } = {}) {
  const result = String(value ?? '').trim();
  if (!allowEmpty && !result) {
    throw validationError(`${field} is required.`);
  }
  if (result.length > max) {
    throw validationError(`${field} must be ${max} characters or less.`);
  }
  return result;
}

function readFiniteNumber(value, field, { min = -Infinity, max = Infinity } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw validationError(`${field} must be between ${min} and ${max}.`);
  }
  return number;
}

function timeToMinutes(value, field) {
  const time = cleanString(value, { field, max: 5, allowEmpty: false });
  if (!TIME_PATTERN.test(time)) {
    throw validationError(`${field} must use 24-hour HH:mm format.`);
  }
  const [hours, minutes] = time.split(':').map(Number);
  return { time, minutes: hours * 60 + minutes };
}

export function parseOperationsSettingsPayload(input = {}) {
  const submission = timeToMinutes(input.packageSubmissionDeadline, 'Submission deadline');
  const publish = timeToMinutes(input.packagePublishTarget, 'Publish target');
  const cutoff = timeToMinutes(input.noPublicationCutoff, 'No-publication cutoff');

  if (publish.minutes <= submission.minutes) {
    throw validationError('Publish target must be later than submission deadline.');
  }
  if (cutoff.minutes <= publish.minutes) {
    throw validationError('No-publication cutoff must be later than publish target.');
  }

  const timezone = cleanString(input.timezone || 'Asia/Manila', {
    field: 'Timezone',
    max: 50,
    allowEmpty: false,
  });
  if (!SUPPORTED_TIMEZONES.has(timezone)) {
    throw validationError('Timezone must be Asia/Manila or UTC.');
  }

  return {
    packageSubmissionDeadline: submission.time,
    packagePublishTarget: publish.time,
    noPublicationCutoff: cutoff.time,
    deadlineWarningMinutes: readFiniteNumber(
      input.deadlineWarningMinutes ?? 60,
      'Deadline warning minutes',
      { min: 0, max: 1440 }
    ),
    timezone,
  };
}

const WORKSPACE_FIELDS = Object.freeze({
  workspaceWelcomeTitle: 120,
  workspaceWelcomeDescription: 1000,
  collaborationPresenceMessage: 1000,
  qaChecklistReminder: 1000,
  deadlineReminderMessage: 1000,
  deadlineApproachingMessage: 1000,
  deadlinePassedMessage: 1000,
  publishTargetMissedMessage: 1000,
  noPublicationCutoffMessage: 1000,
  revisionInstructionMessage: 1000,
  emptyPackageMessage: 1000,
  chartSequenceHelperMessage: 1500,
});

export function parseForecasterWorkspaceSettingsPayload(input = {}) {
  return Object.fromEntries(
    Object.entries(WORKSPACE_FIELDS).map(([field, max]) => [
      field,
      cleanString(input[field], { field, max }),
    ])
  );
}

function validateBoundsRecord(input = {}, prefix = 'Map bounds') {
  const westLng = readFiniteNumber(input.westLng, `${prefix} west longitude`, {
    min: -180,
    max: 180,
  });
  const eastLng = readFiniteNumber(input.eastLng, `${prefix} east longitude`, {
    min: -180,
    max: 180,
  });
  const southLat = readFiniteNumber(input.southLat, `${prefix} south latitude`, {
    min: -85,
    max: 85,
  });
  const northLat = readFiniteNumber(input.northLat, `${prefix} north latitude`, {
    min: -85,
    max: 85,
  });

  if (westLng >= eastLng) {
    throw validationError(`${prefix}: west longitude must be less than east longitude.`);
  }
  if (southLat >= northLat) {
    throw validationError(`${prefix}: south latitude must be less than north latitude.`);
  }

  return { westLng, southLat, eastLng, northLat };
}

function normalizeLogoSource(value) {
  const source = cleanString(value || '/pagasa-logo.png', {
    field: 'Logo source',
    max: 40000,
    allowEmpty: false,
  });

  if (
    source.startsWith('/') ||
    source.startsWith('https://') ||
    source.startsWith('http://') ||
    source.startsWith('data:image/')
  ) {
    return source;
  }

  throw validationError('Logo source must be an app path, http/https URL, or image data URI.');
}

export function parseGeneralSettingsPayload(input = {}) {
  const preset = cleanString(input.mapBoundsPreset || 'tcad', {
    field: 'Map bounds preset',
    max: 20,
    allowEmpty: false,
  });
  if (!MAP_PRESETS.has(preset)) {
    throw validationError('Map bounds preset must be tcad, tcid, or custom.');
  }

  const mapBoundsCustom = validateBoundsRecord(input.mapBoundsCustom || {}, 'Custom map bounds');
  const savedInput = Array.isArray(input.savedCustomMapBounds)
    ? input.savedCustomMapBounds.slice(0, 20)
    : [];
  const savedCustomMapBounds = savedInput.map((record, index) => ({
    id: cleanString(record?.id || `custom-${index + 1}`, {
      field: `Saved map bound ${index + 1} id`,
      max: 120,
      allowEmpty: false,
    }),
    name: cleanString(record?.name || `Custom bounds ${index + 1}`, {
      field: `Saved map bound ${index + 1} name`,
      max: 120,
      allowEmpty: false,
    }),
    ...validateBoundsRecord(record || {}, `Saved map bound ${index + 1}`),
  }));

  return {
    logoPreview: normalizeLogoSource(input.logoPreview),
    showPublicStaffInfo: input.showPublicStaffInfo !== false,
    publicChartPdfNote: cleanString(input.publicChartPdfNote, {
      field: 'Published chart PDF note',
      max: 2000,
    }),
    mapBoundsPreset: preset,
    mapBoundsCustomName: cleanString(input.mapBoundsCustomName, {
      field: 'Custom map bounds name',
      max: 120,
    }),
    mapBoundsCustom,
    selectedCustomMapBoundsId: cleanString(input.selectedCustomMapBoundsId, {
      field: 'Selected custom map bounds id',
      max: 120,
    }),
    savedCustomMapBounds,
  };
}
