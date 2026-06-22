import mongoose from 'mongoose';

import {
  FORECAST_PACKAGE_STATUS,
  REQUIRED_FORECAST_CHART_TYPES,
} from '../utils/forecastPackage.js';

const { Schema } = mongoose;

const ForecastPackageChartSchema = new Schema({
  chartType: {
    type: String,
    enum: REQUIRED_FORECAST_CHART_TYPES,
    required: true,
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  sortOrder: {
    type: Number,
    required: true,
  },
  claimedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  claimedAt: {
    type: Date,
    default: null,
  },
  readyBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  readyAt: {
    type: Date,
    default: null,
  },
}, { _id: false });

const ForecastPackageCompletionSchema = new Schema({
  chartType: {
    type: String,
    enum: REQUIRED_FORECAST_CHART_TYPES,
    required: true,
  },
  isComplete: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  completedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, { _id: false });

const ForecastPackageAuditLogSchema = new Schema({
  action: {
    type: String,
    enum: [
      'created',
      'chart_claimed',
      'chart_released',
      'chart_completion_updated',
      'submitted',
      'review_started',
      'revision_requested',
      'approved',
      'rejected',
      'published',
      'archived',
    ],
    required: true,
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  previousStatus: String,
  newStatus: String,
  comment: String,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const ForecastPackageSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  forecastDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(FORECAST_PACKAGE_STATUS),
    default: FORECAST_PACKAGE_STATUS.DRAFT,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  charts: {
    type: [ForecastPackageChartSchema],
    validate: {
      validator(value) {
        if (!Array.isArray(value) || value.length !== REQUIRED_FORECAST_CHART_TYPES.length) return false;
        const chartTypes = value.map((item) => item.chartType);
        return REQUIRED_FORECAST_CHART_TYPES.every((chartType) => chartTypes.includes(chartType));
      },
      message: 'Forecast Package must include all required forecast chart types.',
    },
  },
  chartCompletion: {
    type: [ForecastPackageCompletionSchema],
    default: [],
  },
  submittedAt: Date,
  reviewStartedAt: Date,
  reviewStartedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewComment: String,
  publishedAt: Date,
  auditLogs: [ForecastPackageAuditLogSchema],
}, { timestamps: true });

ForecastPackageSchema.index({ owner: 1, forecastDate: 1 }, { unique: true });
ForecastPackageSchema.index({ owner: 1, status: 1, updatedAt: -1 });
ForecastPackageSchema.index({ status: 1, updatedAt: -1 });
ForecastPackageSchema.index({ forecastDate: -1, updatedAt: -1 });
ForecastPackageSchema.index({ 'charts.project': 1 });

export default mongoose.models.ForecastPackage || mongoose.model('ForecastPackage', ForecastPackageSchema);