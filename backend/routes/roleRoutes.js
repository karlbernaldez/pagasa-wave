import express from 'express';

import {
  addRole,
  editRole,
  getRoleCatalog,
  getRoles,
  removeRole,
} from '../controllers/roleController.js';
import authenticate from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/catalog', requirePermission('roles.view'), getRoleCatalog);
router.get('/', requirePermission('roles.view'), getRoles);
router.post('/', requirePermission('roles.create'), addRole);
router.put('/:key', requirePermission('roles.edit'), editRole);
router.delete('/:key', requirePermission('roles.delete'), removeRole);

export default router;
