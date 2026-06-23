import mongoose from 'mongoose';

const FeatureSchema = new mongoose.Schema({
  geometry: {
    type: {
      type: String,
      enum: ['Polygon', 'LineString', 'Point'],
      required: true,
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    }
  },
  properties: {
    labelValue: { type: String },
    closedMode: { type: Boolean, default: false },
    isFront: { type: Boolean, default: false },
    frontType: { type: String, enum: ['cold', 'warm', 'stationary', 'occluded'] },
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
    sourceId: { type: String },
    stableId: { type: String },
    annotationId: { type: String },
    title: { type: String },
    name: { type: String },
    type: { type: String, enum: ['high_pressure', 'low_pressure', 'typhoon'] },
  },
  name: { type: String, required: true },
  sourceId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

FeatureSchema.index({ sourceId: 1, 'properties.owner': 1, 'properties.project': 1 }, { unique: true });
FeatureSchema.index({ 'properties.stableId': 1, 'properties.project': 1 });

export default mongoose.models.Feature || mongoose.model('Feature', FeatureSchema);