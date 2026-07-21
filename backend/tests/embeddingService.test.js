import assert from 'node:assert/strict';
import test from 'node:test';

import { cosineSimilarity, embedText } from '../chat/services/embeddingService.js';

test('empty embedding input does not initialize the model', async () => {
  assert.deepEqual(await embedText('   '), []);
});

test('cosine similarity handles matching and missing vectors', () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([], [1, 0]), 0);
  assert.equal(cosineSimilarity([0, 0], [1, 0]), 0);
});
