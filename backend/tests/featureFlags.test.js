import assert from 'node:assert/strict';
import test from 'node:test';

import { isChatbotEnabled } from '../config/featureFlags.js';

test('chatbot is disabled when the flag is absent or not exactly true', () => {
  assert.equal(isChatbotEnabled({}), false);
  assert.equal(isChatbotEnabled({ WAVELAB_CHAT_ENABLED: 'false' }), false);
  assert.equal(isChatbotEnabled({ WAVELAB_CHAT_ENABLED: 'TRUE' }), false);
});

test('chatbot is enabled only by an explicit true value', () => {
  assert.equal(isChatbotEnabled({ WAVELAB_CHAT_ENABLED: 'true' }), true);
});
