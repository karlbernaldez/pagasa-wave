// backend/routes/projectRoutes.js
import express from 'express';
import { createProject, getUserProjects, getProjectById, updateProject, deleteProject } from '../controllers/projectController.js';
import protect from '../middleware/authMiddleware.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { isAdmin, isOwnerOrAdmin, isOwnerOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createProject);
router.get('/', getUserProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', authenticateToken, deleteProject);

export default router;
