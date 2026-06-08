import mongoose from 'mongoose';

import { PROJECT_STATUS } from '../../constants/projectWorkflowConstants.js';

import Project from '../../models/Project.js';
import Feature from '../../models/Feature.js';
import Chart from '../../models/Chart.js';

import { throwError } from '../../utils/errorHelper.js';

import { ChartService } from './chartService.js';

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

  static assertOwnership(
    project,
    ownerId
  ) {
    if (
      String(project.owner) !==
      String(ownerId)
    ) {
      throwError(
        'Unauthorized.',
        403
      );
    }
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

                  auditLogs: [{
                    action: 'created',
                    performedBy: ownerId,
                    previousStatus: null,
                    newStatus: PROJECT_STATUS.DRAFT,
                    comment: 'Project created',
                  }],
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
            createdProject.name,
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

          this.assertOwnership(
            project,
            ownerId
          );

          const oldName =
            project.name;

          project.name =
            newName.trim();

          project.auditLogs.push({
            action:
              'renamed',

            performedBy:
              ownerId,

            previousStatus:
              project.status,

            newStatus:
              project.status,

            comment:
              `Renamed from "${oldName}" to "${newName}"`,
          });

          await ChartService.renameProjectCharts(
            projectId,
            newName,
            session
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

          this.assertOwnership(
            project,
            ownerId
          );

          const oldName =
            project.name;

          if (
            payload.name &&
            payload.name.trim() !==
            project.name
          ) {
            project.name =
              payload.name.trim();

            await ChartService.renameProjectCharts(
              projectId,
              payload.name,
              session
            );

            project.auditLogs.push({
              action:
                'renamed',

              performedBy:
                ownerId,

              previousStatus:
                project.status,

              newStatus:
                project.status,

              comment:
                `Renamed from "${oldName}" to "${payload.name}"`,
            });
          }

          if (
            payload.description !==
            undefined
          ) {
            project.description =
              payload.description.trim();
          }

          if (
            payload.forecastDate
          ) {
            project.forecastDate =
              payload.forecastDate;
          }

          project.auditLogs.push({
            action:
              'edited',

            performedBy:
              ownerId,

            previousStatus:
              project.status,

            newStatus:
              project.status,

            comment:
              'Project edited',
          });

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

          this.assertOwnership(
            project,
            ownerId
          );

          const featureResult =
            await Feature.deleteMany(
              {
                project:
                  projectId,

                owner:
                  ownerId,
              },
              {
                session,
              }
            );

          const chartResult =
            await Chart.deleteMany(
              {
                project:
                  projectId,
              },
              {
                session,
              }
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