import {
  REVIEW_CHECKLIST_ITEM_STATUS,
} from '../models/ForecastPackageReviewChecklist.js';

const KEY_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

function createValidationError(message, details = []) {
  const error = new Error(message);
  error.statusCode = 400;
  error.details = details;
  return error;
}

export function normalizeChecklistItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw createValidationError('At least one review checklist item is required.');
  }

  const normalized = items.map((item, index) => {
    const key = String(item?.key || '')
      .trim()
      .toLowerCase();
    const label = String(item?.label || '').trim();
    const description = String(item?.description || '').trim();

    if (!key || !KEY_PATTERN.test(key)) {
      throw createValidationError(
        'Checklist item keys must use lowercase letters, numbers, and underscores only.',
        [{ index, field: 'key' }]
      );
    }

    if (!label) {
      throw createValidationError('Checklist item label is required.', [
        { index, field: 'label' },
      ]);
    }

    if (label.length > 200) {
      throw createValidationError('Checklist item label must be 200 characters or less.', [
        { index, field: 'label' },
      ]);
    }

    if (description.length > 1000) {
      throw createValidationError(
        'Checklist item description must be 1000 characters or less.',
        [{ index, field: 'description' }]
      );
    }

    return {
      key,
      label,
      description,
      isRequired: item?.isRequired !== false,
      allowNotApplicable: Boolean(item?.allowNotApplicable),
      sortOrder: Number.isFinite(Number(item?.sortOrder))
        ? Math.max(0, Number(item.sortOrder))
        : index * 10,
      isActive: item?.isActive !== false,
    };
  });

  const active = normalized.filter((item) => item.isActive);
  if (active.length === 0) {
    throw createValidationError('At least one active review checklist item is required.');
  }

  const keys = new Set();
  for (const item of active) {
    if (keys.has(item.key)) {
      throw createValidationError(`Duplicate checklist item key: ${item.key}`);
    }
    keys.add(item.key);
  }

  return normalized;
}

export function buildChecklistSnapshotItems(definitionItems = []) {
  return definitionItems
    .filter((item) => item?.isActive !== false)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => ({
      definitionItemId: item._id,
      itemKey: item.key,
      labelSnapshot: item.label,
      descriptionSnapshot: item.description || '',
      requiredSnapshot: item.isRequired !== false,
      allowNotApplicableSnapshot: Boolean(item.allowNotApplicable),
      sortOrderSnapshot: item.sortOrder,
      status: REVIEW_CHECKLIST_ITEM_STATUS.PENDING,
      comment: '',
      reviewedBy: null,
      reviewedAt: null,
      version: 1,
    }));
}

export function isChecklistItemSatisfied(item) {
  if (item?.status === REVIEW_CHECKLIST_ITEM_STATUS.PASS) return true;

  return (
    item?.status === REVIEW_CHECKLIST_ITEM_STATUS.NOT_APPLICABLE &&
    item?.allowNotApplicableSnapshot === true
  );
}

export function getReviewChecklistProgress(items = []) {
  const normalized = Array.isArray(items) ? items : [];
  const requiredItems = normalized.filter((item) => item?.requiredSnapshot === true);

  const requiredCompleted = requiredItems.filter(isChecklistItemSatisfied).length;
  const needsAttention = normalized.filter(
    (item) => item?.status === REVIEW_CHECKLIST_ITEM_STATUS.NEEDS_ATTENTION
  ).length;
  const pending = normalized.filter(
    (item) => item?.status === REVIEW_CHECKLIST_ITEM_STATUS.PENDING
  ).length;

  return {
    total: normalized.length,
    required: requiredItems.length,
    requiredCompleted,
    optional: normalized.length - requiredItems.length,
    needsAttention,
    pending,
    isComplete:
      requiredCompleted === requiredItems.length &&
      needsAttention === 0 &&
      pending === 0,
    canApprove:
      requiredCompleted === requiredItems.length &&
      needsAttention === 0,
  };
}

export function validateChecklistItemUpdate(item, nextStatus, comment = '') {
  if (!Object.values(REVIEW_CHECKLIST_ITEM_STATUS).includes(nextStatus)) {
    throw createValidationError('Invalid review checklist item status.');
  }

  if (
    nextStatus === REVIEW_CHECKLIST_ITEM_STATUS.NOT_APPLICABLE &&
    item?.allowNotApplicableSnapshot !== true
  ) {
    throw createValidationError('This checklist item cannot be marked N/A.');
  }

  const normalizedComment = String(comment || '').trim();
  if (normalizedComment.length > 2000) {
    throw createValidationError('Checklist item comment must be 2000 characters or less.');
  }

  if (
    nextStatus === REVIEW_CHECKLIST_ITEM_STATUS.NEEDS_ATTENTION &&
    !normalizedComment
  ) {
    throw createValidationError('A comment is required when an item needs attention.');
  }

  return normalizedComment;
}
