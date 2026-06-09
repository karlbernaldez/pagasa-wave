/**
 * backend/middleware/collaboratorMiddleware.js
 *
 * Reusable guards for routes that need collaborator-aware access control.
 *
 * Usage in routes:
 *
 *   import {
 *     requireProjectAccess,
 *     requireEditorAccess,
 *     requireOwnerOrAdminAccess,
 *   } from '../middleware/collaboratorMiddleware.js';
 *
 *   // Anyone with any role on this project (owner/admin/editor/viewer):
 *   router.get('/:id/something', protect, requireProjectAccess, handler);
 *
 *   // Must be editor, owner, or admin to mutate:
 *   router.patch('/:id/something', protect, requireEditorAccess, handler);
 *
 *   // Only owner or admin:
 *   router.delete('/:id', protect, requireOwnerOrAdminAccess, handler);
 */

import mongoose from 'mongoose';
import Project  from '../models/Project.js';
import { resolveProjectRole } from '../services/project/collaboratorService.js';

/**
 * Loads project from :id, resolves the actor's role, and attaches both to req.
 * Rejects with 404/403 if the project doesn't exist or the user has no access.
 *
 * Sets:
 *   req.project      — the Mongoose project document (with collaborators populated)
 *   req.projectRole  — 'owner' | 'admin' | 'editor' | 'viewer'
 */
export const requireProjectAccess = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid project ID.' });
    }

    const project = await Project.findById(id).populate(
      'collaborators.user',
      '_id role status'
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const role = resolveProjectRole(project, req.user);

    if (!role) {
      return res.status(403).json({ message: 'You do not have access to this project.' });
    }

    req.project     = project;
    req.projectRole = role;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Allows: owner, admin, editor.
 * Rejects: viewer (read-only).
 *
 * Must come AFTER requireProjectAccess (needs req.projectRole).
 */
export const requireEditorAccess = (req, res, next) => {
  if (['owner', 'admin', 'editor'].includes(req.projectRole)) return next();
  res.status(403).json({ message: 'Editors and above can perform this action.' });
};

/**
 * Allows: owner, admin only.
 *
 * Must come AFTER requireProjectAccess (needs req.projectRole).
 */
export const requireOwnerOrAdminAccess = (req, res, next) => {
  if (['owner', 'admin'].includes(req.projectRole)) return next();
  res.status(403).json({ message: 'Only the project owner can perform this action.' });
};