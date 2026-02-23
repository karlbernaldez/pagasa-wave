import SiteSettings from '../models/SiteSettings.js';

const ALLOWED_PAGES = ['general', 'about'];

const normalizePage = (page) => page?.toLowerCase().trim();

export const getSettings = async (req, res) => {
  try {
    const page = normalizePage(req.params.page);

    if (!ALLOWED_PAGES.includes(page)) {
      return res.status(400).json({ message: `Unknown settings page: "${page}"` });
    }

    const doc = await SiteSettings.findOne({ page }).lean();

    return res.status(200).json(doc?.data || {});
  } catch (err) {
    console.error('[settings] GET error:', err);
    res.status(500).json({ message: 'Server error while fetching settings.' });
  }
};

export const saveSettings = async (req, res) => {
  try {
    const page = normalizePage(req.params.page);

    if (!ALLOWED_PAGES.includes(page)) {
      return res.status(400).json({ message: `Unknown settings page: "${page}"` });
    }

    const doc = await SiteSettings.findOneAndUpdate(
      { page },
      { page, data: req.body },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(doc.data);
  } catch (err) {
    console.error('[settings] PUT error:', err);
    res.status(500).json({ message: 'Server error while saving settings.' });
  }
};