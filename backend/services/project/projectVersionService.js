import Project from '../../models/Project.js';
import Chart from '../../models/Chart.js';
import Feature from '../../models/Feature.js';
import ProjectVersion from '../../models/ProjectVersion.js';

import { throwError } from '../../utils/errorHelper.js';

const VERSION_POPULATE =
  'firstName lastName email';

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

    const chartMap = new Map(
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

      features: features.map(
        feature => {
          const chart =
            feature.chart
              ? chartMap.get(
                  feature.chart.toString()
                )
              : null;

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

  static async getNextVersionNumber(
    projectId,
    session = null
  ) {
    const latestVersion =
      await ProjectVersion.findOne({
        project: projectId,
      })
        .sort({
          versionNumber: -1,
        })
        .select(
          'versionNumber'
        )
        .session(session)
        .lean();

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
      )
        .select('_id version')
        .session(session);

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
      await this.getNextVersionNumber(
        projectId,
        session
      );

    await ProjectVersion.create(
      [
        {
          project: projectId,

          versionNumber:
            nextVersion,

          reason,

          featureCollection,

          createdBy:
            userId,
        },
      ],
      {
        session,
      }
    );

    project.version =
      nextVersion;

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
    return (
      (await ProjectVersion.findOne({
        project: projectId,
      })
        .populate(
          'createdBy',
          VERSION_POPULATE
        )
        .sort({
          versionNumber: -1,
        })
        .lean()) ?? null
    );
  }

  static async getSnapshot(
    projectId,
    versionNumber
  ) {
    const parsedVersion =
      Number(versionNumber);

    if (
      !Number.isInteger(
        parsedVersion
      ) ||
      parsedVersion < 1
    ) {
      throwError(
        'Invalid version number',
        400
      );
    }

    const snapshot =
      await ProjectVersion.findOne({
        project: projectId,

        versionNumber:
          parsedVersion,
      })
        .populate(
          'createdBy',
          VERSION_POPULATE
        )
        .lean();

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
    const projectExists =
      await Project.exists({
        _id: projectId,
      });

    if (!projectExists) {
      throwError(
        'Project not found',
        404
      );
    }

    return ProjectVersion.find({
      project: projectId,
    })
      .populate(
        'createdBy',
        VERSION_POPULATE
      )
      .sort({
        versionNumber: -1,
      })
      .lean();
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