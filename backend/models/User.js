// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  birthday: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  agency: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  contact: {
    type: String,
    required: true,
    match: /^[0-9]{10,15}$/
  },
  password: {
    type: String,
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending Approval'],
  },
  lastLogin: {
    type: Date,
    default: null
  },
});

const User = mongoose.model('User', userSchema);
export default User;
