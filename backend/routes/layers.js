import express from 'express';
import { getLayers, addLayer, updateLayer, deleteLayer } from '../controllers/layerController.js';
const router = express.Router();

router.get('/', getLayers);
router.post('/', addLayer);
router.put('/:id', updateLayer);
router.delete('/:id', deleteLayer);

export default router;
