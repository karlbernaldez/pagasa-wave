const USER_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/users`;

export const USER_UPDATED_EVENT = 'wavelab:user-updated';

function normalizeUserPayload(user) {
  if (!user || typeof user !== 'object') return user;
  return { ...user, id: user.id || user._id };
}

function broadcastUserUpdate(user) {
  if (typeof window === 'undefined' || !user) return;
  window.dispatchEvent(new CustomEvent(USER_UPDATED_EVENT, {
    detail: { user, updatedAt: Date.now() },
  }));
}

const request = async (url, options = {}) => {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ignore non-json responses */
  }

  if (!res.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

export const fetchAllUsers = ({ page = 1, limit = 10, search, status } = {}) => {
  const query = new URLSearchParams({ page, limit });
  if (search) query.set('search', search);
  if (status) query.set('status', status);
  return request(`${USER_API_BASE_URL}?${query}`, { method: 'GET' });
};

export const fetchUserDetails = async (userId) => {
  const user = await request(`${USER_API_BASE_URL}/${userId}`, { method: 'GET' });
  return normalizeUserPayload(user);
};

export const createUserAPI = async (payload) => {
  const data = await request(USER_API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    user: normalizeUserPayload(data.user),
    defaultPassword: data.defaultPassword,
    message: data.message,
  };
};

export const changePasswordAPI = (userId, { currentPassword, newPassword }) =>
  request(`${USER_API_BASE_URL}/${userId}/change-password`, {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

export const requestEmailChangeAPI = (userId, { newEmail, currentPassword }) =>
  request(`${USER_API_BASE_URL}/${userId}/email-change/request`, {
    method: 'POST',
    body: JSON.stringify({ newEmail, currentPassword }),
  });

export const resendEmailChangeAPI = (userId) =>
  request(`${USER_API_BASE_URL}/${userId}/email-change/resend`, {
    method: 'POST',
  });

export const cancelEmailChangeAPI = (userId) =>
  request(`${USER_API_BASE_URL}/${userId}/email-change`, {
    method: 'DELETE',
  });

export const updateUserDetailsAPI = async (userId, payload, { broadcast = true } = {}) => {
  const updated = normalizeUserPayload(await request(`${USER_API_BASE_URL}/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }));

  if (broadcast) broadcastUserUpdate(updated);
  return updated;
};

export const updateUserStatusAPI = async (userId, status) => {
  const data = await request(`${USER_API_BASE_URL}/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

  return normalizeUserPayload(data.user);
};

export const deleteUserAPI = async (userId) => {
  await request(`${USER_API_BASE_URL}/${userId}`, { method: 'DELETE' });
  return true;
};
