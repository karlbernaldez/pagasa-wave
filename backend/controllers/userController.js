import User from '../models/User.js';
import moment from 'moment';

// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {

    const users = await User.find()
      .select('username firstName lastName contact email agency role position status lastLogin createdAt')
      .lean();

    const formattedUsers = users.map(u => ({
      id: u._id,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      contact: u.contact,
      email: u.email,
      agency: u.agency,
      role: u.role,
      position: u.position,
      status: u.status,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt
    }));

    res.status(200).json(formattedUsers);

  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};

// Get user details
export const getUserDetails = async (req, res) => {
  const { userId } = req.params;

  try {

    const user = await User.findById(userId)
      .select('username firstName lastName birthday address agency position email contact role status createdAt lastLogin')
      .lean();

    if (!user)
      return res.status(404).json({ message: 'User not found' });

    user.id = user._id;
    delete user._id;

    res.status(200).json(user);

  } catch (err) {
    res.status(500).json({ message: 'Error fetching user details', error: err.message });
  }
};

// Update user details
export const updateUserDetails = async (req, res) => {
  const { userId } = req.params;

  const allowedFields = [
    'username', 'firstName', 'lastName', 'email',
    'agency', 'position', 'contact', 'address', 'birthday'
  ];

  const updates = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined)
      updates[field] = req.body[field];
  });

  try {

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser)
      return res.status(404).json({ message: 'User not found' });

    res.status(200).json(updatedUser);

  } catch (err) {
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
};

// Approve user
export const updateUserStatus = async (req, res) => {

  const { userId } = req.params;
  const { status } = req.body;

  const allowed = [
    'Pending Approval',
    'Active',
    'Locked',
    'Suspended',
    'Inactive'
  ];

  if (!allowed.includes(status))
    return res.status(400).json({ message: 'Invalid status' });

  try {

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-password');

    if (!user)
      return res.status(404).json({ message: 'User not found' });

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: 'Error updating status', error: err.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
};
