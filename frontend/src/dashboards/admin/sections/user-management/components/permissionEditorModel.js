export function buildPermissionGroups(categories = [], metadata = {}) {
  const groups = new Map(
    [...categories]
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      .map((category) => [category.key, { ...category, permissions: [] }])
  );

  for (const [key, item] of Object.entries(metadata)) {
    const group = groups.get(item.category);
    if (!group) continue;
    group.permissions.push({ key, ...item });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      permissions: group.permissions.sort(
        (left, right) =>
          (left.order ?? 0) - (right.order ?? 0) || left.label.localeCompare(right.label)
      ),
    }))
    .filter((group) => group.permissions.length > 0);
}
