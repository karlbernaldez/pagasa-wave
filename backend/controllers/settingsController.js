import SiteSettings from '../models/SiteSettings.js';

const ALLOWED_PAGES = ['general', 'about', 'contact'];

const normalizePage = (page) => page?.toLowerCase().trim();

/**
 * Prevent Mongo operator injection & prototype pollution
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return {};

  const clean = {};

  for (const key of Object.keys(obj)) {
    if (
      key.startsWith('$') ||
      key.includes('.') ||
      key === '__proto__' ||
      key === 'constructor'
    ) continue;

    clean[key] = obj[key];
  }

  return clean;
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

    res.set('Cache-Control', 'public, max-age=300'); // cache 5 minutes

    return res.status(200).json(doc?.data || {});
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
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        message: 'Invalid settings payload.',
      });
    }

    /**
     * Sanitize incoming data
     */
    const sanitizedData = sanitizeObject(req.body);

    /**
     * Prevent empty overwrite
     */
    if (Object.keys(sanitizedData).length === 0) {
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

    return res.status(200).json(doc.data);

  } catch (err) {
    console.error('[settings] PUT error:', err);

    return res.status(500).json({
      message: 'Server error while saving settings.',
    });
  }
};