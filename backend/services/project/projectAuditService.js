import { PROJECT_STATUS } from '../../constants/projectWorkflowConstants.js';

export class ProjectAuditService {

  static log(
    project,
    {
      action,
      performedBy,
      previousStatus = null,
      newStatus = null,
      comment = '',
    }
  ) {
    if (!project) {
      return;
    }

    if (
      !Array.isArray(
        project.auditLogs
      )
    ) {
      project.auditLogs = [];
    }

    project.auditLogs.push({
      action,
      performedBy,
      previousStatus,
      newStatus,
      comment,
    });
  }

  static statusChange(
    project,
    {
      action,
      performedBy,
      previousStatus,
      newStatus,
      comment = '',
    }
  ) {
    this.log(
      project,
      {
        action,
        performedBy,
        previousStatus,
        newStatus,
        comment,
      }
    );
  }

  static collaboratorAdded(
    project,
    actorId,
    collaboratorEmail
  ) {
    this.log(
      project,
      {
        action:
          'collaborator_added',

        performedBy:
          actorId,

        previousStatus:
          project.status,

        newStatus:
          project.status,

        comment:
          `Added collaborator ${collaboratorEmail}`,
      }
    );
  }

  static collaboratorRemoved(
    project,
    actorId,
    collaboratorEmail
  ) {
    this.log(
      project,
      {
        action:
          'collaborator_removed',

        performedBy:
          actorId,

        previousStatus:
          project.status,

        newStatus:
          project.status,

        comment:
          `Removed collaborator ${collaboratorEmail}`,
      }
    );
  }

  static projectCreated(ownerId) {
    return {
      action: 'created',
      performedBy: ownerId,
      previousStatus: null,
      newStatus: PROJECT_STATUS.DRAFT,
      comment: 'Project created',
    };
  }

  static commentAdded(
    project,
    actorId,
    comment
  ) {
    this.log(
      project,
      {
        action:
          'comment_added',

        performedBy:
          actorId,

        previousStatus:
          project.status,

        newStatus:
          project.status,

        comment,
      }
    );
  }

  static projectRenamed(
    project,
    actorId,
    oldName,
    newName
  ) {
    this.log(
      project,
      {
        action:
          'renamed',

        performedBy:
          actorId,

        previousStatus:
          project.status,

        newStatus:
          project.status,

        comment:
          `Renamed from "${oldName}" to "${newName}"`,
      }
    );
  }

  static projectEdited(
    project,
    actorId
  ) {
    this.log(
      project,
      {
        action: 'edited',

        performedBy:
          actorId,

        previousStatus:
          project.status,

        newStatus:
          project.status,

        comment:
          'Project edited',
      }
    );
  }


}