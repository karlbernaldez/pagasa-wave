import Notification from "../models/Notification.js";

export const createNotification = async ({
  type,
  title,
  message,
  recipientUser = null,
  recipientRole = null,
  broadcast = false,
  resourceType = null,
  resourceId = null,
  metadata = {}
}) => {
  return Notification.create({
    type,
    title,
    message,
    recipientUser,
    recipientRole,
    broadcast,
    resourceType,
    resourceId,
    metadata
  });
};