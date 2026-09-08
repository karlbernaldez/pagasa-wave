import api from './axios';

const unwrap = (response) => response?.data;

export const fetchWaveModelCatalog = async () => unwrap(await api.get('/wave-models'));

export const fetchWaveModels = async () => unwrap(await api.get('/admin/wave-models'));

export const createWaveModel = async (payload) =>
  unwrap(await api.post('/admin/wave-models', payload));

export const setWaveModelEnabled = async (code, enabled) =>
  unwrap(
    await api.patch(`/admin/wave-models/${encodeURIComponent(code)}/availability`, { enabled })
  );

export const setWaveModelRuntimeProfile = async (code, runtimeProfile) =>
  unwrap(
    await api.patch(`/admin/wave-models/${encodeURIComponent(code)}/runtime-profile`, {
      runtimeProfile,
    })
  );

export const fetchWaveSourceCyclePolicy = async (code) =>
  unwrap(await api.get(`/admin/wave-models/${encodeURIComponent(code)}/source-cycle-policy`));

export const setWaveSourceCyclePolicy = async (code, preferredHourUtc) =>
  unwrap(
    await api.patch(`/admin/wave-models/${encodeURIComponent(code)}/source-cycle-policy`, {
      preferredHourUtc,
    })
  );

export const runWaveModelBuilder = async (code) =>
  unwrap(await api.post(`/admin/wave-models/${encodeURIComponent(code)}/run-builder`));

export const deleteWaveModelPackage = async (code, packageTag) =>
  unwrap(
    await api.delete(
      `/admin/wave-models/${encodeURIComponent(code)}/packages/${encodeURIComponent(packageTag)}`
    )
  );

export const deleteWaveModel = async (code) =>
  unwrap(await api.delete(`/admin/wave-models/${encodeURIComponent(code)}`));
