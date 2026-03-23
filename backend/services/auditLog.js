import AuditLog from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

export const createAuditLog = async ({
  user = null,
  action,
  resourceType = null,
  resourceId = null,
  details = {},
  ip = null,
  userAgent = null
}) => {

  try {

    await AuditLog.create({
      user,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: ip,
      userAgent,
      createdAt: new Date()
    });

  } catch (err) {

    logger.error("Audit log creation failed", {
      error: err.message,
      action,
      resourceType,
      resourceId
    });

  }

};