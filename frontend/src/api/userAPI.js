const USER_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/users`;

// 📌 Get all users (Admin)
export const fetchAllUsers = async (token) => {
  const response = await fetch(`${USER_API_BASE_URL}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch users');
  }

  return response.json();
};

// 📌 Get user details by ID
export const fetchUserDetails = async (userId) => {
  const response = await fetch(`${USER_API_BASE_URL}/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user details');
  }

  return response.json();
};