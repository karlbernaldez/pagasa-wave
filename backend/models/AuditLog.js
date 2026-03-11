import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  action: {
    type: String,
    required: true
  },

  resourceType: {
    type: String
  },

  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },

  details: {
    type: Object,
    default: {}
  },

  ipAddress: String,

  userAgent: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model("AuditLog", auditLogSchema);