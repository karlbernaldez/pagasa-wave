export class ProjectPermissionService {

  static isAdmin(user) {
    return user?.role === 'admin';
  }

  static canRead(project, user) {
    if (this.isAdmin(user)) {
      return true;
    }

    const userId =
      user._id || user.id;

    return this.canView(
      project,
      userId
    );
  }

  static canManageCollaborators(
    project,
    user
  ) {
    if (this.isAdmin(user)) {
      return true;
    }

    const userId =
      user._id || user.id;

    return this.isOwner(
      project,
      userId
    );
  }

  static resolveRole(
    project,
    user
  ) {
    if (!user) {
      return null;
    }

    if (this.isAdmin(user)) {
      return 'admin';
    }

    const userId =
      String(
        user._id || user.id
      );

    if (
      this.isOwner(
        project,
        userId
      )
    ) {
      return 'owner';
    }

    const collaborator =
      this.getCollaborator(
        project,
        userId
      );

    return collaborator?.role ?? null;
  }

  static isOwner(project, userId) {
    return (
      project.owner &&
      project.owner.toString() === userId.toString()
    );
  }

  static getCollaborator(
    project,
    userId
  ) {
    return (
      project.collaborators ?? []
    ).find(
      (c) =>
        c.user &&
        c.user.toString() ===
        userId.toString()
    );
  }

  static isCollaborator(project, userId) {
    return Boolean(
      this.getCollaborator(project, userId)
    );
  }

  static canView(project, userId) {
    if (this.isOwner(project, userId)) {
      return true;
    }

    return this.isCollaborator(project, userId);
  }

  static canEdit(project, userId) {
    if (this.isOwner(project, userId)) {
      return true;
    }

    const collaborator =
      this.getCollaborator(project, userId);

    return (
      collaborator &&
      collaborator.role === 'editor' &&
      !collaborator.pending
    );
  }

  static canSubmit(project, userId) {
    return this.canEdit(project, userId);
  }

  static canReview(user) {
    return (
      user.role === 'reviewer' ||
      user.role === 'admin'
    );
  }

  static canApprove(user) {
    return (
      user.role === 'reviewer' ||
      user.role === 'admin'
    );
  }

  static canPublish(user) {
    return user.role === 'admin';
  }

  static canDelete(
    project,
    userId
  ) {
    return this.isOwner(
      project,
      userId
    );
  }
}