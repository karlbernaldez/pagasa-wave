export const DEFAULT_REVIEW_CHECKLIST_NAME = 'Forecast Package Review';

export function createChecklistDraftItem(index = 0) {
  return {
    key: `review_item_${index + 1}`,
    label: '',
    description: '',
    isRequired: true,
    allowNotApplicable: false,
    isActive: true,
    sortOrder: index * 10,
  };
}

export function definitionToDraft(definition) {
  const items = Array.isArray(definition?.items)
    ? [...definition.items]
        .sort((a, b) => Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0))
        .map((item, index) => ({
          key: String(item?.key || ''),
          label: String(item?.label || ''),
          description: String(item?.description || ''),
          isRequired: item?.isRequired !== false,
          allowNotApplicable: Boolean(item?.allowNotApplicable),
          isActive: item?.isActive !== false,
          sortOrder: index * 10,
        }))
    : [];

  return {
    name: String(definition?.name || DEFAULT_REVIEW_CHECKLIST_NAME),
    version: Number(definition?.version || 0),
    items: items.length ? items : [createChecklistDraftItem(0)],
  };
}

export function normalizeChecklistKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function buildReviewChecklistPayload(draft) {
  return {
    name: String(draft?.name || '').trim(),
    items: (Array.isArray(draft?.items) ? draft.items : []).map((item, index) => ({
      key: normalizeChecklistKey(item?.key),
      label: String(item?.label || '').trim(),
      description: String(item?.description || '').trim(),
      isRequired: item?.isRequired !== false,
      allowNotApplicable: Boolean(item?.allowNotApplicable),
      isActive: item?.isActive !== false,
      sortOrder: index * 10,
    })),
  };
}

export function validateReviewChecklistDraft(draft) {
  const payload = buildReviewChecklistPayload(draft);
  if (!payload.name) return 'Checklist name is required.';

  if (!payload.items.length) return 'Add at least one checklist item.';

  const activeItems = payload.items.filter((item) => item.isActive);
  if (!activeItems.length) return 'At least one checklist item must be enabled.';

  const keys = new Set();
  for (const item of activeItems) {
    if (!item.key) return 'Every enabled checklist item needs a stable key.';
    if (!item.label) return 'Every enabled checklist item needs a label.';
    if (keys.has(item.key)) return `Checklist item key "${item.key}" is duplicated.`;
    keys.add(item.key);
  }

  return null;
}
