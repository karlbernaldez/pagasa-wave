import test from 'node:test';
import assert from 'node:assert/strict';

import { buildNewSourceIdAndUpdateData } from '../utils/dbHelpers.js';
import {
  PROJECT_STATUS,
  ALLOWED_PROJECT_TRANSITIONS,
  EDITABLE_PROJECT_STATUSES,
  canAddReviewCommentStatus,
  canEditProjectStatus,
  canTransitionProjectStatus,
  getProjectEditLockMessage,
} from '../utils/projectWorkflow.js';

const ALL_STATUSES = Object.values(PROJECT_STATUS);

test('project status transitions allow only the supported workflow path', () => {
  const allowedPairs = new Set(
    Object.entries(ALLOWED_PROJECT_TRANSITIONS).flatMap(([from, targets]) =>
      targets.map((to) => `${from}->${to}`)
    )
  );

  for (const from of ALL_STATUSES) {
    for (const to of ALL_STATUSES) {
      assert.equal(
        canTransitionProjectStatus(from, to),
        allowedPairs.has(`${from}->${to}`),
        `expected ${from} -> ${to} to match transition map`
      );
    }
  }
});

test('forecaster can submit Draft and Revision Requested projects only', () => {
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.DRAFT, PROJECT_STATUS.SUBMITTED), true);
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.REVISION_REQUESTED, PROJECT_STATUS.SUBMITTED), true);

  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.SUBMITTED, PROJECT_STATUS.SUBMITTED), false);
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.UNDER_REVIEW, PROJECT_STATUS.SUBMITTED), false);
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.APPROVED, PROJECT_STATUS.SUBMITTED), false);
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.PUBLISHED, PROJECT_STATUS.SUBMITTED), false);
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.ARCHIVED, PROJECT_STATUS.SUBMITTED), false);
});

test('admin review transitions are constrained to reviewable states', () => {
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.SUBMITTED, PROJECT_STATUS.UNDER_REVIEW), true);
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.UNDER_REVIEW, PROJECT_STATUS.REVISION_REQUESTED), true);
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.UNDER_REVIEW, PROJECT_STATUS.APPROVED), true);
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.UNDER_REVIEW, PROJECT_STATUS.REJECTED), true);
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.APPROVED, PROJECT_STATUS.PUBLISHED), true);
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.PUBLISHED, PROJECT_STATUS.ARCHIVED), true);

  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.DRAFT, PROJECT_STATUS.UNDER_REVIEW), false);
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.SUBMITTED, PROJECT_STATUS.APPROVED), false);
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.SUBMITTED, PROJECT_STATUS.REVISION_REQUESTED), false);
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.REVISION_REQUESTED, PROJECT_STATUS.APPROVED), false);
  assert.equal(canTransitionProjectStatus(PROJECT_STATUS.PUBLISHED, PROJECT_STATUS.APPROVED), false);
});

test('project edit lock allows only draft, rejected, and revision requested', () => {
  const editableStatuses = new Set(EDITABLE_PROJECT_STATUSES);

  for (const status of ALL_STATUSES) {
    assert.equal(
      canEditProjectStatus(status),
      editableStatuses.has(status),
      `expected editability for ${status} to match editable status list`
    );
  }

  assert.deepEqual(EDITABLE_PROJECT_STATUSES, [
    PROJECT_STATUS.DRAFT,
    PROJECT_STATUS.REJECTED,
    PROJECT_STATUS.REVISION_REQUESTED,
  ]);
});

test('submitted and reviewed project states are locked from feature edits', () => {
  const lockedStatuses = [
    PROJECT_STATUS.SUBMITTED,
    PROJECT_STATUS.UNDER_REVIEW,
    PROJECT_STATUS.APPROVED,
    PROJECT_STATUS.PUBLISHED,
    PROJECT_STATUS.ARCHIVED,
  ];

  for (const status of lockedStatuses) {
    assert.equal(canEditProjectStatus(status), false);
    assert.match(getProjectEditLockMessage(status), new RegExp(status));
    assert.match(getProjectEditLockMessage(status), /Editing is locked/);
  }
});

test('review comments can be added only while submitted or under review', () => {
  assert.equal(canAddReviewCommentStatus(PROJECT_STATUS.SUBMITTED), true);
  assert.equal(canAddReviewCommentStatus(PROJECT_STATUS.UNDER_REVIEW), true);

  assert.equal(canAddReviewCommentStatus(PROJECT_STATUS.DRAFT), false);
  assert.equal(canAddReviewCommentStatus(PROJECT_STATUS.REVISION_REQUESTED), false);
  assert.equal(canAddReviewCommentStatus(PROJECT_STATUS.APPROVED), false);
  assert.equal(canAddReviewCommentStatus(PROJECT_STATUS.PUBLISHED), false);
  assert.equal(canAddReviewCommentStatus(PROJECT_STATUS.REJECTED), false);
  assert.equal(canAddReviewCommentStatus(PROJECT_STATUS.ARCHIVED), false);
});

test('feature rename changes mutable sourceId but preserves stable annotation identity', () => {
  const feature = {
    sourceId: 'low_pressure_OLD',
    properties: {
      type: 'low_pressure',
      stableId: 'annotation-123',
      annotationId: 'annotation-123',
    },
  };

  const [newSourceId, updateData] = buildNewSourceIdAndUpdateData(feature, 'NEW');

  assert.equal(newSourceId, 'low_pressure_NEW');
  assert.equal(updateData.sourceId, 'low_pressure_NEW');
  assert.equal(updateData['properties.labelValue'], 'NEW');
  assert.equal(updateData['properties.title'], 'NEW');
  assert.equal(updateData['properties.name'], 'NEW');
  assert.equal(updateData['properties.stableId'], 'annotation-123');
  assert.equal(updateData['properties.annotationId'], 'annotation-123');
});

test('feature rename backfills stable annotation identity for legacy features', () => {
  const feature = {
    sourceId: 'legacy_line',
    properties: {},
  };

  const [newSourceId, updateData] = buildNewSourceIdAndUpdateData(feature, 'renamed_line');

  assert.equal(newSourceId, 'renamed_line');
  assert.equal(updateData.sourceId, 'renamed_line');
  assert.equal(updateData['properties.stableId'], 'legacy_line');
  assert.equal(updateData['properties.annotationId'], 'legacy_line');
});
