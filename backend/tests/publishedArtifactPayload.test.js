import test from 'node:test';
import assert from 'node:assert/strict';

import {
  decodePublishedSnapshotDataUrl,
  MAX_PUBLISHED_SNAPSHOT_BYTES,
} from '../utils/publishedArtifactPayload.js';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test('decodePublishedSnapshotDataUrl accepts a valid PNG data URL', () => {
  const payload = Buffer.concat([PNG_SIGNATURE, Buffer.from([0x00, 0x01, 0x02])]);
  const dataUrl = `data:image/png;base64,${payload.toString('base64')}`;

  const decoded = decodePublishedSnapshotDataUrl(dataUrl);

  assert.deepEqual(decoded, payload);
});

test('decodePublishedSnapshotDataUrl rejects non-PNG data URLs', () => {
  const dataUrl = `data:image/jpeg;base64,${PNG_SIGNATURE.toString('base64')}`;

  assert.throws(
    () => decodePublishedSnapshotDataUrl(dataUrl),
    /must be a PNG data URL/
  );
});

test('decodePublishedSnapshotDataUrl rejects invalid PNG signatures', () => {
  const payload = Buffer.from('not-a-png');
  const dataUrl = `data:image/png;base64,${payload.toString('base64')}`;

  assert.throws(
    () => decodePublishedSnapshotDataUrl(dataUrl),
    /not a valid PNG image/
  );
});

test('decodePublishedSnapshotDataUrl rejects snapshots above the decoded size limit', () => {
  const payload = Buffer.alloc(MAX_PUBLISHED_SNAPSHOT_BYTES + 1);
  PNG_SIGNATURE.copy(payload, 0);
  const dataUrl = `data:image/png;base64,${payload.toString('base64')}`;

  assert.throws(
    () => decodePublishedSnapshotDataUrl(dataUrl),
    /exceeds the 3 MB size limit/
  );
});
