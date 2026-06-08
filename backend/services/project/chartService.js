import Chart from '../../models/Chart.js';
import { throwError } from '../../utils/errorHelper.js';

const DEFAULT_CHARTS = [
  {
    chartType: 'analysis',
    label: 'Analysis',
  },
  {
    chartType: 'forecast_24h',
    label: 'Forecast 24H',
  },
  {
    chartType: 'forecast_36h',
    label: 'Forecast 36H',
  },
  {
    chartType: 'forecast_48h',
    label: 'Forecast 48H',
  },
];

const buildChartName = (projectName, label) =>
  `${projectName} - ${label}`;

export class ChartService {
  /**
   * Create default charts for a project
   */
  static async createDefaultCharts(
    projectId,
    ownerId,
    projectName,
    session = null
  ) {
    const charts = DEFAULT_CHARTS.map(
      ({ chartType, label }) => ({
        owner: ownerId,
        project: projectId,
        chartType,
        name: buildChartName(
          projectName,
          label
        ),
      })
    );

    return Chart.insertMany(
      charts,
      {
        session,
      }
    );
  }

  /**
   * Get all charts belonging to a project
   */
  static async getChartsByProject(
    projectId,
    options = {}
  ) {
    const {
      lean = true,
      sort = {
        createdAt: 1,
      },
    } = options;

    let query =
      Chart.find({
        project: projectId,
      }).sort(sort);

    if (lean) {
      query = query.lean();
    }

    return query;
  }

  /**
   * Get charts for many projects
   * Used for paginated project listing
   */
  static async getChartsByProjects(
    projectIds
  ) {
    const charts =
      await Chart.find({
        project: {
          $in: projectIds,
        },
      }).lean();

    const map = new Map();

    for (const chart of charts) {
      const key =
        chart.project.toString();

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key).push(chart);
    }

    return map;
  }

  /**
   * Get chart by id
   */
  static async getChartById(
    chartId
  ) {
    const chart =
      await Chart.findById(
        chartId
      );

    if (!chart) {
      throwError(
        'Chart not found',
        404
      );
    }

    return chart;
  }

  /**
   * Get chart by project and type
   */
  static async getChartByType(
    projectId,
    chartType
  ) {
    return Chart.findOne({
      project: projectId,
      chartType,
    });
  }

  /**
   * Rename all charts when project name changes
   */
  static async renameProjectCharts(
    projectId,
    projectName,
    session = null
  ) {
    const charts =
      await Chart.find({
        project: projectId,
      }).session(session);

    if (
      !charts ||
      charts.length === 0
    ) {
      return [];
    }

    const operations =
      charts.map(chart => {
        const config =
          DEFAULT_CHARTS.find(
            c =>
              c.chartType ===
              chart.chartType
          );

        const label =
          config?.label ??
          chart.chartType;

        return {
          updateOne: {
            filter: {
              _id: chart._id,
            },
            update: {
              $set: {
                name: buildChartName(
                  projectName,
                  label
                ),
              },
            },
          },
        };
      });

    await Chart.bulkWrite(
      operations,
      {
        session,
      }
    );

    return Chart.find({
      project: projectId,
    }).session(session);
  }

  /**
   * Delete all charts belonging to a project
   */
  static async deleteProjectCharts(
    projectId,
    session = null
  ) {
    return Chart.deleteMany(
      {
        project: projectId,
      },
      {
        session,
      }
    );
  }

  /**
   * Verify project owns expected chart set
   * Useful for migration validation
   */
  static async validateProjectCharts(
    projectId
  ) {
    const charts =
      await Chart.find({
        project: projectId,
      })
        .select(
          'chartType'
        )
        .lean();

    const existing =
      new Set(
        charts.map(
          c => c.chartType
        )
      );

    const missing =
      DEFAULT_CHARTS.filter(
        c =>
          !existing.has(
            c.chartType
          )
      );

    return {
      valid:
        missing.length === 0,
      missing,
    };
  }

  /**
   * Ensure project contains all default charts
   * Useful after migrations
   */
  static async ensureDefaultCharts(
    projectId,
    ownerId,
    projectName,
    session = null
  ) {
    const validation =
      await this.validateProjectCharts(
        projectId
      );

    if (
      validation.valid
    ) {
      return;
    }

    const missingCharts =
      validation.missing.map(
        ({
          chartType,
          label,
        }) => ({
          owner: ownerId,
          project: projectId,
          chartType,
          name: buildChartName(
            projectName,
            label
          ),
        })
      );

    await Chart.insertMany(
      missingCharts,
      {
        session,
      }
    );
  }
}