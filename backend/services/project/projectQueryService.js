import Project from '../../models/Project.js';

import { ChartService } from './chartService.js';
import { ProjectQueryBuilder } from './projectQueryBuilder.js';

import { ProjectDTO } from '../../dto/projectDto.js';
import { ProjectSummaryDTO } from '../../dto/projectSummaryDto.js';

export class ProjectQueryService {
  static async getUserProjects(
    ownerId,
    params = {}
  ) {
    const built =
      ProjectQueryBuilder.build(
        ownerId,
        params
      );

    const [
      projects,
      total,
      statusCounts,
    ] =
      await Promise.all([
        Project.find(built.query)
          .sort(built.sort)
          .skip(built.skip)
          .limit(built.limit)
          .lean(),

        Project.countDocuments(built.query),

        Project.aggregate([
          { $match: built.query },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    const chartMap =
      await ChartService.getChartsByProjects(
        projects.map(p => p._id)
      );

    return {
      projects:
        ProjectSummaryDTO.toResponseList(
          projects,
          chartMap
        ),

      total,
      page: built.page,
      limit: built.limit,

      totalPages: Math.max(
        1,
        Math.ceil(total / built.limit)
      ),

      statusCounts,
    };
  }

  static async getLatestProject(
    ownerId
  ) {
    const project =
      await Project.findOne({ owner: ownerId })
        .sort({ updatedAt: -1 })
        .populate(
          'owner',
          'firstName lastName email position'
        )
        .lean();

    if (!project) return null;

    const charts =
      await ChartService.getChartsByProject(
        project._id
      );

    return ProjectDTO.toResponse(project, charts);
  }

  static async getProjectWithCharts(
    projectId
  ) {
    const project =
      await Project.findById(projectId)
        .populate(
          'owner',
          'firstName lastName email position'
        )
        .lean();

    if (!project) return null;

    const charts =
      await ChartService.getChartsByProject(
        projectId
      );

    return ProjectDTO.toResponse(project, charts);
  }

  static async trackOpen(
    projectId,
    userId
  ) {
    await Project.findByIdAndUpdate(
      projectId,
      {
        $set: {
          lastOpenedAt: new Date(),
          lastOpenedBy: userId,
        },
        $inc: {
          openCount: 1,
        },
      }
    );
  }
}