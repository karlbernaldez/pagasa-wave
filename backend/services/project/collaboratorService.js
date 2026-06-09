import User from '../../models/User.js';
import Project from '../../models/Project.js';
import { throwError } from '../../utils/errorHelper.js';
import { ProjectPermissionService } from './projectPermissionService.js';
import { ProjectAuthorization } from './projectAuthorization.js';

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * List all collaborators on a project, with user details populated.
 */
export async function listCollaborators(projectId, actorUser) {
  const project = await Project.findById(projectId)
    .populate('collaborators.user', 'firstName lastName email username avatarUrl')
    .populate('collaborators.invitedBy', 'firstName lastName email')
    .lean();

  if (!project) throwError('Project not found.', 404);

  ProjectAuthorization.require(
    ProjectPermissionService.canRead(
      project,
      actorUser
    ),
    'Access denied.'
  );

  return project.collaborators ?? [];
}

export async function addCollaborator(projectId, actorUser, { email, role }) {
  const MAX_COLLABORATORS = 20;

  if (!email?.trim()) throwError('Email is required.', 400);
  if (!['editor', 'viewer'].includes(role)) throwError('Role must be "editor" or "viewer".', 400);

  const project = await Project.findById(projectId);
  if (!project) throwError('Project not found.', 404);

  ProjectAuthorization.require(
    ProjectPermissionService.canManageCollaborators(
      project,
      actorUser
    ),
    'Only the project owner can manage collaborators.'
  );

  // Resolve the invitee
  const invitee = await User.findOne({
    email: email.trim().toLowerCase(),
    deletedAt: null,
  }).select('_id firstName lastName email status');

  if (!invitee) throwError('No active account found with that email address.', 404);
  if (invitee.status !== 'active') throwError('That account is not currently active.', 400);

  // Owner check
  if (isOwner(project, invitee._id)) {
    throwError('The project owner cannot be added as a collaborator.', 400);
  }

  // Duplicate check
  const alreadyExists = project.collaborators.some(
    c => String(c.user) === String(invitee._id)
  );
  if (alreadyExists) throwError('That user is already a collaborator on this project.', 409);

  // Cap
  if (project.collaborators.length >= MAX_COLLABORATORS) {
    throwError(`Projects are limited to ${MAX_COLLABORATORS} collaborators.`, 400);
  }

  const actorId = actorUser._id || actorUser.id;

  project.collaborators.push({
    user: invitee._id,
    role,
    invitedBy: actorId,
    pending: true,
    invitedAt: new Date(),
  });

  await project.save();

  // Re-fetch with populated fields so the caller gets a clean object
  const updated = await Project.findById(projectId)
    .populate('collaborators.user', 'firstName lastName email username avatarUrl')
    .populate('collaborators.invitedBy', 'firstName lastName email')
    .lean();

  const newEntry = updated.collaborators.find(
    c => String(c.user?._id ?? c.user) === String(invitee._id)
  );

  return newEntry;
}

/**
 * Update the role of an existing collaborator.
 */
export async function updateCollaboratorRole(projectId, actorUser, targetUserId, role) {
  if (!['editor', 'viewer'].includes(role)) throwError('Role must be "editor" or "viewer".', 400);

  const project = await Project.findById(projectId);
  if (!project) throwError('Project not found.', 404);

  ProjectAuthorization.require(
    ProjectPermissionService.canManageCollaborators(
      project,
      actorUser
    ),
    'Only the project owner can manage collaborators.'
  );

  const entry = project.collaborators.find(
    c => String(c.user) === String(targetUserId)
  );
  if (!entry) throwError('Collaborator not found.', 404);

  entry.role = role;
  await project.save();

  return entry;
}

/**
 * Remove a collaborator from a project.
 *
 * Owner/admin can remove anyone.
 * A collaborator may remove themselves.
 */
export async function removeCollaborator(projectId, actorUser, targetUserId) {
  const project = await Project.findById(projectId);
  if (!project) throwError('Project not found.', 404);

  const actorId = String(actorUser._id || actorUser.id);
  const isSelf = actorId === String(targetUserId);

  // Allow self-removal; otherwise require owner/admin
  if (!isSelf) {
    ProjectAuthorization.require(
      ProjectPermissionService.canManageCollaborators(
        project,
        actorUser
      ),
      'Only the project owner can manage collaborators.'
    );
  }

  const before = project.collaborators.length;
  project.collaborators = project.collaborators.filter(
    c => String(c.user) !== String(targetUserId)
  );

  if (project.collaborators.length === before) {
    throwError('Collaborator not found.', 404);
  }

  await project.save();
}

/**
 * Check whether a user has access to a project and what their effective role is.
 *
 * Returns one of: 'owner' | 'admin' | 'editor' | 'viewer' | null
 *
 * Used by the authMiddleware-style guard `requireProjectAccess`.
 */
export function resolveProjectRole(
  project,
  actorUser
) {
  return ProjectPermissionService.resolveRole(
    project,
    actorUser
  );
}