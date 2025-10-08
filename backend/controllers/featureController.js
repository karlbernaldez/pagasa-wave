// backend/controllers/featureController.js
import Feature from '../models/Feature.js';
import Project from '../models/Project.js';

export const createFeature = async (req, res) => {
  try {
    const {
      geometry,
      properties = {},
      name = 'Untitled Feature',
      sourceId,
    } = req.body;

    const owner = req.user.id;
    const projectId = properties.project;

    // Validate geometry
    if (!geometry || !geometry.type || !geometry.coordinates) {
      return res.status(400).json({ error: 'Invalid geometry object.' });
    }

    // Validate required fields
    if (!sourceId || !owner || !projectId) {
      return res.status(400).json({ error: 'Missing required fields: sourceId or properties.project.' });
    }

    // ✅ Check project existence
    const projectExists = await Project.findById(projectId);
    if (!projectExists) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Compose properties with owner
    const fullProperties = {
      ...properties,
      owner,
    };

    // Upsert feature
    const result = await Feature.updateOne(
      {
        sourceId,
        'properties.owner': owner,
        'properties.project': projectId,
      },
      {
        $setOnInsert: {
          type: 'Feature',
          geometry,
          properties: fullProperties,
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
    const { projectId } = req.params; // Accessing projectId from the route parameter

    if (!projectId) {
      console.warn('[WARN] Missing projectId in route.');
      return res.status(400).json({ error: 'Missing projectId in route.' });
    }

    // 🔍 Query inside properties.owner and properties.project
    const features = await Feature.find({
      'properties.owner': userId,
      'properties.project': projectId,
    }).sort({ createdAt: -1 });

    res.json(features);
  } catch (err) {
    console.error('[ERROR] Error fetching features by user and project:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

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

export const deleteFeature = async (req, res) => {
  try {
    const { sourceId } = req.params;

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

    // Return the updated feature
    res.json({ message: 'Feature name updated successfully.', feature });
  } catch (err) {
    console.error('Error updating feature name:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
