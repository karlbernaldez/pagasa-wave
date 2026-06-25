const USER_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/users`;

export const USER_UPDATED_EVENT = 'wavelab:user-updated';

function broadcastUserUpdate(user) {
  if (typeof window === 'undefined' || !user) return;

  window.dispatchEvent(new CustomEvent(USER_UPDATED_EVENT, {
    detail: { user, updatedAt: Date.now() },
  }));
}

/* -------------------------------------------------------
   Common request helper
------------------------------------------------------- */
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

/* -------------------------------------------------------
   GET ALL USERS (Admin) - paginated + filtered
   
   Params:
     page    - page number       (default 1)
     limit   - rows per page     (default 10)
     search  - text search       (optional)
     status  - filter by status  (optional)

   Returns: { data: User[], total, page, limit, totalPages }
------------------------------------------------------- */
export const fetchAllUsers = ({ page = 1, limit = 10, search, status } = {}) => {
  const query = new URLSearchParams({ page, limit });
  if (search) query.set('search', search);
  if (status) query.set('status', status);

  return request(`${USER_API_BASE_URL}?${query}`, { method: 'GET' });
};

/* -------------------------------------------------------
   GET USER DETAILS
------------------------------------------------------- */
export const fetchUserDetails = (userId) =>
  request(`${USER_API_BASE_URL}/${userId}`, { method: 'GET' });

/* -------------------------------------------------------
   CREATE USER (Admin)
------------------------------------------------------- */
export const createUserAPI = async (payload) => {
  const data = await request(USER_API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  // backend returns: { message, user, defaultPassword }
  return {
    user: data.user,
    defaultPassword: data.defaultPassword,
    message: data.message,
  };
};

export const changePasswordAPI = (userId, { currentPassword, newPassword }) =>
  request(`${USER_API_BASE_URL}/${userId}/change-password`, {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

/* -------------------------------------------------------
   UPDATE USER PROFILE (allowedFields only)
------------------------------------------------------- */
export const updateUserDetailsAPI = async (userId, payload) => {
  const updated = await request(`${USER_API_BASE_URL}/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  broadcastUserUpdate(updated);
  return updated;
};

/* -------------------------------------------------------
   UPDATE USER STATUS
------------------------------------------------------- */
export const updateUserStatusAPI = async (userId, status) => {
  const data = await request(`${USER_API_BASE_URL}/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

  return data.user; // backend returns { message, user }
};

/* -------------------------------------------------------
   DELETE USER
------------------------------------------------------- */
export const deleteUserAPI = async (userId) => {
  await request(`${USER_API_BASE_URL}/${userId}`, {
    method: 'DELETE',
  });

  return true;
};
