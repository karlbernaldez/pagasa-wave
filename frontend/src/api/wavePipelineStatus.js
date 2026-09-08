import api from './axios';

export async function fetchWavePipelineStatus() {
  const response = await api.get('/admin/wave-pipeline');
  return response.data;
}
