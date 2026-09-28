import { describe, expect, it } from 'vitest';

import {
  buildReviewChecklistPayload,
  createNextChecklistDraftItem,
  definitionToDraft,
  normalizeChecklistKey,
  validateReviewChecklistDraft,
} from './reviewChecklistDraft';

describe('review checklist settings draft helpers', () => {
  it('normalizes stable keys to the backend key contract', () => {
    expect(normalizeChecklistKey(' Wave Field / Consistency ')).toBe('wave_field_consistency');
    expect(normalizeChecklistKey('Forecast---Cycle')).toBe('forecast_cycle');
  });

  it('maps the active definition into an ordered editable draft without mutating evidence fields', () => {
    const draft = definitionToDraft({
      name: 'Operational Review',
      version: 3,
      items: [
        {
          key: 'second',
          label: 'Second',
          description: '',
          isRequired: false,
          allowNotApplicable: true,
          isActive: true,
          sortOrder: 20,
        },
        {
          key: 'first',
          label: 'First',
          description: 'Verify first.',
          isRequired: true,
          allowNotApplicable: false,
          isActive: true,
          sortOrder: 10,
        },
      ],
    });

    expect(draft.version).toBe(3);
    expect(draft.items.map((item) => item.key)).toEqual(['first', 'second']);
    expect(draft.items[0].sortOrder).toBe(0);
    expect(draft.items[1].sortOrder).toBe(10);
  });

  it('builds a clean version payload with order derived from the current UI order', () => {
    const payload = buildReviewChecklistPayload({
      name: '  Forecast Review  ',
      items: [
        {
          key: ' Wave Height ',
          label: '  Wave height verified ',
          description: '  Compare fields. ',
          isRequired: true,
          allowNotApplicable: false,
          isActive: true,
        },
        {
          key: 'publication_notes',
          label: 'Publication notes',
          description: '',
          isRequired: false,
          allowNotApplicable: true,
          isActive: true,
        },
      ],
    });

    expect(payload).toEqual({
      name: 'Forecast Review',
      items: [
        {
          key: 'wave_height',
          label: 'Wave height verified',
          description: 'Compare fields.',
          isRequired: true,
          allowNotApplicable: false,
          isActive: true,
          sortOrder: 0,
        },
        {
          key: 'publication_notes',
          label: 'Publication notes',
          description: '',
          isRequired: false,
          allowNotApplicable: true,
          isActive: true,
          sortOrder: 10,
        },
      ],
    });
  });

  it('rejects duplicate active keys but ignores duplicate keys on disabled historical entries', () => {
    const duplicate = {
      name: 'Review',
      items: [
        { key: 'cycle', label: 'Cycle', isActive: true },
        { key: 'cycle', label: 'Cycle again', isActive: true },
      ],
    };

    expect(validateReviewChecklistDraft(duplicate)).toContain('duplicated');

    duplicate.items[1].isActive = false;
    expect(validateReviewChecklistDraft(duplicate)).toBeNull();
  });

  it('creates a new default key that does not collide after reordering or deletion', () => {
    const item = createNextChecklistDraftItem([
      { key: 'review_item_1' },
      { key: 'review_item_3' },
    ]);

    expect(item.key).toBe('review_item_2');
  });
});
