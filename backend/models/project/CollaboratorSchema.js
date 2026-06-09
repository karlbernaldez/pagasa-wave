import mongoose from 'mongoose';

const { Schema } = mongoose;

export const CollaboratorSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    role: {
      type: String,
      enum: ['editor', 'viewer'],
      default: 'editor',
    },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    pending: {
      type: Boolean,
      default: true,
    },

    invitedAt: {
      type: Date,
      default: Date.now,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);