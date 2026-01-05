import Chart from '../models/Chart.js';
import mongoose from 'mongoose';

// Create a new chart
export const createChart = async (req, res) => {
    const { title, description, chartType, forecastDate, owner, dateApproved, image } = req.body;

    try {
        const chart = new Chart({
            title,
            description,
            chartType,
            forecastDate,
            owner,
            dateApproved,
            image
        });

        await chart.save();
        res.status(201).json({ success: true, chart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all charts
export const getAllCharts = async (req, res) => {
    try {
        const charts = await Chart.find().populate('owner approver', 'name email'); // You can specify what fields to populate
        res.status(200).json({ success: true, charts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a single chart by ID
export const getChartById = async (req, res) => {
    const { chartId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chartId)) {
        return res.status(400).json({ success: false, message: 'Invalid chart ID' });
    }

    try {
        const chart = await Chart.findById(chartId).populate('owner approver', 'name email');
        
        if (!chart) {
            return res.status(404).json({ success: false, message: 'Chart not found' });
        }

        res.status(200).json({ success: true, chart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a chart
export const updateChart = async (req, res) => {
    const { chartId } = req.params;
    const { name, description, chartType, forecastDate, owner, approver, dateApproved, image } = req.body;

    if (!mongoose.Types.ObjectId.isValid(chartId)) {
        return res.status(400).json({ success: false, message: 'Invalid chart ID' });
    }

    try {
        const updatedChart = await Chart.findByIdAndUpdate(chartId, {
            name,
            description,
            chartType,
            forecastDate,
            owner,
            approver,
            dateApproved,
            image
        }, { new: true });

        if (!updatedChart) {
            return res.status(404).json({ success: false, message: 'Chart not found' });
        }

        res.status(200).json({ success: true, updatedChart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a chart
export const deleteChart = async (req, res) => {
    const { chartId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chartId)) {
        return res.status(400).json({ success: false, message: 'Invalid chart ID' });
    }

    try {
        const chart = await Chart.findByIdAndDelete(chartId);

        if (!chart) {
            return res.status(404).json({ success: false, message: 'Chart not found' });
        }

        res.status(200).json({ success: true, message: 'Chart deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
