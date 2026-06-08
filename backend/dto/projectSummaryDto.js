export class ProjectSummaryDTO {
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

      updatedAt:
        project.updatedAt,

      createdAt:
        project.createdAt,

      chartCount:
        charts.length,
    };
  }

  static toResponseList(
    projects = [],
    chartMap = new Map()
  ) {
    return projects.map(project =>
      this.toResponse(
        project,
        chartMap.get(
          project._id.toString()
        ) || []
      )
    );
  }
}