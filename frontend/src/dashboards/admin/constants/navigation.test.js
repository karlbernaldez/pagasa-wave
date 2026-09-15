import { describe, expect, it } from 'vitest';

import { ADMIN_ROUTE_BY_TAB, ADMIN_TABS, getAdminTabForPath } from './navigation';

describe('getAdminTabForPath', () => {
  it('keeps administrator account routes under the account tab', () => {
    expect(getAdminTabForPath('/dashboard/account')).toBe(ADMIN_TABS.ACCOUNT);
    expect(getAdminTabForPath('/dashboard/account/security')).toBe(ADMIN_TABS.ACCOUNT);
  });

  it('points Forecast Package review navigation to the shared review queue', () => {
    expect(ADMIN_ROUTE_BY_TAB[ADMIN_TABS.CHARTS]).toBe('/forecasts/review');
    expect(getAdminTabForPath('/forecasts/review')).toBe(ADMIN_TABS.CHARTS);
  });
});
