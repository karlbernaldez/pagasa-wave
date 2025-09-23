// models/Project.js
import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index: ensures no duplicate name for the same owner
ProjectSchema.index({ name: 1, owner: 1 }, { unique: true });

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
