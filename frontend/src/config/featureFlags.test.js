import { describe, expect, it } from 'vitest';

import { isChatbotEnabled } from './featureFlags';

describe('chatbot feature flag', () => {
  it('is disabled unless explicitly enabled', () => {
    expect(isChatbotEnabled('')).toBe(false);
    expect(isChatbotEnabled('false')).toBe(false);
    expect(isChatbotEnabled('TRUE')).toBe(false);
    expect(isChatbotEnabled('true')).toBe(true);
  });
});
