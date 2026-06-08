import { createNotification }
  from '../notification/notificationService.js';

const PROJECT_NOTIFICATION_COPY =
  Object.freeze({
    comment_added: {
      title:
        'Admin commented on your project',

      message: (
        project,
        comment
      ) =>
        `Admin left a comment on "${project.name}": ${comment}`,
    },

    revision_requested: {
      title:
        'Revision requested',

      message: (
        project,
        comment
      ) =>
        `Admin requested revisions on "${project.name}": ${comment}`,
    },

    approved: {
      title:
        'Project approved',

      message:
        project =>
          `"${project.name}" has been approved.`,
    },

    rejected: {
      title:
        'Project rejected',

      message: (
        project,
        comment
      ) =>
        `"${project.name}" was rejected: ${comment}`,
    },

    published: {
      title:
        'Project published',

      message:
        project =>
          `"${project.name}" has been published.`,
    },

    submitted: {
      title:
        'Project submitted',

      message:
        project =>
          `"${project.name}" was submitted for review.`,
    },
  });

export class ProjectNotificationService {
  static getResourcePath(
    project,
    type
  ) {
    if (
      type ===
      'published'
    ) {
      return `/forecasts/${project._id}`;
    }

    return `/studio/${project._id}`;
  }

  static async notifyOwner(
    project,
    actorId,
    type,
    comment = ''
  ) {
    const copy =
      PROJECT_NOTIFICATION_COPY[
        type
      ];

    if (
      !copy ||
      !project?.owner
    ) {
      return;
    }

    try {
      await createNotification({
        type,

        title:
          copy.title,

        message:
          copy.message(
            project,
            comment
          ),

        recipientUser:
          project.owner,

        actorUser:
          actorId,

        resourceType:
          'project',

        resourceId:
          project._id,

        resourcePath:
          this.getResourcePath(
            project,
            type
          ),

        projectName:
          project.name,
      });
    } catch (error) {
      console.error(
        '[ProjectNotificationService]',
        error
      );
    }
  }
}