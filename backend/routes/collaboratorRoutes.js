/**
 * backend/routes/collaboratorRoutes.js
 *
 * Mount in server.js:
 *   import collaboratorRoutes from './routes/collaboratorRoutes.js';
 *   app.use('/api/projects', collaboratorRoutes);
 *
 * All routes sit under /api/projects/:id/collaborators
 * and require an authenticated session (protect middleware).
 */

import express  from 'express';
import rateLimit from 'express-rate-limit';

import protect  from '../middleware/authMiddleware.js';
import {
  getCollaborators,
  inviteCollaborator,
  changeCollaboratorRole,
  deleteCollaborator,
} from '../controllers/projects/collaboratorController.js';

const router = express.Router({ mergeParams: true });

// Stricter rate-limit for invite (sends email, costs resource)
const inviteLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Too many invite requests. Please slow down.' },
});

// All collaborator routes require authentication
router.use(protect);

router.get(   '/',          getCollaborators);
router.post(  '/',          inviteLimiter, inviteCollaborator);
router.patch( '/:userId',   changeCollaboratorRole);
router.delete('/:userId',   deleteCollaborator);

export default router;