export function buildPermissionGroups(categories = [], metadata = {}) {
  const groups = new Map(
    [...categories]
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      .map((category) => [category.key, { ...category, permissions: [], subsections: [] }])
  );

  for (const [key, item] of Object.entries(metadata)) {
    const group = groups.get(item.category);
    if (!group) continue;
    group.permissions.push({ key, ...item });
  }

  return [...groups.values()]
    .map((group) => {
      const subsectionMap = new Map();

      for (const permission of group.permissions) {
        const subsectionKey = permission.subsection || 'general';
        if (!subsectionMap.has(subsectionKey)) {
          subsectionMap.set(subsectionKey, {
            key: subsectionKey,
            label: permission.subsectionLabel || group.label,
            description: permission.subsectionDescription || group.description,
            order: permission.subsectionOrder ?? permission.order ?? 0,
            permissions: [],
          });
        }
        subsectionMap.get(subsectionKey).permissions.push(permission);
      }

      const subsections = [...subsectionMap.values()]
        .map((subsection) => ({
          ...subsection,
          permissions: subsection.permissions.sort(
            (left, right) =>
              (left.order ?? 0) - (right.order ?? 0) || left.label.localeCompare(right.label)
          ),
        }))
        .sort(
          (left, right) =>
            (left.order ?? 0) - (right.order ?? 0) || left.label.localeCompare(right.label)
        );

      return {
        ...group,
        permissions: group.permissions.sort(
          (left, right) =>
            (left.order ?? 0) - (right.order ?? 0) || left.label.localeCompare(right.label)
        ),
        subsections,
      };
    })
    .filter((group) => group.permissions.length > 0);
}
