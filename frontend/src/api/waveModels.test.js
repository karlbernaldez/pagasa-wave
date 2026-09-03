import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from './axios';
import {
  createWaveModel,
  deleteWaveModel,
  deleteWaveModelPackage,
  fetchWaveModelCatalog,
  fetchWaveModels,
  runWaveModelBuilder,
  setWaveModelEnabled,
  setWaveModelRuntimeProfile,
} from './waveModels';

describe('waveModels API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the forecaster wave model catalog', async () => {
    api.get.mockResolvedValueOnce({ data: { models: [{ code: 'WW3' }] } });

    await expect(fetchWaveModelCatalog()).resolves.toEqual({ models: [{ code: 'WW3' }] });
    expect(api.get).toHaveBeenCalledWith('/wave-models');
  });

  it('reads the admin model inventory', async () => {
    api.get.mockResolvedValueOnce({ data: { models: [] } });

    await expect(fetchWaveModels()).resolves.toEqual({ models: [] });
    expect(api.get).toHaveBeenCalledWith('/admin/wave-models');
  });

  it('creates models disabled by default through the admin API', async () => {
    const payload = { code: 'NEW', label: 'New model' };
    api.post.mockResolvedValueOnce({ data: { model: { ...payload, enabled: false } } });

    await createWaveModel(payload);
    expect(api.post).toHaveBeenCalledWith('/admin/wave-models', payload);
  });

  it('updates model availability', async () => {
    api.patch.mockResolvedValueOnce({ data: { model: { code: 'WW3', enabled: false } } });

    await setWaveModelEnabled('WW3', false);
    expect(api.patch).toHaveBeenCalledWith('/admin/wave-models/WW3/availability', {
      enabled: false,
    });
  });

  it('updates a managed runtime profile', async () => {
    const runtimeProfile = {
      mode: 'managed_timestamp',
      cycleDayOffset: -1,
      cycleHourUtc: 18,
      forecastCadenceHours: 3,
      maxForecastHour: 60,
      rasterScheme: 'xyz',
      bounds: [100, -5, 180, 50],
      contoursEnabled: false,
    };
    api.patch.mockResolvedValueOnce({ data: { model: { code: 'CUSTOM', runtimeProfile } } });

    await setWaveModelRuntimeProfile('CUSTOM', runtimeProfile);
    expect(api.patch).toHaveBeenCalledWith('/admin/wave-models/CUSTOM/runtime-profile', {
      runtimeProfile,
    });
  });

  it('requests a supervised builder run through the admin API', async () => {
    api.post.mockResolvedValueOnce({ data: { success: true, modelCode: 'WW3' } });

    await runWaveModelBuilder('WW3');
    expect(api.post).toHaveBeenCalledWith('/admin/wave-models/WW3/run-builder');
  });

  it('encodes package identifiers before deletion', async () => {
    api.delete.mockResolvedValueOnce({ data: { success: true } });

    await deleteWaveModelPackage('WW3', '2026SEP03');
    expect(api.delete).toHaveBeenCalledWith('/admin/wave-models/WW3/packages/2026SEP03');
  });

  it('removes custom model configuration through the admin API', async () => {
    api.delete.mockResolvedValueOnce({ data: { success: true } });

    await deleteWaveModel('CUSTOM');
    expect(api.delete).toHaveBeenCalledWith('/admin/wave-models/CUSTOM');
  });
});
