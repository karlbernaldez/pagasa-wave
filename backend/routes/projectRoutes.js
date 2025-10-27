// backend/routes/projectRoutes.js
import express from 'express';
import { createProject, getUserProjects, getProjectById, updateProject, deleteProject } from '../controllers/projectController.js';
import protect from '../middleware/authMiddleware.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import isOwnerOrAdmin from '../middleware/projectMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createProject); //checked
router.get('/', getUserProjects); // checked
router.get('/:id', isOwnerOrAdmin, getProjectById); //checked 
router.put('/:id',isOwnerOrAdmin, updateProject); // checked
router.delete('/:id', isOwnerOrAdmin, deleteProject); //checked

export default router;
