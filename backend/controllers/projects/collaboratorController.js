import asyncHandler from '../../utils/asyncHandler.js';
import {
  listCollaborators,
  addCollaborator,
  updateCollaboratorRole,
  removeCollaborator,
} from '../../services/project/collaboratorService.js';

// ─── GET /api/projects/:id/collaborators ──────────────────────────────────────

export const getCollaborators = asyncHandler(async (req, res) => {
  const collaborators = await listCollaborators(req.params.id, req.user);
  res.json({ collaborators });
});

// ─── POST /api/projects/:id/collaborators ─────────────────────────────────────
//
//   Body: { email: string, role: 'editor' | 'viewer' }

export const inviteCollaborator = asyncHandler(async (req, res) => {
  const { email, role = 'editor' } = req.body;

  const collaborator = await addCollaborator(req.params.id, req.user, { email, role });

  res.status(201).json({
    message: `Invite sent to ${email}.`,
    collaborator,
  });
});

// ─── PATCH /api/projects/:id/collaborators/:userId ────────────────────────────
//
//   Body: { role: 'editor' | 'viewer' }

export const changeCollaboratorRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const updated = await updateCollaboratorRole(
    req.params.id,
    req.user,
    req.params.userId,
    role,
  );

  res.json({
    message: 'Role updated.',
    collaborator: updated,
  });
});

// ─── DELETE /api/projects/:id/collaborators/:userId ───────────────────────────

export const deleteCollaborator = asyncHandler(async (req, res) => {
  await removeCollaborator(req.params.id, req.user, req.params.userId);
  res.json({ message: 'Collaborator removed.' });
});