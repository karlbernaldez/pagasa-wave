import mongoose from 'mongoose';

import {
  FORECAST_PACKAGE_STATUS,
  REQUIRED_FORECAST_CHART_TYPES,
} from '../utils/forecastPackage.js';

const { Schema } = mongoose;

const ForecastPackageChartEditorSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  started