/**
 * backend/services/project/collaboratorService.js
 *
 * All collaborator business logic lives here.
 * Controllers stay thin; they just call into this service.
 *
 * Design notes:
 *  - Owner is never in the collaborators array; ownership is project.owner.
 *  - A user may only appear once per project (enforced in addCollaborator).
 *  - Admins bypass all ownership checks (consistent with rest of codebase).
 *  - Notification emails are fire-and-forget so they never block the response.
 */

import User    from '../../models/User.js';
import Project from '../../models/Project.js';
import { throwError } from '../../utils/errorHelper.js';

// ─── tiny helpers ─────────────────────────────────────────────────────────────

const isOwner   = (project, userId) => String(project.owner) === String(userId);
const isAdmin   = (user)            => user?.role === 'admin';

/**
 * Verify the acting user can manage collaborators on this project.
 * Only the project owner or a platform admin may do so.
 */
function assertCanManage(project, actorUser) {
  if (isAdmin(actorUser)) return;
  if (isOwner(project, actorUser._id || actorUser.id)) return;
  throwError('Only the project owner can manage collaborators.', 403);
}

/**
 * Verify the acting user can at least read collaborators.
 * Owner, admin, or any existing collaborator may list them.
 */
function assertCanRead(project, actorUser) {
  if (isAdmin(actorUser)) return;
  const actorId = String(actorUser._id || actorUser.id);
  if (isOwner(project, actorId)) return;
  const isCollab = project.collaborators.some(
    c => String(c.user) === actorId || String(c.user?._id) === actorId
  );
  if (isCollab) return;
  throwError('Access denied.', 403);
}

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

  assertCanRead(project, actorUser);

  return project.collaborators ?? [];
}

/**
 * Add a collaborator to a project by email address.
 *
 * Rules:
 *  - Actor must be owner or admin.
 *  - Target user must exist and be active.
 *  - Owner cannot be added as a collaborator (they already own it).
 *  - No duplicates.
 *  - Max 20 collaborators per project (sensible default; adjust freely).
 */
export async function addCollaborator(projectId, actorUser, { email, role }) {
  const MAX_COLLABORATORS = 20;

  if (!email?.trim()) throwError('Email is required.', 400);
  if (!['editor', 'viewer'].includes(role)) throwError('Role must be "editor" or "viewer".', 400);

  const project = await Project.findById(projectId);
  if (!project) throwError('Project not found.', 404);

  assertCanManage(project, actorUser);

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
    user:      invitee._id,
    role,
    invitedBy: actorId,
    pending:   true,
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

  assertCanManage(project, actorUser);

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
  const isSelf  = actorId === String(targetUserId);

  // Allow self-removal; otherwise require owner/admin
  if (!isSelf) assertCanManage(project, actorUser);

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
export function resolveProjectRole(project, actorUser) {
  if (!actorUser) return null;

  if (isAdmin(actorUser)) return 'admin';

  const actorId = String(actorUser._id || actorUser.id);

  if (isOwner(project, actorId)) return 'owner';

  const entry = project.collaborators?.find(
    c => String(c.user?._id ?? c.user) === actorId
  );

  return entry?.role ?? null;
}