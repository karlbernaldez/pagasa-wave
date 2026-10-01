const MAX_PUBLISHED_SNAPSHOT_BYTES = 3 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function decodePublishedSnapshotDataUrl(value) {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=\r\n]+)$/.exec(String(value || ''));
  if (!match) {
    throw new Error('Published chart snapshot must be a PNG data URL.');
  }

  const buffer = Buffer.from(match[1], 'base64');
  if (!buffer.length || buffer.length > MAX_PUBLISHED_SNAPSHOT_BYTES) {
    throw new Error('Published chart snapshot exceeds the 3 MB size limit.');
  }

  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error('Published chart snapshot is not a valid PNG image.');
  }

  return buffer;
}

export { MAX_PUBLISHED_SNAPSHOT_BYTES };
