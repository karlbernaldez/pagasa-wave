import Chart from '../../models/Chart.js';
import { throwError } from '../../utils/errorHelper.js';
import {
  CHART_TYPES as DEFAULT_CHARTS,
} from '../../constants/chartConstants.js';

export class ChartService {
  /* =====================================================
     HELPERS
  ===================================================== */

  static getChartOrder() {
    return DEFAULT_CHARTS.map(
      ({ chartType }) => chartType
    );
  }

  static sortCharts(charts) {
    const order =
      this.getChartOrder();

    return charts.sort(
      (a, b) =>
        order.indexOf(
          a.chartType
        ) -
        order.indexOf(
          b.chartType
        )
    );
  }

  /* =====================================================
     CREATE
  ===================================================== */

  static async createDefaultCharts(
    projectId,
    ownerId,
    session = null
  ) {
    const charts =
      DEFAULT_CHARTS.map(
        ({ chartType }) => ({
          owner: ownerId,
          project: projectId,
          chartType,
        })
      );

    return Chart.insertMany(
      charts,
      {
        session,
        ordered: true,
      }
    );
  }

  static async ensureDefaultCharts(
    projectId,
    ownerId,
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
        }) => ({
          owner: ownerId,
          project: projectId,
          chartType,
        })
      );

    await Chart.insertMany(
      missingCharts,
      {
        session,
        ordered: true,
      }
    );
  }

  /* =====================================================
     READ
  ===================================================== */

  static async getChartById(
    chartId,
    options = {}
  ) {
    const {
      lean = false,
    } = options;

    let query =
      Chart.findById(
        chartId
      );

    if (lean) {
      query =
        query.lean();
    }

    const chart =
      await query;

    if (!chart) {
      throwError(
        'Chart not found',
        404
      );
    }

    return chart;
  }

  static async getChartByType(
    projectId,
    chartType,
    options = {}
  ) {
    const {
      lean = false,
    } = options;

    let query =
      Chart.findOne({
        project: projectId,
        chartType,
      });

    if (lean) {
      query =
        query.lean();
    }

    return query;
  }

  static async getChartsByProject(
    projectId,
    options = {}
  ) {
    const {
      lean = true,
    } = options;

    let query =
      Chart.find({
        project: projectId,
      });

    if (lean) {
      query =
        query.lean();
    }

    const charts =
      await query;

    return this.sortCharts(
      charts
    );
  }

  static async getChartsByProjects(
    projectIds
  ) {
    const charts =
      await Chart.find({
        project: {
          $in: projectIds,
        },
      }).lean();

    const map =
      new Map();

    for (const chart of charts) {
      const key =
        chart.project.toString();

      if (
        !map.has(key)
      ) {
        map.set(
          key,
          []
        );
      }

      map
        .get(key)
        .push(chart);
    }

    for (const value of map.values()) {
      this.sortCharts(
        value
      );
    }

    return map;
  }

  /* =====================================================
     VALIDATION
  ===================================================== */

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
          chart =>
            chart.chartType
        )
      );

    const missing =
      DEFAULT_CHARTS.filter(
        ({
          chartType,
        }) =>
          !existing.has(
            chartType
          )
      );

    return {
      valid:
        missing.length === 0,
      missing,
    };
  }

  /* =====================================================
     COMPLETION
  ===================================================== */

  static async markCompleted(
    chartId,
    session = null
  ) {
    const chart =
      await this.getChartById(
        chartId
      );

    chart.completed =
      true;

    chart.completedAt =
      new Date();

    await chart.save({
      session,
    });

    return chart;
  }

  static async markIncomplete(
    chartId,
    session = null
  ) {
    const chart =
      await this.getChartById(
        chartId
      );

    chart.completed =
      false;

    chart.completedAt =
      null;

    await chart.save({
      session,
    });

    return chart;
  }

  /* =====================================================
     PROGRESS
  ===================================================== */

  static async getProjectProgress(
    projectId
  ) {
    const charts =
      await Chart.find({
        project: projectId,
      })
        .select(
          'completed'
        )
        .lean();

    const total =
      charts.length;

    const completed =
      charts.filter(
        chart =>
          chart.completed
      ).length;

    return {
      total,
      completed,

      percentage:
        total === 0
          ? 0
          : Math.round(
              (
                completed /
                total
              ) *
                100
            ),
    };
  }

  static async getProjectSummary(
    projectId
  ) {
    const [
      charts,
      progress,
    ] = await Promise.all([
      this.getChartsByProject(
        projectId
      ),

      this.getProjectProgress(
        projectId
      ),
    ]);

    return {
      charts,
      progress,
    };
  }

  /* =====================================================
     DELETE
  ===================================================== */

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
}