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
    metadata: { type: Schema.Types.Mixed, default: {} },

    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  },
);

notificationSchema.index({ recipientUser: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, createdAt: -1 });
notificationSchema.index({ broadcast:     1, createdAt: -1 });
notificationSchema.index({ readBy: 1 });
notificationSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default model('Notification', notificationSchema);
