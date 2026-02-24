// backend/routes/projectRoutes.js
import express from 'express';
import { createProject, getUserProjects, getAllProjects, getProjectById, updateProject, deleteProject } from '../controllers/projectController.js';
import protect from '../middleware/authMiddleware.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import isOwnerOrAdmin from '../middleware/projectMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createProject); //checked
router.get('/all', isAdmin, getAllProjects); // admin only
router.get('/', getUserProjects); // checked
router.get('/:id', isOwnerOrAdmin, getProjectById); //checked 
router.put('/:id',isOwnerOrAdmin, updateProject); // checked
router.delete('/:id', isOwnerOrAdmin, deleteProject); //checked

export default router;
