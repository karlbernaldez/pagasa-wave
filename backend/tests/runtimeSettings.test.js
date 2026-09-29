import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseForecasterWorkspaceSettingsPayload,
  parseGeneralSettingsPayload,
  parseOperationsSettingsPayload,
} from '../utils/runtimeSettings.js';

test('operations settings accept an ordered operational schedule', () => {
  assert.deepEqual(
    parseOperationsSettingsPayload({
      packageSubmissionDeadline: '10:00',
      packagePublishTarget: '12:00',
      noPublicationCutoff: '18:00',
      deadlineWarningMinutes: 60,
      timezone: 'Asia/Manila',
      packageNameTemplate: 'Marine Forecast {date}',
      analysisChartNameTemplate: '{package} - Wave Analysis',
      forecast24ChartNameTemplate: '{package} - 24h Wave Forecast',
      forecast36ChartNameTemplate: '{package} - 36h Wave Forecast',
      forecast48ChartNameTemplate: '{package} - 48h Wave Forecast',
      autoArchivePublishedEnabled: true,
      archivePublishedAfterDays: 14,
      autoArchiveNoPublicationEnabled: false,
      archiveNoPublicationAfterDays: 30,
      autoArchiveAbandonedDraftsEnabled: false,
      archiveDraftsAfterDays: 30,
    }),
    {
      packageSubmissionDeadline: '10:00',
      packagePublishTarget: '12:00',
      noPublicationCutoff: '18:00',
      deadlineWarningMinutes: 60,
      timezone: 'Asia/Manila',
      packageNameTemplate: 'Marine Forecast {date}',
      analysisChartNameTemplate: '{package} - Wave Analysis',
      forecast24ChartNameTemplate: '{package} - 24h Wave Forecast',
      forecast36ChartNameTemplate: '{package} - 36h Wave Forecast',
      forecast48ChartNameTemplate: '{package} - 48h Wave Forecast',
      autoArchivePublishedEnabled: true,
      archivePublishedAfterDays: 14,
      autoArchiveNoPublicationEnabled: false,
      archiveNoPublicationAfterDays: 30,
      autoArchiveAbandonedDraftsEnabled: false,
      archiveDraftsAfterDays: 30,
      retainArchivedRecordsIndefinitely: true,
      preserveReviewEvidence: true,
    }
  );
});

test('operations settings reject impossible ordering and unsupported timezones', () => {
  assert.throws(
    () =>
      parseOperationsSettingsPayload({
        packageSubmissionDeadline: '12:00',
        packagePublishTarget: '11:00',
        noPublicationCutoff: '18:00',
        deadlineWarningMinutes: 60,
        timezone: 'Asia/Manila',
      }),
    /Publish target must be later/
  );

  assert.throws(
    () =>
      parseOperationsSettingsPayload({
        packageSubmissionDeadline: '10:00',
        packagePublishTarget: '12:00',
        noPublicationCutoff: '18:00',
        deadlineWarningMinutes: 60,
        timezone: 'Mars\/Olympus',
      }),
    /Timezone must be/
  );
});

test('workspace settings persist only runtime-backed fields', () => {
  const parsed = parseForecasterWorkspaceSettingsPayload({
    workspaceWelcomeTitle: 'Marine Operations',
    workspaceWelcomeDescription: 'Prepare the daily package.',
    collaborationPresenceMessage: 'Coordinate with active editors.',
    qaChecklistReminder: 'Verify labels before submission.',
    deadlineReminderMessage: 'Submit before the deadline.',
    deadlineApproachingMessage: 'Deadline approaching.',
    deadlinePassedMessage: 'Deadline passed.',
    publishTargetMissedMessage: 'Publish target missed.',
    noPublicationCutoffMessage: 'Cutoff reached.',
    revisionInstructionMessage: 'Resolve reviewer comments.',
    emptyPackageMessage: 'Create the package.',
    chartSequenceHelperMessage: 'Follow the chart sequence.',
    drawingPointerOffsetX: 18,
    drawingPointerOffsetY: -24,
    drawingSmoothingPercent: 75,
    drawingPostProcessEnabled: true,
    drawingPostProcessSmoothingPercent: 85,
    autosaveIntervalSeconds: 5,
    defaultMapView: 'Unused legacy value',
  });

  assert.equal(parsed.workspaceWelcomeTitle, 'Marine Operations');
  assert.equal(parsed.drawingPointerOffsetX, 18);
  assert.equal(parsed.drawingPointerOffsetY, -24);
  assert.equal(parsed.drawingSmoothingPercent, 75);
  assert.equal(parsed.drawingPostProcessEnabled, true);
  assert.equal(parsed.drawingPostProcessSmoothingPercent, 85);
  assert.equal(parsed.autosaveIntervalSeconds, undefined);
  assert.equal(parsed.defaultMapView, undefined);
});

test('general settings validate custom bounds and strip inactive public fields', () => {
  const parsed = parseGeneralSettingsPayload({
    logoPreview: '/pagasa-logo.png',
    showPublicStaffInfo: false,
    publicChartPdfNote: 'Operational note.',
    mapBoundsPreset: 'custom',
    mapBoundsCustomName: 'Test area',
    mapBoundsCustom: {
      westLng: 110,
      southLat: 5,
      eastLng: 130,
      northLat: 22,
    },
    selectedCustomMapBoundsId: '',
    savedCustomMapBounds: [],
    maintenanceMode: true,
    publicDashboardTitle: 'Legacy title',
  });

  assert.equal(parsed.showPublicStaffInfo, false);
  assert.equal(parsed.maintenanceMode, undefined);
  assert.equal(parsed.publicDashboardTitle, undefined);
  assert.equal(parsed.mapBoundsCustom.westLng, 110);
});

test('general settings reject inverted custom bounds', () => {
  assert.throws(
    () =>
      parseGeneralSettingsPayload({
        logoPreview: '/pagasa-logo.png',
        publicChartPdfNote: '',
        mapBoundsPreset: 'custom',
        mapBoundsCustom: {
          westLng: 140,
          southLat: 5,
          eastLng: 130,
          northLat: 22,
        },
        savedCustomMapBounds: [],
      }),
    /west longitude must be less than east longitude/
  );
});


test('general settings accept a WGS84 published domain boundary', () => {
  const parsed = parseGeneralSettingsPayload({
    logoPreview: '/pagasa-logo.png',
    showPublicStaffInfo: true,
    publicChartPdfNote: '',
    mapBoundsPreset: 'tcad',
    mapBoundsCustomName: '',
    mapBoundsCustom: {
      westLng: 93,
      southLat: 0,
      eastLng: 153,
      northLat: 25,
    },
    selectedCustomMapBoundsId: '',
    savedCustomMapBounds: [],
    publishedDomainBoundary: {
      enabled: true,
      name: 'Test domain',
      showLine: true,
      showFill: true,
      clipAnnotations: true,
      lineColor: '#112233',
      lineWidth: 2,
      lineOpacity: 0.8,
      fillColor: '#445566',
      fillOpacity: 0.1,
      geojson: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { ignored: 'metadata' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [116, 4],
                  [127, 4],
                  [127, 22],
                  [116, 22],
                  [116, 4],
                ],
              ],
            },
          },
        ],
      },
    },
  });

  assert.equal(parsed.publishedDomainBoundary.enabled, true);
  assert.equal(parsed.publishedDomainBoundary.clipAnnotations, true);
  assert.equal(parsed.publishedDomainBoundary.geojson.features.length, 1);
  assert.deepEqual(parsed.publishedDomainBoundary.geojson.features[0].properties, {});
});

test('general settings reject out-of-range published boundary coordinates', () => {
  assert.throws(
    () =>
      parseGeneralSettingsPayload({
        logoPreview: '/pagasa-logo.png',
        publicChartPdfNote: '',
        mapBoundsPreset: 'tcad',
        mapBoundsCustom: {
          westLng: 93,
          southLat: 0,
          eastLng: 153,
          northLat: 25,
        },
        savedCustomMapBounds: [],
        publishedDomainBoundary: {
          geojson: {
            type: 'Polygon',
            coordinates: [
              [
                [200, 4],
                [127, 4],
                [127, 22],
                [200, 4],
              ],
            ],
          },
        },
      }),
    /WGS84 longitude\/latitude/
  );
});


test('workspace drawing settings reject unsafe ranges', () => {
  const base = {
    workspaceWelcomeTitle: '',
    workspaceWelcomeDescription: '',
    collaborationPresenceMessage: '',
    qaChecklistReminder: '',
    deadlineReminderMessage: '',
    deadlineApproachingMessage: '',
    deadlinePassedMessage: '',
    publishTargetMissedMessage: '',
    noPublicationCutoffMessage: '',
    revisionInstructionMessage: '',
    emptyPackageMessage: '',
    chartSequenceHelperMessage: '',
  };

  assert.throws(
    () =>
      parseForecasterWorkspaceSettingsPayload({
        ...base,
        drawingPointerOffsetX: 250,
        drawingPointerOffsetY: 0,
        drawingSmoothingPercent: 50,
      }),
    /Drawing pointer X offset/
  );

  assert.throws(
    () =>
      parseForecasterWorkspaceSettingsPayload({
        ...base,
        drawingPointerOffsetX: 0,
        drawingPointerOffsetY: 0,
        drawingSmoothingPercent: 101,
      }),
    /Drawing smoothing/
  );

  assert.throws(
    () =>
      parseForecasterWorkspaceSettingsPayload({
        ...base,
        drawingPointerOffsetX: 0,
        drawingPointerOffsetY: 0,
        drawingSmoothingPercent: 50,
        drawingPostProcessEnabled: true,
        drawingPostProcessSmoothingPercent: 120,
      }),
    /Drawing post-process smoothing/
  );
});


test('operations settings reject unsupported naming placeholders', () => {
  assert.throws(
    () =>
      parseOperationsSettingsPayload({
        packageSubmissionDeadline: '10:00',
        packagePublishTarget: '12:00',
        noPublicationCutoff: '18:00',
        deadlineWarningMinutes: 60,
        timezone: 'Asia/Manila',
        packageNameTemplate: 'Marine Forecast {date} {unknown}',
      }),
    /unsupported placeholder/
  );

  assert.throws(
    () =>
      parseOperationsSettingsPayload({
        packageSubmissionDeadline: '10:00',
        packagePublishTarget: '12:00',
        noPublicationCutoff: '18:00',
        deadlineWarningMinutes: 60,
        timezone: 'Asia/Manila',
        forecast24ChartNameTemplate: '{package} - {lead}',
      }),
    /unsupported placeholder/
  );
});
