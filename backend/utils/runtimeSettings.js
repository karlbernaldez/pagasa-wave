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


const FORECAST_NAME_TEMPLATE_FIELDS = Object.freeze({
  packageNameTemplate: {
    label: 'Package name template',
    fallback: 'Marine Forecast {date}',
    allowedTokens: new Set(['date']),
  },
  analysisChartNameTemplate: {
    label: 'Wave Analysis chart name template',
    fallback: '{package} - Wave Analysis',
    allowedTokens: new Set(['date', 'package']),
  },
  forecast24ChartNameTemplate: {
    label: '24h chart name template',
    fallback: '{package} - 24h Wave Forecast',
    allowedTokens: new Set(['date', 'package']),
  },
  forecast36ChartNameTemplate: {
    label: '36h chart name template',
    fallback: '{package} - 36h Wave Forecast',
    allowedTokens: new Set(['date', 'package']),
  },
  forecast48ChartNameTemplate: {
    label: '48h chart name template',
    fallback: '{package} - 48h Wave Forecast',
    allowedTokens: new Set(['date', 'package']),
  },
});

function readForecastNameTemplate(value, config) {
  const template = cleanString(value || config.fallback, {
    field: config.label,
    max: 180,
    allowEmpty: false,
  });

  const tokens = [...template.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]);
  const invalidTokens = [...new Set(tokens.filter((token) => !config.allowedTokens.has(token)))];

  if (invalidTokens.length) {
    throw validationError(
      `${config.label} contains unsupported placeholder${invalidTokens.length === 1 ? '' : 's'}: ${invalidTokens
        .map((token) => `{${token}}`)
        .join(', ')}.`
    );
  }

  return template;
}

function parseForecastNamingSettings(input = {}) {
  return Object.fromEntries(
    Object.entries(FORECAST_NAME_TEMPLATE_FIELDS).map(([field, config]) => [
      field,
      readForecastNameTemplate(input[field], config),
    ])
  );
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
    ...parseForecastNamingSettings(input),
    autoArchivePublishedEnabled: input.autoArchivePublishedEnabled === true,
    archivePublishedAfterDays: readFiniteNumber(
      input.archivePublishedAfterDays ?? 30,
      'Published archive age',
      { min: 1, max: 3650 }
    ),
    autoArchiveNoPublicationEnabled: input.autoArchiveNoPublicationEnabled === true,
    archiveNoPublicationAfterDays: readFiniteNumber(
      input.archiveNoPublicationAfterDays ?? 30,
      'No-publication archive age',
      { min: 1, max: 3650 }
    ),
    autoArchiveAbandonedDraftsEnabled: input.autoArchiveAbandonedDraftsEnabled === true,
    archiveDraftsAfterDays: readFiniteNumber(
      input.archiveDraftsAfterDays ?? 30,
      'Draft archive age',
      { min: 1, max: 3650 }
    ),
    retainArchivedRecordsIndefinitely: true,
    preserveReviewEvidence: true,
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
  const textSettings = Object.fromEntries(
    Object.entries(WORKSPACE_FIELDS).map(([field, max]) => [
      field,
      cleanString(input[field], { field, max }),
    ])
  );

  return {
    ...textSettings,
    drawingPointerOffsetX: readFiniteNumber(
      input.drawingPointerOffsetX ?? 0,
      'Drawing pointer X offset',
      { min: -200, max: 200 }
    ),
    drawingPointerOffsetY: readFiniteNumber(
      input.drawingPointerOffsetY ?? 0,
      'Drawing pointer Y offset',
      { min: -200, max: 200 }
    ),
    drawingSmoothingPercent: readFiniteNumber(
      input.drawingSmoothingPercent ?? 50,
      'Drawing smoothing',
      { min: 0, max: 100 }
    ),
    drawingPostProcessEnabled: input.drawingPostProcessEnabled === true,
    drawingPostProcessSmoothingPercent: readFiniteNumber(
      input.drawingPostProcessSmoothingPercent ?? 50,
      'Drawing post-process smoothing',
      { min: 0, max: 100 }
    ),
  };
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


const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const DOMAIN_GEOMETRY_TYPES = new Set(['Polygon', 'MultiPolygon']);

function countCoordinatePositions(coordinates) {
  if (!Array.isArray(coordinates)) return 0;
  if (
    coordinates.length >= 2 &&
    Number.isFinite(Number(coordinates[0])) &&
    Number.isFinite(Number(coordinates[1]))
  ) {
    const lng = Number(coordinates[0]);
    const lat = Number(coordinates[1]);
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      throw validationError('Domain boundary coordinates must use WGS84 longitude/latitude values.');
    }
    return 1;
  }

  return coordinates.reduce((total, child) => total + countCoordinatePositions(child), 0);
}

function normalizeBoundaryFeatureCollection(value) {
  if (!value) return { type: 'FeatureCollection', features: [] };

  let collection = value;
  if (value.type === 'Feature') {
    collection = { type: 'FeatureCollection', features: [value] };
  } else if (DOMAIN_GEOMETRY_TYPES.has(value.type)) {
    collection = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: value }],
    };
  }

  if (collection?.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
    throw validationError('Domain boundary must be valid GeoJSON Polygon or MultiPolygon data.');
  }
  if (collection.features.length > 200) {
    throw validationError('Domain boundary may contain at most 200 features.');
  }

  let coordinateCount = 0;
  const features = collection.features.map((feature, index) => {
    const geometry = feature?.geometry;
    if (!geometry || !DOMAIN_GEOMETRY_TYPES.has(geometry.type)) {
      throw validationError(
        `Domain boundary feature ${index + 1} must be a Polygon or MultiPolygon.`
      );
    }

    coordinateCount += countCoordinatePositions(geometry.coordinates);
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: geometry.type,
        coordinates: geometry.coordinates,
      },
    };
  });

  if (coordinateCount > 50_000) {
    throw validationError('Domain boundary contains too many coordinate positions.');
  }

  return { type: 'FeatureCollection', features };
}

function readHexColor(value, field, fallback) {
  const color = cleanString(value || fallback, {
    field,
    max: 7,
    allowEmpty: false,
  });
  if (!HEX_COLOR_PATTERN.test(color)) {
    throw validationError(`${field} must be a six-digit hex color such as #2563eb.`);
  }
  return color.toLowerCase();
}

function parsePublishedDomainBoundary(input = {}) {
  return {
    enabled: input.enabled === true,
    name: cleanString(input.name || 'Published chart domain', {
      field: 'Domain boundary name',
      max: 120,
    }),
    showLine: input.showLine !== false,
    showFill: input.showFill === true,
    clipAnnotations: input.clipAnnotations === true,
    lineColor: readHexColor(input.lineColor, 'Domain boundary line color', '#0f172a'),
    lineWidth: readFiniteNumber(input.lineWidth ?? 2, 'Domain boundary line width', {
      min: 0.5,
      max: 12,
    }),
    lineOpacity: readFiniteNumber(input.lineOpacity ?? 0.9, 'Domain boundary line opacity', {
      min: 0,
      max: 1,
    }),
    fillColor: readHexColor(input.fillColor, 'Domain boundary fill color', '#38bdf8'),
    fillOpacity: readFiniteNumber(input.fillOpacity ?? 0.08, 'Domain boundary fill opacity', {
      min: 0,
      max: 1,
    }),
    geojson: normalizeBoundaryFeatureCollection(input.geojson),
  };
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
    publishedDomainBoundary: parsePublishedDomainBoundary(input.publishedDomainBoundary || {}),
  };
}
