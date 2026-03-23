export const getUserInitials = (firstName, lastName, username) => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  if (username) {
    return username.slice(0, 2).toUpperCase();
  }

  return 'U';
};

export const getFullName = (firstName, lastName, username) => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return username || 'User';
};

export const fetchUserDetails = async (userId) => (
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        role: 'admin',
      });
    }, 500);
  })
);

export const logoutUser = async () => {
  console.log('User logged out');
};