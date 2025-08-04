import User from '../models/User.js';
import moment from 'moment';

// Get all users (for admin dashboard)
export const getAllUsers = async (req, res) => {
    try {
        // Only select the fields you want
        const users = await User.find().select('_id username firstName lastName email agency role position isApproved lastLogin');

        const formattedUsers = users.map(user => ({
            ...user.toObject(),
            lastLogin: user.lastLogin ? moment(user.lastLogin).fromNow() : 'Never'
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
        const user = await User.findById(userId).select('_id firstName lastName birthday address agency position email contact role username');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user details', error: err.message });
    }
};

// Update user details
export const updateUserDetails = async (req, res) => {
    const { userId } = req.params;
    const { username, firstName, lastName, email } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username, firstName, lastName, email },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: 'Error updating user details', error: err.message });
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
