import SiteSettings from '../models/SiteSettings.js';
import {
  MAP_VIEW_SETTINGS_PAGE,
  buildMapViewSettingsResponse,
  parseMapViewSettingsPayload,
} from '../utils/mapViewSettings.js';

const ALLOWED_PAGES = [
  'general',
  'about',
  'contact',
  'operations',
  'forecasterworkspace',
  'adminreview',
  MAP_VIEW_SETTINGS_PAGE,
];

const PUBLIC_CACHEABLE_PAGES = ['about', 'contact'];

const normalizePage = (page) => page?.toLowerCase().trim();

/**
 * Prevent Mongo operator injection & prototype pollution.
 * Recurses through plain objects/arrays so nested settings remain safe.
 */
const sanitizeObject = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item));
  }

  if (!value || typeof value !== 'object') return value;

  const clean = {};

  for (const key of Object.keys(value)) {
    if (
      key.startsWith('$') ||
      key.includes('.') ||
      key === '__proto__' ||
      key === 'constructor'
    ) continue;

    clean[key] = sanitizeObject(value[key]);
  }

  return clean;
};

const resolveSettingsResponse = (page, data) => {
  if (page === MAP_VIEW_SETTINGS_PAGE) {
    return buildMapViewSettingsResponse(data);
  }

  return data || {};
};

const parseSettingsPayload = (page, payload) => {
  const sanitizedData = sanitizeObject(payload);

  if (page === MAP_VIEW_SETTINGS_PAGE) {
    return parseMapViewSettingsPayload(sanitizedData);
  }

  return sanitizedData;
};

/**
 * GET SETTINGS
 */
export const getSettings = async (req, res) => {
  try {
    const page = normalizePage(req.params.page);

    if (!ALLOWED_PAGES.includes(page)) {
      return res.status(400).json({
        message: `Unknown settings page: "${page}"`,
      });
    }

    const doc = await SiteSettings.findOne({ page }).lean();

    if (PUBLIC_CACHEABLE_PAGES.includes(page)) {
      res.set('Cache-Control', 'public, max-age=300');
    } else {
      res.set('Cache-Control', 'no-store');
    }

    return res.status(200).json(resolveSettingsResponse(page, doc?.data));
  } catch (err) {
    console.error('[settings] GET error:', err);
    res.status(500).json({
      message: 'Server error while fetching settings.',
    });
  }
};

/**
 * SAVE SETTINGS (SECURED)
 */
export const saveSettings = async (req, res) => {
  try {
    const page = normalizePage(req.params.page);

    if (!ALLOWED_PAGES.includes(page)) {
      return res.status(400).json({
        message: `Unknown settings page: "${page}"`,
      });
    }

    /**
     * Ensure payload exists
     */
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        message: 'Invalid settings payload.',
      });
    }

    /**
     * Sanitize and validate incoming data
     */
    let sanitizedData;
    try {
      sanitizedData = parseSettingsPayload(page, req.body);
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({
          message: error.message,
          errors: error.details || [],
        });
      }

      throw error;
    }

    /**
     * Prevent empty overwrite
     */
    if (!sanitizedData || Object.keys(sanitizedData).length === 0) {
      return res.status(400).json({
        message: 'Settings payload is empty or invalid.',
      });
    }

    /**
     * Optional: enforce max size (prevent abuse)
     */
    const payloadSize = JSON.stringify(sanitizedData).length;
    if (payloadSize > 50_000) {
      return res.status(413).json({
        message: 'Settings payload too large.',
      });
    }

    /**
     * Save settings safely
     */
    const doc = await SiteSettings.findOneAndUpdate(
      { page },
      { page, data: sanitizedData },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json(resolveSettingsResponse(page, doc.data));

  } catch (err) {
    console.error('[settings] PUT error:', err);

    return res.status(500).json({
      message: 'Server error while saving settings.',
    });
  }
};
