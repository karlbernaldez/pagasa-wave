import mongoose from 'mongoose';

const FeatureSchema = new mongoose.Schema({
  geometry: {
    type: {
      type: String,
      enum: ['Polygon', 'LineString', 'Point'],
      required: true,
    },
    coordinates: {
      type: [[[Number]]], // Nested array to support both Polygon and LineString
      required: true,
    },
  },
  properties: {
    labelValue: { type: String },
    closedMode: { type: Boolean, default: false },
    isFront: { type: Boolean, default: false },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true // optional, depending on your logic
    },
    title: { type: String },
    type: { type: String, enum: ['high_pressure', 'low_pressure', 'typhoon'] },
  },
  name: { type: String, required: true },
  sourceId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Feature || mongoose.model('Feature', FeatureSchema);
