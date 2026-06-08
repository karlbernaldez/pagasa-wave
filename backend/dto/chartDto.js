export class ChartDTO {
  static toResponse(chart) {
    return {
      id: chart._id,

      name: chart.name,

      chartType:
        chart.chartType,

      project:
        chart.project,

      createdAt:
        chart.createdAt,

      updatedAt:
        chart.updatedAt,
    };
  }

  static toResponseList(
    charts = []
  ) {
    return charts.map(
      chart =>
        this.toResponse(
          chart
        )
    );
  }
}