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
     EXECUTE TRANSACTIONAL ACTION
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
        try {
          await task();
        } catch (error) {
          console.error(
            '[ProjectWorkflowService afterCommit]',
            error
          );
        }
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
    const project =
      await Project.findById(projectId);

    if (!project) {
      throwError(
        'Project not found',
        404
      );
    }

    if (
      project.status ===
      PROJECT_STATUS.UNDER_REVIEW
    ) {
      return project._id;
    }

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

    await project.save();

    return project._id;
  }

  /* =====================================================
     ADD COMMENT
  ===================================================== */

  static async addComment(
    projectId,
    reviewerId,
    comment = ''
  ) {
    const project =
      await Project.findById(projectId);

    if (!project) {
      throwError(
        'Project not found',
        404
      );
    }

    ProjectWorkflowPolicy.addComment(
      project,
      reviewerId,
      comment
    );

    await project.save();

    try {
      await ProjectNotificationService.notifyOwner(
        project,
        reviewerId,
        'comment_added',
        comment
      );
    } catch (error) {
      console.error(
        '[ProjectWorkflowService comment notification]',
        error
      );
    }

    return project._id;
  }

  /* =====================================================
     REQUEST REVISION
  ===================================================== */

  static async requestRevision(
    projectId,
    reviewerId,
    comment = ''
  ) {
    if (!comment?.trim()) {
      throwError(
        'Revision comment is required',
        400
      );
    }

    const project =
      await Project.findById(projectId);

    if (!project) {
      throwError(
        'Project not found',
        404
      );
    }

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

    await project.save();

    try {
      await ProjectNotificationService.notifyOwner(
        project,
        reviewerId,
        'revision_requested',
        comment
      );
    } catch (error) {
      console.error(
        '[ProjectWorkflowService revision notification]',
        error
      );
    }

    return project._id;
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
        if (
          String(project.owner) ===
          String(reviewerId)
        ) {
          throwError(
            'You cannot approve your own project',
            400
          );
        }

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
    if (!comment?.trim()) {
      throwError(
        'Rejection comment is required',
        400
      );
    }

    const project =
      await Project.findById(projectId);

    if (!project) {
      throwError(
        'Project not found',
        404
      );
    }

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

    await project.save();

    try {
      await ProjectNotificationService.notifyOwner(
        project,
        reviewerId,
        'rejected',
        comment
      );
    } catch (error) {
      console.error(
        '[ProjectWorkflowService reject notification]',
        error
      );
    }

    return project._id;
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
    const project =
      await Project.findById(projectId);

    if (!project) {
      throwError(
        'Project not found',
        404
      );
    }

    ProjectWorkflowPolicy.archive(
      project,
      actorId
    );

    await project.save();

    return project._id;
  }
}
