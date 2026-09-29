import ReviewChecklistDefinition from '../models/ReviewChecklistDefinition.js';
import ForecastPackageReviewChecklist, {
  REVIEW_CHECKLIST_INSTANCE_STATUS,
  REVIEW_CHECKLIST_ITEM_STATUS,
} from '../models/ForecastPackageReviewChecklist.js';
import {
  buildChecklistSnapshotItems,
  getReviewChecklistProgress,
  normalizeChecklistItems,
  validateChecklistItemUpdate,
} from '../utils/reviewChecklist.js';

function serviceError(message, status = 400, code = null, details = null) {
  const error = new Error(message);
  error.status = status;
  error.statusCode = status;
  if (code) error.code = code;
  if (details) error.details = details;
  return error;
}

export async function getActiveReviewChecklistDefinition() {
  return ReviewChecklistDefinition.findOne({ isActive: true }).lean();
}

export async function createReviewChecklistDefinitionVersion(
  { name, items },
  userId,
  { definitionModel = ReviewChecklistDefinition } = {}
) {
  const cleanName = String(name || '').trim();
  if (!cleanName) throw serviceError('Checklist name is required.', 400);
  if (!userId) throw serviceError('Authenticated user is required.', 401);

  const normalizedItems = normalizeChecklistItems(items);

  const latest = await definitionModel.findOne({}).sort({ version: -1 }).lean();
  const nextVersion = Number(latest?.version || 0) + 1;

  const session = await definitionModel.startSession();
  try {
    let created;

    await session.withTransaction(async () => {
      await definitionModel.updateMany(
        { isActive: true },
        { $set: { isActive: false } },
        { session }
      );

      const docs = await definitionModel.create(
        [
          {
            name: cleanName,
            version: nextVersion,
            isActive: true,
            items: normalizedItems,
            createdBy: userId,
          },
        ],
        { session }
      );

      [created] = docs;
    });

    return created;
  } finally {
    await session.endSession();
  }
}

export async function createPackageReviewChecklist(
  forecastPackageId,
  userId,
  {
    definitionModel = ReviewChecklistDefinition,
    checklistModel = ForecastPackageReviewChecklist,
  } = {}
) {
  if (!forecastPackageId) throw serviceError('Forecast Package id is required.', 400);
  if (!userId) throw serviceError('Authenticated user is required.', 401);

  const existing = await checklistModel
    .findOne({
      forecastPackage: forecastPackageId,
      status: REVIEW_CHECKLIST_INSTANCE_STATUS.ACTIVE,
    })
    .lean();

  if (existing) return existing;

  const definition = await definitionModel.findOne({ isActive: true }).lean();
  if (!definition) {
    throw serviceError(
      'No active review checklist definition is configured.',
      409,
      'REVIEW_CHECKLIST_NOT_CONFIGURED'
    );
  }

  const latestAttempt = await checklistModel
    .findOne({ forecastPackage: forecastPackageId })
    .sort({ reviewAttempt: -1 })
    .lean();

  const reviewAttempt = Number(latestAttempt?.reviewAttempt || 0) + 1;
  const snapshotItems = buildChecklistSnapshotItems(definition.items || []);

  if (snapshotItems.length === 0) {
    throw serviceError(
      'The active review checklist has no active items.',
      409,
      'REVIEW_CHECKLIST_EMPTY'
    );
  }

  const checklist = await checklistModel.create({
    forecastPackage: forecastPackageId,
    definition: definition._id,
    definitionVersion: definition.version,
    definitionNameSnapshot: definition.name,
    reviewAttempt,
    status: REVIEW_CHECKLIST_INSTANCE_STATUS.ACTIVE,
    items: snapshotItems,
    createdBy: userId,
    events: [
      {
        action: 'created',
        performedBy: userId,
        comment: `Review checklist v${definition.version} instantiated for attempt ${reviewAttempt}`,
      },
    ],
  });

  return checklist;
}

export async function getPackageReviewChecklist(
  forecastPackageId,
  { checklistModel = ForecastPackageReviewChecklist } = {}
) {
  const checklist = await checklistModel
    .findOne({
      forecastPackage: forecastPackageId,
      status: REVIEW_CHECKLIST_INSTANCE_STATUS.ACTIVE,
    })
    .populate('items.reviewedBy', 'firstName lastName username email')
    .populate('createdBy', 'firstName lastName username email')
    .lean();

  if (!checklist) return null;

  return {
    ...checklist,
    progress: getReviewChecklistProgress(checklist.items || []),
  };
}

export async function updatePackageReviewChecklistItem(
  { forecastPackageId, itemId, status, comment, expectedVersion, userId },
  { checklistModel = ForecastPackageReviewChecklist } = {}
) {
  if (!forecastPackageId || !itemId) {
    throw serviceError('Forecast Package id and checklist item id are required.', 400);
  }
  if (!userId) throw serviceError('Authenticated user is required.', 401);

  const version = Number(expectedVersion);
  if (!Number.isInteger(version) || version < 1) {
    throw serviceError('A valid checklist item version is required.', 400);
  }

  const checklist = await checklistModel.findOne({
    forecastPackage: forecastPackageId,
    status: REVIEW_CHECKLIST_INSTANCE_STATUS.ACTIVE,
  });

  if (!checklist) {
    throw serviceError('Active review checklist not found.', 404);
  }

  const item = checklist.items.id(itemId);
  if (!item) throw serviceError('Review checklist item not found.', 404);

  if (item.version !== version) {
    throw serviceError(
      'This checklist item was changed by another reviewer. Reload the latest review state.',
      409,
      'REVIEW_CHECKLIST_ITEM_STALE'
    );
  }

  const normalizedComment = validateChecklistItemUpdate(item, status, comment);
  const previousStatus = item.status;
  const reviewedAt = new Date();

  const updated = await checklistModel.findOneAndUpdate(
    {
      _id: checklist._id,
      status: REVIEW_CHECKLIST_INSTANCE_STATUS.ACTIVE,
      items: {
        $elemMatch: {
          _id: item._id,
          version,
        },
      },
    },
    {
      $set: {
        'items.$.status': status,
        'items.$.comment': normalizedComment,
        'items.$.reviewedBy': userId,
        'items.$.reviewedAt': reviewedAt,
      },
      $inc: {
        'items.$.version': 1,
      },
      $push: {
        events: {
          itemId: item._id,
          itemKey: item.itemKey,
          action: 'item_updated',
          previousStatus,
          newStatus: status,
          comment: normalizedComment,
          performedBy: userId,
          timestamp: reviewedAt,
        },
      },
    },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw serviceError(
      'This checklist item was changed by another reviewer. Reload the latest review state.',
      409,
      'REVIEW_CHECKLIST_ITEM_STALE'
    );
  }

  return {
    checklist: updated,
    progress: getReviewChecklistProgress(updated.items || []),
  };
}

export async function assertReviewChecklistAllowsApproval(
  forecastPackageId,
  { checklistModel = ForecastPackageReviewChecklist } = {}
) {
  const checklist = await checklistModel
    .findOne({
      forecastPackage: forecastPackageId,
      status: REVIEW_CHECKLIST_INSTANCE_STATUS.ACTIVE,
    })
    .lean();

  if (!checklist) {
    throw serviceError(
      'A review checklist must be completed before this Forecast Package can be approved.',
      409,
      'REVIEW_CHECKLIST_REQUIRED'
    );
  }

  const progress = getReviewChecklistProgress(checklist.items || []);

  if (!progress.canApprove) {
    const incompleteItems = (checklist.items || [])
      .filter((item) => {
        if (item.status === REVIEW_CHECKLIST_ITEM_STATUS.NEEDS_ATTENTION) return true;
        if (!item.requiredSnapshot) return false;
        if (item.status === REVIEW_CHECKLIST_ITEM_STATUS.PASS) return false;
        if (
          item.status === REVIEW_CHECKLIST_ITEM_STATUS.NOT_APPLICABLE &&
          item.allowNotApplicableSnapshot
        ) {
          return false;
        }
        return true;
      })
      .map((item) => ({
        id: item._id,
        key: item.itemKey,
        label: item.labelSnapshot,
        status: item.status,
      }));

    throw serviceError(
      'All required review checklist items must pass before approval.',
      409,
      'REVIEW_CHECKLIST_INCOMPLETE',
      { incompleteItems }
    );
  }

  return { checklist, progress };
}

export async function supersedePackageReviewChecklist(
  forecastPackageId,
  userId,
  { checklistModel = ForecastPackageReviewChecklist, session = null } = {}
) {
  let query = checklistModel.findOne({
    forecastPackage: forecastPackageId,
    status: REVIEW_CHECKLIST_INSTANCE_STATUS.ACTIVE,
  });
  if (session && typeof query.session === 'function') query = query.session(session);

  const checklist = await query;
  if (!checklist) return null;

  checklist.status = REVIEW_CHECKLIST_INSTANCE_STATUS.SUPERSEDED;
  checklist.events.push({
    action: 'superseded',
    performedBy: userId,
    comment: 'Checklist superseded after the Forecast Package entered revision.',
  });

  await checklist.save(session ? { session } : undefined);
  return checklist;
}
