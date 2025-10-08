// models/Chart.js
import mongoose from 'mongoose';

const ChartSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        default: '',
    },
    chartType: {
        type: String,
        enum: ['Wave Analysis', '24', '36', '48'],
        required: true,
    },
    forecastDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    approver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    dateApproved: {
        type: Date,
    },
    image: {
        type: String,
        required: true,
    }
});

export default mongoose.models.Chart || mongoose.model('Chart', ChartSchema);
