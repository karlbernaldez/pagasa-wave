import assert from 'node:assert/strict';
import test from 'node:test';

import { loadArchivePolicy, normalizeArchivePolicy } from '../services/archivePolicyService.js';

test('archive policy defaults are non-destructive and disabled', () => {
  const policy = normalizeArchivePolicy({});

  assert.equal(policy.autoArchivePublishedEnabled, false);
  assert.equal(policy.autoArchiveNoPublicationEnabled, false);
  assert.equal(policy.autoArchiveAbandonedDraftsEnabled, false);
  assert.equal(policy.retainArchivedRecordsIndefinitely, true);
  assert.equal(policy.preserveReviewEvidence, true);
});

test('archive policy normalizes configured archive ages', () => {
  const policy = normalizeArchivePolicy({
    autoArchivePublishedEnabled: true,
    archivePublishedAfterDays: 45,
    autoArchiveNoPublicationEnabled: true,
    archiveNoPublicationAfterDays: 60,
    autoArchiveAbandonedDraftsEnabled: true,
    archiveDraftsAfterDays: 90,
    retainArchivedRecordsIndefinitely: false,
    preserveReviewEvidence: false,
  });

  assert.equal(policy.autoArchivePublishedEnabled, true);
  assert.equal(policy.archivePublishedAfterDays, 45);
  assert.equal(policy.archiveNoPublicationAfterDays, 60);
  assert.equal(policy.archiveDraftsAfterDays, 90);
  assert.equal(policy.retainArchivedRecordsIndefinitely, true);
  assert.equal(policy.preserveReviewEvidence, true);
});

test('loadArchivePolicy reads operations settings and keeps purge disabled', async () => {
  const settingsModel = {
    findOne() {
      return {
        lean: async () => ({
          data: {
            autoArchivePublishedEnabled: true,
            archivePublishedAfterDays: 14,
          },
        }),
      };
    },
  };

  const policy = await loadArchivePolicy({ settingsModel });

  assert.equal(policy.autoArchivePublishedEnabled, true);
  assert.equal(policy.archivePublishedAfterDays, 14);
  assert.equal(policy.retainArchivedRecordsIndefinitely, true);
  assert.equal(policy.preserveReviewEvidence, true);
});
