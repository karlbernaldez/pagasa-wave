import Project from '../../models/Project.js';
import Chart from '../../models/Chart.js';
import Feature from '../../models/Feature.js';

import { throwError } from '../../utils/errorHelper.js';

export class ProjectVersionService {
  static async generateFeatureCollection(
    projectId,
    session = null
  ) {
    const project =
      await Project.findById(projectId)
        .select(
          '_id name forecastDate status'
        )
        .session(session);

    if (!project) {
      throwError(
        'Project not found',
        404
      );
    }

    const charts =
      await Chart.find({
        project: projectId,
      })
        .select(
          '_id chartType name'
        )
        .session(session)
        .lean();

    const chartMap =
      new Map(
        charts.map(chart => [
          chart._id.toString(),
          chart,
        ])
      );

    const features =
      await Feature.find({
        project: projectId,
      })
        .session(session)
        .lean();

    return {
      type: 'FeatureCollection',

      metadata: {
        projectId:
          project._id,

        projectName:
          project.name,

        forecastDate:
          project.forecastDate,

        status:
          project.status,

        generatedAt:
          new Date(),
      },

      features:
        features.map(
          feature => {
            const chart =
              chartMap.get(
                feature.chart?.toString()
              );

            const featureId =
              feature.stableId ||
              feature.annotationId ||
              feature.sourceId ||
              feature._id;

            return {
              type: 'Feature',

              id: featureId,

              geometry:
                feature.geometry,

              properties: {
                ...feature.properties,

                sourceId:
                  feature.sourceId,

                stableId:
                  feature.stableId,

                annotationId:
                  feature.annotationId,

                chartId:
                  feature.chart,

                chartType:
                  chart?.chartType ??
                  null,

                chartName:
                  chart?.name ??
                  null,
              },
            };
          }
        ),
    };
  }

  static getNextVersionNumber(
    project
  ) {
    const latestVersion =
      project.versions?.at(-1);

    return latestVersion
      ? latestVersion.versionNumber + 1
      : 1;
  }

  static async createSnapshot(
    projectId,
    userId,
    reason,
    session = null
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

    const featureCollection =
      await this.generateFeatureCollection(
        projectId,
        session
      );

    const nextVersion =
      this.getNextVersionNumber(
        project
      );

    project.version =
      nextVersion;

    project.versions.push({
      versionNumber:
        nextVersion,

      reason,

      featureCollection,

      createdBy:
        userId,
    });

    await project.save({
      session,
    });

    return {
      versionNumber:
        nextVersion,

      featureCollection,
    };
  }

  static async getLatestSnapshot(
    projectId
  ) {
    const project =
      await Project.findById(
        projectId
      )
        .select(
          'versions version'
        )
        .lean();

    if (!project) {
      throwError(
        'Project not found',
        404
      );
    }

    return (
      project.versions?.at(-1) ??
      null
    );
  }

  static async getSnapshot(
    projectId,
    versionNumber
  ) {
    const project =
      await Project.findById(
        projectId
      )
        .select(
          'versions'
        )
        .lean();

    if (!project) {
      throwError(
        'Project not found',
        404
      );
    }

    const snapshot =
      project.versions.find(
        version =>
          version.versionNumber ===
          Number(versionNumber)
      );

    if (!snapshot) {
      throwError(
        'Version not found',
        404
      );
    }

    return snapshot;
  }

  static async getVersionHistory(
    projectId
  ) {
    const project =
      await Project.findById(
        projectId
      )
        .populate(
          'versions.createdBy',
          'firstName lastName email'
        )
        .select(
          'versions version'
        )
        .lean();

    if (!project) {
      throwError(
        'Project not found',
        404
      );
    }

    return project.versions
      .slice()
      .sort(
        (a, b) =>
          b.versionNumber -
          a.versionNumber
      );
  }

  static async createManualSnapshot(
    projectId,
    userId,
    session = null
  ) {
    return this.createSnapshot(
      projectId,
      userId,
      'manual_snapshot',
      session
    );
  }
}