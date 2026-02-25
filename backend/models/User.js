import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({

  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },

  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },

  birthday: { type: Date, required: true },
  address: { type: String, required: true, trim: true },

  agency: {
    type: String,
    required: true,
    trim: true
  },

  position: { type: String, required: true, trim: true },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^\S+@\S+\.\S+$/,
    index: true
  },

  contact: {
    type: String,
    required: true,
    match: /^(\+63|0)9\d{9}$/
  },

  password: {
    type: String,
    required: true,
    select: false
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true
  },

  status: {
    type: String,
    enum: [
      'pending',
      'active',
      'locked',
      'suspended',
      'inactive'
    ],
    default: 'pending',
    index: true
  },

  failedLoginAttempts: {
    type: Number,
    default: 0,
    min: 0
  },

  lockUntil: {
    type: Date,
    default: null,
    index: true
  },

  lastLogin: {
    type: Date,
    default: null,
    index: true
  },

}, { timestamps: true });

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model('User', userSchema);