import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─────────────────────────────────────────────────────────────
// Forecast Feature Types
// ─────────────────────────────────────────────────────────────

const FEATURE_TYPES = [
  'high_pressure',
  'low_pressure',
  'typhoon',
  'wave_height',
  'front',
];

// ─────────────────────────────────────────────────────────────
// Supported GeoJSON Geometry Types
// ─────────────────────────────────────────────────────────────

const GEOJSON_TYPES = [
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
];

// ─────────────────────────────────────────────────────────────
// Feature Properties
// Domain-specific annotation metadata
// ─────────────────────────────────────────────────────────────

const FeaturePropertiesSchema = new Schema(
  {
    label: {
      type: String,
      trim: true,
      default: null,
    },

    featureType: {
      type: String,
      enum: FEATURE_TYPES,
      default: null,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    _id: false,
  }
);

// ─────────────────────────────────────────────────────────────
// GeoJSON Geometry
// ─────────────────────────────────────────────────────────────

const GeometrySchema = new Schema(
  {
    type: {
      type: String,
      enum: GEOJSON_TYPES,
      required: true,
    },

    coordinates: {
      type: Schema.Types.Mixed,
      required: true,

      validate: {
        validator: Array.isArray,
        message: 'Geometry coordinates must be an array.',
      },
    },
  },
  {
    _id: false,
  }
);

// ─────────────────────────────────────────────────────────────
// Feature Schema
// ─────────────────────────────────────────────────────────────

const FeatureSchema = new Schema(
  {
    // ─────────────────────────────────────────────────────────
    // Ownership / Hierarchy
    // ─────────────────────────────────────────────────────────

    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },

    chart: {
      type: Schema.Types.ObjectId,
      ref: 'Chart',
      required: true,
    },

    // ─────────────────────────────────────────────────────────
    // Stable Identifiers
    // ─────────────────────────────────────────────────────────

    sourceId: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },

    stableId: {
      type: String,
      trim: true,
      default: null,
      immutable: true,
    },

    annotationId: {
      type: String,
      trim: true,
      default: null,
    },

    // ─────────────────────────────────────────────────────────
    // GeoJSON
    // ─────────────────────────────────────────────────────────

    geometry: {
      type: GeometrySchema,
      required: true,
    },

    properties: {
      type: FeaturePropertiesSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─────────────────────────────────────────────────────────────
// Spatial Index
// ─────────────────────────────────────────────────────────────

FeatureSchema.index({
  geometry: '2dsphere',
});

// ─────────────────────────────────────────────────────────────
// Hierarchy Query Indexes
// ─────────────────────────────────────────────────────────────

FeatureSchema.index({
  owner: 1,
  project: 1,
  chart: 1,
});

FeatureSchema.index({
  chart: 1,
});

FeatureSchema.index({
  project: 1,
});

// ─────────────────────────────────────────────────────────────
// Identity Indexes
// ─────────────────────────────────────────────────────────────

// Unique drawing/source ID within a chart
FeatureSchema.index(
  {
    chart: 1,
    sourceId: 1,
  },
  {
    unique: true,
    name: 'uniq_chart_sourceId',
  }
);

// Stable annotation identity within a chart
FeatureSchema.index(
  {
    chart: 1,
    stableId: 1,
  },
  {
    unique: true,
    sparse: true,
    name: 'uniq_chart_stableId',
  }
);

// Annotation lookup
FeatureSchema.index({
  chart: 1,
  annotationId: 1,
});

// Feature type filtering
FeatureSchema.index({
  chart: 1,
  'properties.featureType': 1,
});

// ─────────────────────────────────────────────────────────────

export default mongoose.models.Feature ||
  mongoose.model('Feature', FeatureSchema);