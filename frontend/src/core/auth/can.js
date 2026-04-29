import { PERMISSIONS } from './permissions';

export function can(role, feature, action) {
  if (!role || !feature || !action) return false;
  return PERMISSIONS[feature]?.[role]?.includes(action) ?? false;
}
