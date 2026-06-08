import mongoose from 'mongoose';

import Project from '../../models/Project.js';

import { throwError } from '../../utils/errorHelper.js';

import ProjectWorkflowPolicy from './projectWorkflowPolicy.js';
import { ProjectVersionService } from './projectVersionService.js';
import { ProjectNotificationService } from './projectNotificationService.js';

import { PROJECT_STATUS }
  from '../../constants/projectWorkflowConstants.js';

import { VERSION_REASONS }
  from '../../constants/projectVersionConstants.js';

export class ProjectWorkflowService {
  /* =====================================================
     LOAD PROJECT
  ===================================================== */

  static async getProject(
    projectId,
    session
  ) {
    const project =
      await Project.findById(
        projectId
      ).session(session);

    if (!project) {
      throwError(
        'Project not found',
        404
      );
    }

    return project;
  }

  /* =====================================================
     EXECUTE WORKFLOW ACTION
  ===================================================== */

  static async execute(
    projectId,
    actorId,
    handler
  ) {
    const session =
      await mongoose.startSession();

    const afterCommit = [];

    try {
      session.startTransaction();

      const project =
        await this.getProject(
          projectId,
          session
        );

      await handler(
        project,
        session,
        afterCommit
      );

      await project.save({
        session,
      });

      await session.commitTransaction();

      for (const task of afterCommit) {
        await task();
      }

      return project._id;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /* =====================================================
     SUBMIT
  ===================================================== */

  static async submit(
    projectId,
    actorId
  ) {
    return this.execute(
      projectId,
      actorId,
      async (
        project,
        session,
        afterCommit
      ) => {
        const reason =
          project.status ===
          PROJECT_STATUS.REVISION_REQUESTED
            ? VERSION_REASONS.REVISION
            : VERSION_REASONS.SUBMIT;

        await ProjectVersionService.createSnapshot(
          project._id,
          actorId,
          reason,
          session
        );

        ProjectWorkflowPolicy.submit(
          project,
          actorId,
          {
            submittedAt:
              new Date(),
          }
        );

        afterCommit.push(
          () =>
            ProjectNotificationService.notifyOwner(
              project,
              actorId,
              'submitted'
            )
        );
      }
    );
  }

  /* =====================================================
     START REVIEW
  ===================================================== */

  static async startReview(
    projectId,
    reviewerId
  ) {
    return this.execute(
      projectId,
      reviewerId,
      async project => {
        ProjectWorkflowPolicy.startReview(
          project,
          reviewerId,
          {
            reviewStartedBy:
              reviewerId,

            reviewStartedAt:
              new Date(),
          }
        );
      }
    );
  }

  /* =====================================================
     REQUEST REVISION
  ===================================================== */

  static async requestRevision(
    projectId,
    reviewerId,
    comment = ''
  ) {
    return this.execute(
      projectId,
      reviewerId,
      async (
        project,
        session,
        afterCommit
      ) => {
        ProjectWorkflowPolicy.requestRevision(
          project,
          reviewerId,
          comment,
          {
            reviewComment:
              comment,

            reviewedAt:
              new Date(),
          }
        );

        afterCommit.push(
          () =>
            ProjectNotificationService.notifyOwner(
              project,
              reviewerId,
              'revision_requested',
              comment
            )
        );
      }
    );
  }

  /* =====================================================
     APPROVE
  ===================================================== */

  static async approve(
    projectId,
    reviewerId
  ) {
    return this.execute(
      projectId,
      reviewerId,
      async (
        project,
        session,
        afterCommit
      ) => {
        await ProjectVersionService.createSnapshot(
          project._id,
          reviewerId,
          VERSION_REASONS.APPROVAL,
          session
        );

        ProjectWorkflowPolicy.approve(
          project,
          reviewerId,
          {
            approvedBy:
              reviewerId,

            reviewedAt:
              new Date(),
          }
        );

        afterCommit.push(
          () =>
            ProjectNotificationService.notifyOwner(
              project,
              reviewerId,
              'approved'
            )
        );
      }
    );
  }

  /* =====================================================
     REJECT
  ===================================================== */

  static async reject(
    projectId,
    reviewerId,
    comment = ''
  ) {
    return this.execute(
      projectId,
      reviewerId,
      async (
        project,
        session,
        afterCommit
      ) => {
        ProjectWorkflowPolicy.reject(
          project,
          reviewerId,
          comment,
          {
            rejectedBy:
              reviewerId,

            reviewComment:
              comment,

            reviewedAt:
              new Date(),
          }
        );

        afterCommit.push(
          () =>
            ProjectNotificationService.notifyOwner(
              project,
              reviewerId,
              'rejected',
              comment
            )
        );
      }
    );
  }

  /* =====================================================
     PUBLISH
  ===================================================== */

  static async publish(
    projectId,
    actorId
  ) {
    return this.execute(
      projectId,
      actorId,
      async (
        project,
        session,
        afterCommit
      ) => {
        await ProjectVersionService.createSnapshot(
          project._id,
          actorId,
          VERSION_REASONS.PUBLISH,
          session
        );

        ProjectWorkflowPolicy.publish(
          project,
          actorId,
          {
            publishedAt:
              new Date(),
          }
        );

        afterCommit.push(
          () =>
            ProjectNotificationService.notifyOwner(
              project,
              actorId,
              'published'
            )
        );
      }
    );
  }

  /* =====================================================
     ARCHIVE
  ===================================================== */

  static async archive(
    projectId,
    actorId
  ) {
    return this.execute(
      projectId,
      actorId,
      async project => {
        ProjectWorkflowPolicy.archive(
          project,
          actorId
        );
      }
    );
  }
}