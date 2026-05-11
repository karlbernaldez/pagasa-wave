import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    type: { type: String, required: true, trim: true },

    title:   { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    recipientUser: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    recipientRole: { type: String,                              default: null, index: true },
    broadcast:     { type: Boolean,                            default: false, index: true },

    actorUser: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    resourceType: { type: String },
    resourceId:   { type: Schema.Types.ObjectId },
    resourcePath: { type: String, trim: true, default: '' },

    projectName: { type: String, trim: true, default: '' },

    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Primary query pattern: visibility filter + sort by newest
notificationSchema.index({ recipientUser: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, createdAt: -1 });
notificationSchema.index({ broadcast:     1, createdAt: -1 });

// Unread-count query: filter readBy array efficiently
notificationSchema.index({ readBy: 1 });

// Useful for project-related notification lookups/deduping later.
notificationSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

// Optional: auto-delete very old notifications (e.g. after 90 days).
// Remove or adjust the `expireAfterSeconds` value to suit your retention policy.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default model('Notification', notificationSchema);