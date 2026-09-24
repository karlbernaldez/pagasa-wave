import { fetchWithAuth } from './auth';

const CALENDAR_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/calendar`;

async function parseResponse(response, fallback) {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || fallback);
  return data;
}

export async function fetchCalendarEvents({ start, end, signal } = {}) {
  if (!start || !end) throw new Error('start and end are required');
  const params = new URLSearchParams({ start, end });
  const response = await fetchWithAuth(`${CALENDAR_API_BASE_URL}?${params}`, { signal });
  return parseResponse(response, 'Failed to load calendar events');
}

export async function createCalendarEvent(payload) {
  const response = await fetchWithAuth(CALENDAR_API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response, 'Failed to create calendar event');
}

export async function updateCalendarEvent(id, payload) {
  const response = await fetchWithAuth(`${CALENDAR_API_BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response, 'Failed to update calendar event');
}

export async function deleteCalendarEvent(id) {
  const response = await fetchWithAuth(`${CALENDAR_API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Failed to delete calendar event');
  }
}
