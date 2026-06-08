import { ChartDTO } from './chartDto.js';

export class ProjectDTO {
  static toResponse(
    project,
    charts = []
  ) {
    return {
      id: project._id,

      name: project.name,

      description:
        project.description,

      forecastDate:
        project.forecastDate,

      status:
        project.status,

      version:
        project.version,

      reviewComment:
        project.reviewComment,

      submittedAt:
        project.submittedAt,

      reviewStartedAt:
        project.reviewStartedAt,

      reviewedAt:
        project.reviewedAt,

      publishedAt:
        project.publishedAt,

      openCount:
        project.openCount,

      owner:
        project.owner,

      createdAt:
        project.createdAt,

      updatedAt:
        project.updatedAt,

      charts:
        ChartDTO.toResponseList(
          charts
        ),
    };
  }
}