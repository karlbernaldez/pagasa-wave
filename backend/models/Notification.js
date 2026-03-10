import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true },

  title: { type: String, required: true },

  message: { type: String, required: true },

  recipientUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  recipientRole: {
    type: String,
    default: null
  },

  broadcast: {
    type: Boolean,
    default: false
  },

  resourceType: String,
  resourceId: mongoose.Schema.Types.ObjectId,

  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Notification", notificationSchema);