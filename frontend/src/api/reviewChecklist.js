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


export async function getPackageReviewChecklist(packageId) {
  if (!packageId) throw new Error('Forecast Package id is required.');

  const response = await fetchWithAuth(`${API_BASE_URL}/packages/${packageId}`, {
    method: 'GET',
    credentials: 'include',
  });
  const result = await parseResponse(response, 'Failed to load package review checklist.');
  return result?.checklist || null;
}

export async function updatePackageReviewChecklistItem(
  packageId,
  itemId,
  { status, comment = '', version }
) {
  if (!packageId || !itemId) throw new Error('Forecast Package and checklist item ids are required.');

  const response = await fetchWithAuth(
    `${API_BASE_URL}/packages/${packageId}/items/${itemId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, comment, version }),
    }
  );

  return parseResponse(response, 'Failed to update the review checklist item.');
}
