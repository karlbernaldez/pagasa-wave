import { describe, expect, it } from 'vitest';

import { buildDashboardSidebarGroups } from './OperationalDashboardShell';

function visibleItemIds(groups) {
  return groups.flatMap((group) =>
    group.items.flatMap((item) => [item.id, ...(item.children ?? []).map((child) => child.id)])
  );
}

describe('OperationalDashboardShell permission-driven navigation', () => {
  it('shows the same dashboard navigation for an arbitrary User Type with matching permissions', () => {
    const groups = buildDashboardSidebarGroups({
      role: 'duty_manager',
      permissions: ['dashboard.view', 'wave_models.manage', 'wave_pipeline.view', 'users.view'],
    });

    const ids = visibleItemIds(groups);

    expect(ids).toContain('dashboard');
    expect(ids).toContain('wave_models');
    expect(ids).toContain('wave_pipeline');
    expect(ids).toContain('users');
    expect(ids).not.toContain('users_roles');
    expect(ids).not.toContain('settings');
  });

  it('does not grant management navigation from an admin User Type name alone', () => {
    const groups = buildDashboardSidebarGroups({
      role: 'admin',
      permissions: ['dashboard.view'],
    });

    const ids = visibleItemIds(groups);

    expect(ids).toContain('dashboard');
    expect(ids).not.toContain('wave_models');
    expect(ids).not.toContain('users');
    expect(ids).not.toContain('users_roles');
    expect(ids).not.toContain('settings');
  });

  it('shows User Types only when roles.view is present', () => {
    const groups = buildDashboardSidebarGroups({
      role: 'operations_lead',
      permissions: ['dashboard.view', 'users.view', 'roles.view'],
    });

    const ids = visibleItemIds(groups);

    expect(ids).toContain('users');
    expect(ids).toContain('users_list');
    expect(ids).toContain('users_roles');
  });
});
