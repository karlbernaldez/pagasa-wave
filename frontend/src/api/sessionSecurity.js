const AUTH_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

export async function logoutAllDevices() {
  const response = await fetch(`${AUTH_API_BASE_URL}/logout-all`, {
    method: 'POST',
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Failed to log out all devices.');
  }

  localStorage.removeItem('authToken');
  localStorage.removeItem('user');

  return data;
}
