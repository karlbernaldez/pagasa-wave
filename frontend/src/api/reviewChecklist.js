import { fetchWithAuth } from './auth';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/review-checklists`;

async function parseResponse(response, fallback) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result?.message || fallback);
    if (result?.code) error.code = result.code;
    if (result?.details) error.details = result.details;
    throw error;
  }
  return result;
}

export async function getReviewChecklistDefinition() {
  const response = await fetchWithAuth(`${API_BASE_URL}/definition`, {
    method: 'GET',
    credentials: 'include',
  });
  const result = await parseResponse(response, 'Failed to load the review checklist.');
  return result?.definition || null;
}

export async function createReviewChecklistDefinitionVersion(payload) {
  const response = await fetchWithAuth(`${API_BASE_URL}/definition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const result = await parseResponse(response, 'Failed to save the review checklist.');
  return result?.definition || null;
}
