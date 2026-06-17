import mongoose from 'mongoose';

import {
  ForecastAuditLogSchema,
} from './ForecastAuditLog.js';

import {
  FORECAST_PACKAGE_STATUS,
} from '../constants/forecastWorkflowConstants.js';

const { Schema } = mongoose;

const ForecastPackageSchema =
  new Schema(
    {
      forecastDate: {
        type: Date,
        required: true,
        unique: true,
      },

      status: {
        type: String,
        enum: Object.values(
          FORECAST_PACKAGE_STATUS
        ),
        default:
          FORECAST_PACKAGE_STATUS.DRAFT,
        required: true,
      },

      auditLogs: {
        type: [
          ForecastAuditLogSchema,
        ],
        default: [],
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

ForecastPackageSchema.index({
  forecastDate: -1,
});

ForecastPackageSchema.index({
  status: 1,
});

export default mongoose.model(
  'ForecastPackage',
  ForecastPackageSchema
);