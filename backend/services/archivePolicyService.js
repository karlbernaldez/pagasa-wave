import mongoose from 'mongoose';

import ForecastPackage from '../models/ForecastPackage.js';
import Project from '../models/Project.js';
import SiteSettings from '../models/SiteSettings.js';
import { FORECAST_PACKAGE_STATUS } from '../utils/forecastPackage.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(now, days) {
  return new Date(now.getTime() - Number(days) * DAY_MS);
}

function getPolicy(data = {}) {
  return {
    autoArchivePublishedEnabled: data.autoArchivePublishedEnabled === true,
    archivePublishedAfterDays: Number(data.archivePublishedAfterDays || 30),
    autoArchiveNoPublicationEnabled: data.autoArchiveNoPublicationEnabled === true,
    archiveNoPublicationAfterDays: Number(data.archiveNoPublicationAfterDays || 30),
    autoArchiveAbandonedDraftsEnabled: data.autoArchiveAbandonedDraftsEnabled === true,
    archiveDraftsAfterDays: Number(data.archiveDraftsAfterDays || 30),
    retainArchivedRecordsIndefinitely: true,
    preserveReviewEvidence: true,
  };
}

export async function loadArchivePolicy({ settingsModel = SiteSettings } = {}) {
  const settings = await settingsModel.findOne({ page: 'operations' }).lean();
  return getPolicy(settings?.data || {});
}

async function findEligibleDraftPackages({ cutoff, forecastPackageModel, projectModel }) {
  const candidates = await forecastPackageModel
    .find({
      status: FORECAST_PACKAGE_STATUS.DRAFT,
      updatedAt: { $lte: cutoff },
      'charts.activeEditors.0': { $exists: false },
    })
    .select('_id name forecastDate status updatedAt charts')
    .lean();

  const eligible = [];
  for (const forecastPackage of candidates) {
    const projectIds = (forecastPackage.charts || [])
      .map((chart) => chart?.project)
      .filter(Boolean);

    const projects = await projectModel
      .find({ _id: { $in: projectIds } })
      .select('_id status')
      .lean();

    if (
      projects.length === projectIds.length &&
      projects.every((project) => project.status === PROJECT_STATUS.DRAFT)
    ) {
      eligible.push(forecastPackage);
    }
  }

  return eligible;
}

function summarize(rows, basisField) {
  return rows.map((row) => ({
    id: String(row._id),
    name: row.name || '',
    forecastDate: row.forecastDate || null,
    status: row.status,
    eligibleSince: row[basisField] || null,
  }));
}

export async function previewArchivePolicy({
  now = new Date(),
  settingsModel = SiteSettings,
  forecastPackageModel = ForecastPackage,
  projectModel = Project,
} = {}) {
  const policy = await loadArchivePolicy({ settingsModel });

  const publishedCutoff = daysAgo(now, policy.archivePublishedAfterDays);
  const noPublicationCutoff = daysAgo(now, policy.archiveNoPublicationAfterDays);
  const draftCutoff = daysAgo(now, policy.archiveDraftsAfterDays);

  const [publishedPackages, noPublicationProjects, draftPackages] = await Promise.all([
    policy.autoArchivePublishedEnabled
      ? forecastPackageModel
          .find({
            status: FORECAST_PACKAGE_STATUS.PUBLISHED,
            publishedAt: { $lte: publishedCutoff },
          })
          .select('_id name forecastDate status publishedAt')
          .lean()
      : [],
    policy.autoArchiveNoPublicationEnabled
      ? projectModel
          .find({
            status: PROJECT_STATUS.NO_PUBLICATION,
            noPublicationAt: { $lte: noPublicationCutoff },
          })
          .select('_id name forecastDate status noPublicationAt forecastPackage')
          .lean()
      : [],
    policy.autoArchiveAbandonedDraftsEnabled
      ? findEligibleDraftPackages({
          cutoff: draftCutoff,
          forecastPackageModel,
          projectModel,
        })
      : [],
  ]);

  return {
    policy,
    generatedAt: now,
    candidates: {
      publishedPackages: summarize(publishedPackages, 'publishedAt'),
      noPublicationProjects: summarize(noPublicationProjects, 'noPublicationAt'),
      draftPackages: summarize(draftPackages, 'updatedAt'),
    },
    totals: {
      publishedPackages: publishedPackages.length,
      noPublicationProjects: noPublicationProjects.length,
      draftPackages: draftPackages.length,
      total:
        publishedPackages.length + noPublicationProjects.length + draftPackages.length,
    },
  };
}

function archiveAudit(actorUserId, previousStatus, comment) {
  return {
    action: 'archived',
    performedBy: actorUserId,
    previousStatus,
    newStatus: PROJECT_STATUS.ARCHIVED,
    comment,
    timestamp: new Date(),
  };
}

async function archivePublishedPackage({
  forecastPackageId,
  actorUserId,
  cutoff,
  forecastPackageModel,
  projectModel,
  session,
}) {
  const forecastPackage = await forecastPackageModel.findOne({
    _id: forecastPackageId,
    status: FORECAST_PACKAGE_STATUS.PUBLISHED,
    publishedAt: { $lte: cutoff },
  }).session(session);

  if (!forecastPackage) return false;

  const archivedAt = new Date();
  await projectModel.updateMany(
    {
      forecastPackage: forecastPackage._id,
      status: PROJECT_STATUS.PUBLISHED,
    },
    {
      $set: {
        status: PROJECT_STATUS.ARCHIVED,
        archivedAt,
        archivedBy: actorUserId,
      },
      $push: {
        auditLogs: archiveAudit(
          actorUserId,
          PROJECT_STATUS.PUBLISHED,
          'Archived automatically by the configured published-package archive policy.'
        ),
      },
    },
    { session }
  );

  forecastPackage.status = FORECAST_PACKAGE_STATUS.ARCHIVED;
  forecastPackage.archivedAt = archivedAt;
  forecastPackage.archivedBy = actorUserId;
  forecastPackage.auditLogs.push({
    action: 'archived',
    performedBy: actorUserId,
    previousStatus: FORECAST_PACKAGE_STATUS.PUBLISHED,
    newStatus: FORECAST_PACKAGE_STATUS.ARCHIVED,
    comment: 'Archived automatically by the configured published-package archive policy.',
    timestamp: archivedAt,
  });
  await forecastPackage.save({ session });
  return true;
}

async function archiveDraftPackage({
  forecastPackageId,
  actorUserId,
  cutoff,
  forecastPackageModel,
  projectModel,
  session,
}) {
  const forecastPackage = await forecastPackageModel.findOne({
    _id: forecastPackageId,
    status: FORECAST_PACKAGE_STATUS.DRAFT,
    updatedAt: { $lte: cutoff },
    'charts.activeEditors.0': { $exists: false },
  }).session(session);

  if (!forecastPackage) return false;

  const projectIds = (forecastPackage.charts || []).map((chart) => chart?.project).filter(Boolean);
  const nonDraftCount = await projectModel.countDocuments({
    _id: { $in: projectIds },
    status: { $ne: PROJECT_STATUS.DRAFT },
  }).session(session);

  if (nonDraftCount > 0) return false;

  const archivedAt = new Date();
  await projectModel.updateMany(
    { _id: { $in: projectIds }, status: PROJECT_STATUS.DRAFT },
    {
      $set: {
        status: PROJECT_STATUS.ARCHIVED,
        archivedAt,
        archivedBy: actorUserId,
      },
      $push: {
        auditLogs: archiveAudit(
          actorUserId,
          PROJECT_STATUS.DRAFT,
          'Archived as an abandoned draft by the configured archive policy.'
        ),
      },
    },
    { session }
  );

  forecastPackage.status = FORECAST_PACKAGE_STATUS.ARCHIVED;
  forecastPackage.archivedAt = archivedAt;
  forecastPackage.archivedBy = actorUserId;
  forecastPackage.auditLogs.push({
    action: 'archived',
    performedBy: actorUserId,
    previousStatus: FORECAST_PACKAGE_STATUS.DRAFT,
    newStatus: FORECAST_PACKAGE_STATUS.ARCHIVED,
    comment: 'Archived as an abandoned draft by the configured archive policy.',
    timestamp: archivedAt,
  });
  await forecastPackage.save({ session });
  return true;
}

export async function executeArchivePolicy({
  actorUserId,
  now = new Date(),
  settingsModel = SiteSettings,
  forecastPackageModel = ForecastPackage,
  projectModel = Project,
} = {}) {
  if (!actorUserId) throw new Error('Archive policy execution requires an authorized actor.');

  const preview = await previewArchivePolicy({
    now,
    settingsModel,
    forecastPackageModel,
    projectModel,
  });

  const session = await mongoose.startSession();
  const result = {
    publishedPackagesArchived: 0,
    noPublicationProjectsArchived: 0,
    draftPackagesArchived: 0,
  };

  try {
    await session.withTransaction(async () => {
      const publishedCutoff = daysAgo(now, preview.policy.archivePublishedAfterDays);
      const noPublicationCutoff = daysAgo(now, preview.policy.archiveNoPublicationAfterDays);
      const draftCutoff = daysAgo(now, preview.policy.archiveDraftsAfterDays);

      for (const candidate of preview.candidates.publishedPackages) {
        if (
          await archivePublishedPackage({
            forecastPackageId: candidate.id,
            actorUserId,
            cutoff: publishedCutoff,
            forecastPackageModel,
            projectModel,
            session,
          })
        ) {
          result.publishedPackagesArchived += 1;
        }
      }

      if (preview.policy.autoArchiveNoPublicationEnabled) {
        const projects = await projectModel
          .find({
            status: PROJECT_STATUS.NO_PUBLICATION,
            noPublicationAt: { $lte: noPublicationCutoff },
          })
          .session(session);

        for (const project of projects) {
          const previousStatus = project.status;
          project.status = PROJECT_STATUS.ARCHIVED;
          project.archivedAt = new Date();
          project.archivedBy = actorUserId;
          project.auditLogs.push(
            archiveAudit(
              actorUserId,
              previousStatus,
              'Archived automatically by the configured no-publication archive policy.'
            )
          );
          await project.save({ session });
          result.noPublicationProjectsArchived += 1;
        }
      }

      for (const candidate of preview.candidates.draftPackages) {
        if (
          await archiveDraftPackage({
            forecastPackageId: candidate.id,
            actorUserId,
            cutoff: draftCutoff,
            forecastPackageModel,
            projectModel,
            session,
          })
        ) {
          result.draftPackagesArchived += 1;
        }
      }
    });

    return {
      ...result,
      totalArchived:
        result.publishedPackagesArchived +
        result.noPublicationProjectsArchived +
        result.draftPackagesArchived,
      executedAt: now,
      retentionPurgePerformed: false,
      reviewEvidencePreserved: true,
    };
  } finally {
    await session.endSession();
  }
}
