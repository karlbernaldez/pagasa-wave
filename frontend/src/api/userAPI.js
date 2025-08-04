const USER_API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL}/api/users`;

// 📌 Get all users (Admin)
export const fetchAllUsers = async (token) => {
  const response = await fetch(`${USER_API_BASE_URL}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch users');
  }

  return response.json();
};

// 📌 Get user details by ID
export const fetchUserDetails = async (userId, token) => {
  const response = await fetch(`${USER_API_BASE_URL}/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user details');
  }

  return response.json();
};