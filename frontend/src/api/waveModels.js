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

export const runWaveModelBuilder = async (code) =>
  unwrap(await api.post(`/admin/wave-models/${encodeURIComponent(code)}/run-builder`));

export const setWaveModelSchedule = async (code, schedule) =>
  unwrap(
    await api.patch(`/admin/wave-models/${encodeURIComponent(code)}/schedule`, { schedule })
  );

export const enableWaveModelSchedule = async (code) =>
  unwrap(await api.post(`/admin/wave-models/${encodeURIComponent(code)}/schedule/enable`));

export const disableWaveModelSchedule = async (code) =>
  unwrap(await api.post(`/admin/wave-models/${encodeURIComponent(code)}/schedule/disable`));

export const restoreWaveModelSchedule = async (code) =>
  unwrap(await api.post(`/admin/wave-models/${encodeURIComponent(code)}/schedule/restore`));

export const deleteWaveModelPackage = async (code, packageTag) =>
  unwrap(
    await api.delete(
      `/admin/wave-models/${encodeURIComponent(code)}/packages/${encodeURIComponent(packageTag)}`
    )
  );

export const deleteWaveModel = async (code) =>
  unwrap(await api.delete(`/admin/wave-models/${encodeURIComponent(code)}`));
