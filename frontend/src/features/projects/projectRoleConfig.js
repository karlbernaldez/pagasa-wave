import { ROLES } from '@/core/auth/roles';
import { can } from '@/core/auth/can';

export function getProjectsCopy(role) {
  if (role === ROLES.ADMIN) {
    return {
      title: 'Projects Review',
      description: 'Review, approve, and publish submitted forecast projects.',
      countLabel: 'project',
      emptyTitle: 'No projects in this queue',
      emptyDescription: 'Submitted forecast projects will appear here for review.',
    };
  }

  return {
    title: 'Project Library',
    description: 'Create, manage, and continue your marine forecast projects.',
    countLabel: 'project',
    emptyTitle: 'No projects found',
    emptyDescription: 'Create a new project or adjust your filters to find existing work.',
  };
}

export function getProjectActions(role) {
  return {
    canCreate: can(role, 'projects', 'create'),
    canEdit: can(role, 'projects', 'edit'),
    canSubmit: can(role, 'projects', 'submit'),
    canReview: can(role, 'projects', 'review'),
    canApprove: can(role, 'projects', 'approve'),
    canViewAll: can(role, 'projects', 'viewAll'),
    canViewOwn: can(role, 'projects', 'viewOwn'),
  };
}
