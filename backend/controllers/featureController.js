// backend/controllers/featureController.js
import Feature from '../models/Feature.js';

export const createFeature = async (req, res) => {
  try {
    const {
      geometry,
      properties = {},
      name = 'Untitled Feature',
      sourceId,
    } = req.body;

    // Validate geometry
    if (!geometry || !geometry.type || !geometry.coordinates) {
      return res.status(400).json({ error: 'Invalid geometry object.' });
    }

    // Validate nested owner and project
    const { owner, project } = properties;
    if (!sourceId || !owner || !project) {
      return res.status(400).json({ error: 'Missing required fields: sourceId, properties.owner, or properties.project.' });
    }

    // Upsert by sourceId + nested owner + nested project
    const result = await Feature.updateOne(
      {
        sourceId,
        'properties.owner': owner,
        'properties.project': project,
      },
      {
        $setOnInsert: {
          type: 'Feature',
          geometry,
          properties,
          name,
          sourceId,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      return res.status(201).json({ message: 'Feature saved successfully (new)', sourceId });
    } else {
      return res.status(200).json({ message: 'Feature already exists. Skipped saving.', sourceId });
    }
  } catch (err) {
    console.error('Error saving feature:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getAllFeatures = async (req, res) => {
  try {
    const features = await Feature.find().sort({ createdAt: -1 });
    res.json(features); // ✅ this returns an array
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getFeaturesByUserAndProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.query;

    console.log('[DEBUG] Authenticated User ID:', userId);
    console.log('[DEBUG] Query projectId:', projectId);

    if (!projectId) {
      console.warn('[WARN] Missing projectId in query.');
      return res.status(400).json({ error: 'Missing projectId in query.' });
    }

    // 🔍 Query inside properties.owner and properties.project
    const features = await Feature.find({
      'properties.owner': userId,
      'properties.project': projectId,
    }).sort({ createdAt: -1 });

    console.log(`[DEBUG] Found ${features.length} features for owner ${userId} and project ${projectId}`);

    res.json(features);
  } catch (err) {
    console.error('[ERROR] Error fetching features by user and project:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Get a single feature by sourceId
 */
export const getFeatureBySourceId = async (req, res) => {
  try {
    const { sourceId } = req.params;
    const feature = await Feature.findOne({ sourceId });

    if (!feature) {
      return res.status(404).json({ error: 'Feature not found.' });
    }

    res.json(feature);
  } catch (err) {
    console.error('Error fetching feature:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Delete a feature by sourceId
 */
export const deleteFeature = async (req, res) => {
  try {
    const { sourceId } = req.params;
    console.log('Deleting feature with sourceId:', sourceId);

    const result = await Feature.deleteOne({ sourceId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Feature not found.' });
    }

    res.json({ message: 'Feature deleted successfully.' });
  } catch (err) {
    console.error('Error deleting feature:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateFeatureName = async (req, res) => {
  try {
    const { sourceId } = req.params; // Incoming sourceId for the feature
    const { newName } = req.body; // New name to update

    // Log to check the incoming data
    console.log('Attempting to update feature:', { sourceId, newName });

    // Validate the new name
    if (!newName || typeof newName !== 'string') {
      return res.status(400).json({ error: 'Invalid name. Name must be a non-empty string.' });
    }

    // Find the feature to be updated using sourceId
    let feature = await Feature.findOneAndUpdate(
      { sourceId },
      { $set: { name: newName } },
      { new: true }
    );

    // Check if feature exists and fetch the type
    if (!feature) {
      return res.status(404).json({ error: 'Feature not found.' });
    }

    const type = feature.properties.type;

    // If the feature type is one of the specified types, update the sourceId accordingly
    if (['low_pressure', 'high_pressure', 'typhoon', 'less_1'].includes(type)) {
      const newSourceId = `${type}_${newName}`;

      // Update both the sourceId and name in a single update
      feature = await Feature.findOneAndUpdate(
        { sourceId }, // Search using the original sourceId
        { $set: { sourceId: newSourceId, name: newName } }, // Update sourceId and name together
        { new: true }
      );
    }

    console.log('Updated feature:', feature);

    // Return the updated feature
    res.json({ message: 'Feature name updated successfully.', feature });
  } catch (err) {
    console.error('Error updating feature name:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
