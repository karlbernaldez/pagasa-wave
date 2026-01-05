import express from 'express';
import { createChart, getAllCharts, getChartById, updateChart, deleteChart } from '../controllers/chartController.js';

const router = express.Router();

// Routes for Chart
router.post('/charts', createChart);
router.get('/charts', getAllCharts);
router.get('/charts/:chartId', getChartById);
router.put('/charts/:chartId', updateChart);
router.delete('/charts/:chartId', deleteChart);

export default router;
