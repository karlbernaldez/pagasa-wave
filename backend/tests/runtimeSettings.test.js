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
      archivePublishedAfterDays: 14,
    }),
    {
      packageSubmissionDeadline: '10:00',
      packagePublishTarget: '12:00',
      noPublicationCutoff: '18:00',
      deadlineWarningMinutes: 60,
      timezone: 'Asia/Manila',
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
    autosaveIntervalSeconds: 5,
    defaultMapView: 'Unused legacy value',
  });

  assert.equal(parsed.workspaceWelcomeTitle, 'Marine Operations');
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
