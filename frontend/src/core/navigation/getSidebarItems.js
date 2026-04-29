import { DASHBOARD_MODULES } from './modules';
import { can } from '@/core/auth/can';

export function getSidebarItems(role) {
  return DASHBOARD_MODULES
    .filter((item) => item.roles.includes(role))
    .filter((item) => can(role, item.feature, item.action))
    .map((item) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      path: item.path,
      disabled: item.disabledFor?.includes(role) ?? false,
      adminTab: item.adminTab,
    }));
}
