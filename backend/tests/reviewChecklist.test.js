import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REVIEW_CHECKLIST_ITEM_STATUS,
} from '../models/ForecastPackageReviewChecklist.js';
import {
  buildChecklistSnapshotItems,
  getReviewChecklistProgress,
  normalizeChecklistItems,
  validateChecklistItemUpdate,
} from '../utils/reviewChecklist.js';
import {
  assertReviewChecklistAllowsApproval,
  updatePackageReviewChecklistItem,
} from '../services/reviewChecklistService.js';

test('normalizeChecklistItems rejects duplicate active keys', () => {
  assert.throws(
    () =>
      normalizeChecklistItems([
        { key: 'wave_consistency', label: 'Wave consistency' },
        { key: 'wave_consistency', label: 'Duplicate' },
      ]),
    /Duplicate checklist item key/
  );
});

test('buildChecklistSnapshotItems freezes definition fields into the review instance', () => {
  const items = buildChecklistSnapshotItems([
    {
      _id: 'definition-item-1',
      key: 'forecast_cycle',
      label: 'Forecast cycle verified',
      description: 'Check operational cycle.',
      isRequired: true,
      allowNotApplicable: false,
      sortOrder: 20,
      isActive: true,
    },
  ]);

  assert.equal(items.length, 1);
  assert.equal(items[0].itemKey, 'forecast_cycle');
  assert.equal(items[0].labelSnapshot, 'Forecast cycle verified');
  assert.equal(items[0].requiredSnapshot, true);
  assert.equal(items[0].status, REVIEW_CHECKLIST_ITEM_STATUS.PENDING);
  assert.equal(items[0].version, 1);
});

test('required N/A only satisfies approval when the item explicitly allows N/A', () => {
  const denied = getReviewChecklistProgress([
    {
      requiredSnapshot: true,
      allowNotApplicableSnapshot: false,
      status: REVIEW_CHECKLIST_ITEM_STATUS.NOT_APPLICABLE,
    },
  ]);
  assert.equal(denied.canApprove, false);

  const allowed = getReviewChecklistProgress([
    {
      requiredSnapshot: true,
      allowNotApplicableSnapshot: true,
      status: REVIEW_CHECKLIST_ITEM_STATUS.NOT_APPLICABLE,
    },
  ]);
  assert.equal(allowed.canApprove, true);
});

test('Needs Attention blocks approval even when it is an optional item', () => {
  const progress = getReviewChecklistProgress([
    {
      requiredSnapshot: true,
      allowNotApplicableSnapshot: false,
      status: REVIEW_CHECKLIST_ITEM_STATUS.PASS,
    },
    {
      requiredSnapshot: false,
      allowNotApplicableSnapshot: false,
      status: REVIEW_CHECKLIST_ITEM_STATUS.NEEDS_ATTENTION,
    },
  ]);

  assert.equal(progress.requiredCompleted, 1);
  assert.equal(progress.canApprove, false);
});

test('Needs Attention requires a reviewer comment', () => {
  assert.throws(
    () =>
      validateChecklistItemUpdate(
        { allowNotApplicableSnapshot: false },
        REVIEW_CHECKLIST_ITEM_STATUS.NEEDS_ATTENTION,
        ''
      ),
    /comment is required/
  );
});

test('approval guard returns incomplete checklist evidence', async () => {
  const fakeModel = {
    findOne() {
      return {
        lean: async () => ({
          _id: 'checklist-1',
          items: [
            {
              _id: 'item-1',
              itemKey: 'wave_consistency',
              labelSnapshot: 'Wave consistency checked',
              requiredSnapshot: true,
              allowNotApplicableSnapshot: false,
              status: REVIEW_CHECKLIST_ITEM_STATUS.PENDING,
            },
          ],
        }),
      };
    },
  };

  await assert.rejects(
    () =>
      assertReviewChecklistAllowsApproval('package-1', {
        checklistModel: fakeModel,
      }),
    (error) => {
      assert.equal(error.status, 409);
      assert.equal(error.code, 'REVIEW_CHECKLIST_INCOMPLETE');
      assert.equal(error.details.incompleteItems.length, 1);
      return true;
    }
  );
});

test('approval guard allows a package when all required evidence passes', async () => {
  const fakeModel = {
    findOne() {
      return {
        lean: async () => ({
          _id: 'checklist-1',
          items: [
            {
              _id: 'item-1',
              itemKey: 'wave_consistency',
              labelSnapshot: 'Wave consistency checked',
              requiredSnapshot: true,
              allowNotApplicableSnapshot: false,
              status: REVIEW_CHECKLIST_ITEM_STATUS.PASS,
            },
          ],
        }),
      };
    },
  };

  const result = await assertReviewChecklistAllowsApproval('package-1', {
    checklistModel: fakeModel,
  });

  assert.equal(result.progress.canApprove, true);
});

test('item update rejects stale client versions before writing', async () => {
  const fakeItem = {
    _id: 'item-1',
    itemKey: 'forecast_cycle',
    status: REVIEW_CHECKLIST_ITEM_STATUS.PENDING,
    version: 3,
    allowNotApplicableSnapshot: false,
  };

  const fakeChecklist = {
    _id: 'checklist-1',
    items: {
      id() {
        return fakeItem;
      },
    },
  };

  const fakeModel = {
    findOne: async () => fakeChecklist,
  };

  await assert.rejects(
    () =>
      updatePackageReviewChecklistItem(
        {
          forecastPackageId: 'package-1',
          itemId: 'item-1',
          status: REVIEW_CHECKLIST_ITEM_STATUS.PASS,
          comment: '',
          expectedVersion: 2,
          userId: 'reviewer-1',
        },
        { checklistModel: fakeModel }
      ),
    (error) => {
      assert.equal(error.status, 409);
      assert.equal(error.code, 'REVIEW_CHECKLIST_ITEM_STALE');
      return true;
    }
  );
});
