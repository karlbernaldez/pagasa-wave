/**
 * Returns the id of the first active element option, or '' if none are active.
 * Used to drive the <select> value in ElementSelector.
 */
export const getSelectedElement = (elements, options) => {
  const active = options.find((opt) => elements[opt.id]);
  return active ? active.id : '';
};

/**
 * Parses a comma-separated localStorage string into an array of model ids.
 * Falls back to [fallback] when the value is missing or empty.
 */
export const parseStoredModels = (storedValue, fallback) => {
  if (!storedValue) return [fallback];
  if (storedValue === 'NONE') return [];
  const parsed = storedValue
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  return parsed.length ? parsed : [fallback];
};


/**
 * Returns a human-readable summary of the currently selected model(s).
 */
export const getModelSummary = (models) => {
  if (!models?.length) return 'No model selected';
  if (models.length === 1) return `${models[0]} Model`;
  return `${models.length} Models Selected`;
};

/**
 * Safely reads a boolean from localStorage.
 * Returns false for any value other than the string 'true'.
 */
export const readBoolStorage = (key) => localStorage.getItem(key) === 'true';