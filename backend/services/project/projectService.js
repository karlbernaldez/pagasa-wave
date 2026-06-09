import mongoose from 'mongoose';

import { PROJECT_STATUS } from '../../constants/projectWorkflowConstants.js';

import Project from '../../models/Project.js';
import Feature from '../../models/Feature.js';

import { throwError } from '../../utils/errorHelper.js';

import { ChartService } from './chartService.js';
import { ProjectPermissionService } from './projectPermissionService.js';
import { ProjectAuthorization } from './projectAuthorization.js';
import { ProjectAuditService } from './projectAuditService.js';

export class ProjectService {
  /* =====================================================
     HELPERS
  ===================================================== */

  static async getProject(
    projectId,
    session = null
  ) {
    let query =
      Project.findById(projectId);

    if (session) {
      query =
        query.session(session);
    }

    const project =
      await query;

    if (!project) {
      throwError(
        'Project not found.',
        404
      );
    }

    return project;
  }

  /* =====================================================
     CREATE PROJECT
  ===================================================== */

  static async createProject({
    name,
    description = '',
    forecastDate,
    ownerId,
  }) {
    const session =
      await mongoose.startSession();

    try {
      let createdProject;

      await session.withTransaction(
        async () => {
          const project =
            await Project.create(
              [
                {
                  name:
                    name.trim(),

                  description:
                    description.trim(),

                  forecastDate,

                  owner:
                    ownerId,

                  status: PROJECT_STATUS.DRAFT,

                  version: 1,

                  auditLogs: [
                    ProjectAuditService.projectCreated(ownerId)
                  ],
                },
              ],
              {
                session,
              }
            );

          createdProject =
            project[0];

          await ChartService.createDefaultCharts(
            createdProject._id,
            ownerId,
            session
          );
        }
      );

      return createdProject;
    } finally {
      await session.endSession();
    }
  }

  /* =====================================================
     RENAME PROJECT
  ===================================================== */

  static async renameProject(
    projectId,
    ownerId,
    newName
  ) {
    const session =
      await mongoose.startSession();

    try {
      let project;

      await session.withTransaction(
        async () => {
          project =
            await this.getProject(
              projectId,
              session
            );

          ProjectAuthorization.require(
            ProjectPermissionService.canEdit(
              project,
              ownerId
            ),
            'You do not have permission to modify this project'
          );

          const trimmedName =
            newName?.trim();

          if (!trimmedName) {
            throwError(
              'Project name is required.',
              400
            );
          }

          // Nothing changed
          if (
            trimmedName ===
            project.name
          ) {
            return;
          }

          const oldName =
            project.name;

          project.name =
            trimmedName;

          ProjectAuditService.projectRenamed(
            project,
            ownerId,
            oldName,
            trimmedName
          );

          await project.save({
            session,
          });
        }
      );

      return project;
    } finally {
      await session.endSession();
    }
  }

  /* =====================================================
     UPDATE PROJECT
  ===================================================== */

  static async updateProject(
    projectId,
    ownerId,
    payload
  ) {
    const session =
      await mongoose.startSession();

    try {
      let project;

      await session.withTransaction(
        async () => {
          project =
            await this.getProject(
              projectId,
              session
            );

          ProjectAuthorization.require(
            ProjectPermissionService.canEdit(
              project,
              ownerId
            ),
            'You do not have permission to modify this project'
          );

          let hasChanges = false;

          /* ============================================
             NAME
          ============================================ */

          if (
            payload.name !== undefined
          ) {
            const trimmedName =
              payload.name.trim();

            if (!trimmedName) {
              throwError(
                'Project name is required.',
                400
              );
            }

            if (
              trimmedName !==
              project.name
            ) {
              const oldName =
                project.name;

              project.name =
                trimmedName;

              ProjectAuditService.projectRenamed(
                project,
                ownerId,
                oldName,
                trimmedName
              );

              hasChanges = true;
            }
          }

          /* ============================================
             DESCRIPTION
          ============================================ */

          if (
            payload.description !==
            undefined
          ) {
            const trimmedDescription =
              payload.description.trim();

            if (
              trimmedDescription !==
              project.description
            ) {
              project.description =
                trimmedDescription;

              hasChanges = true;
            }
          }

          /* ============================================
             FORECAST DATE
          ============================================ */

          if (
            payload.forecastDate &&
            String(
              payload.forecastDate
            ) !==
            String(
              project.forecastDate
            )
          ) {
            project.forecastDate =
              payload.forecastDate;

            hasChanges = true;
          }

          /* ============================================
             NO CHANGES
          ============================================ */

          if (!hasChanges) {
            return;
          }

          /* ============================================
             AUDIT
          ============================================ */

          ProjectAuditService.projectEdited(
            project,
            ownerId
          );

          await project.save({
            session,
          });
        }
      );

      return project;
    } finally {
      await session.endSession();
    }
  }

  /* =====================================================
     DELETE PROJECT
  ===================================================== */

  static async deleteProject(
    projectId,
    ownerId
  ) {
    const session =
      await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(
        async () => {
          const project =
            await this.getProject(
              projectId,
              session
            );

          ProjectAuthorization.require(
            ProjectPermissionService.canDelete(
              project,
              ownerId
            ),
            'Only the project owner can delete a project'
          );

          const featureResult =
            await Feature.deleteMany(
              {
                project: projectId,
              },
              {
                session,
              }
            );

          const chartResult =
            await ChartService.deleteProjectCharts(
              projectId,
              session
            );

          const projectResult =
            await Project.deleteOne(
              {
                _id:
                  projectId,
              },
              {
                session,
              }
            );

          result = {
            deletedProject:
              projectResult.deletedCount,

            deletedCharts:
              chartResult.deletedCount,

            deletedFeatures:
              featureResult.deletedCount,
          };
        }
      );

      return result;
    } finally {
      await session.endSession();
    }
  }
}