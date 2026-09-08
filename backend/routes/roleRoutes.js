import express from 'express';

import {
  addRole,
  editRole,
  getRoleCatalog,
  getRoles,
  removeRole,
} from '../controllers/roleController.js';
import authenticate from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.use(authenticate, isAdmin);

router.get('/catalog', getRoleCatalog);
router.get('/', getRoles);
router.post('/', addRole);
router.put('/:key', editRole);
router.delete('/:key', removeRole);

export default router;
