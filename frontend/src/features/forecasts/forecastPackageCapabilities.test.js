import { describe, expect, it } from 'vitest';

import { getForecastPackageCapabilities } from './forecastPackageCapabilities';

describe('getForecastPackageCapabilities', () => {
  it('derives capabilities from permissions and package state, not user type names', () => {
    const permissions = ['forecast.view', 'forecast.review'];
    expect(getForecastPackageCapabilities({ permissions, status: 'Submitted' })).toMatchObject({
      canView: true,
      canReview: true,
      canEdit: false,
      canApprove: false,
      canPublish: false,
    });
  });

  it('preserves Draft capabilities when the shared view model displays In Production', () => {
    expect(
      getForecastPackageCapabilities({
        permissions: ['forecast.view', 'forecast.edit', 'forecast.submit'],
        status: 'In Production',
      })
    ).toMatchObject({
      canView: true,
      canEdit: true,
      canSubmit: true,
      isEditableState: true,
    });
  });

  it('does not allow edit actions outside editable states', () => {
    expect(
      getForecastPackageCapabilities({
        permissions: ['forecast.view', 'forecast.edit', 'forecast.submit'],
        status: 'Under Review',
      })
    ).toMatchObject({ canEdit: false, canSubmit: false });
  });

  it('allows approve only with forecast.approve in an approvable state', () => {
    expect(
      getForecastPackageCapabilities({
        permissions: ['forecast.view', 'forecast.review', 'forecast.approve'],
        status: 'Under Review',
      })
    ).toMatchObject({ canReview: true, canApprove: true });

    expect(
      getForecastPackageCapabilities({
        permissions: ['forecast.view', 'forecast.approve'],
        status: 'Submitted',
      })
    ).toMatchObject({ canApprove: false });
  });

  it('allows publish only for approved packages', () => {
    expect(
      getForecastPackageCapabilities({
        permissions: ['forecast.view', 'forecast.publish'],
        status: 'Approved',
      })
    ).toMatchObject({ canPublish: true });

    expect(
      getForecastPackageCapabilities({
        permissions: ['forecast.view', 'forecast.publish'],
        status: 'Under Review',
      })
    ).toMatchObject({ canPublish: false });
  });
});
