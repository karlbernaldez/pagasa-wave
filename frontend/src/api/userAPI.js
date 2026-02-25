const USER_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/users`;

/* -------------------------------------------------------
   Helper: parse JSON safely
------------------------------------------------------- */
const parseJSON = async (res) => {
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

/* -------------------------------------------------------
   GET ALL USERS (Admin)
------------------------------------------------------- */
export const fetchAllUsers = async () => {
  const res = await fetch(USER_API_BASE_URL, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  return parseJSON(res);
};

/* -------------------------------------------------------
   GET USER DETAILS
------------------------------------------------------- */
export const fetchUserDetails = async (userId) => {
  const res = await fetch(`${USER_API_BASE_URL}/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  return parseJSON(res);
};

/* -------------------------------------------------------
   UPDATE USER PROFILE (allowedFields only)
------------------------------------------------------- */
export const updateUserDetailsAPI = async (userId, payload) => {
  const res = await fetch(`${USER_API_BASE_URL}/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return parseJSON(res);
};

/* -------------------------------------------------------
   UPDATE USER STATUS
------------------------------------------------------- */
export const updateUserStatusAPI = async (userId, status) => {
  const res = await fetch(`${USER_API_BASE_URL}/${userId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });

  const data = await parseJSON(res);

  // backend returns { message, user }
  return data.user;
};

/* -------------------------------------------------------
   DELETE USER
------------------------------------------------------- */
export const deleteUserAPI = async (userId) => {
  const res = await fetch(`${USER_API_BASE_URL}/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  await parseJSON(res);
  return true;
};