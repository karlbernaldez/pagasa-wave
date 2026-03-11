import crypto from "crypto";
import User from "../../models/User.js";
import { createAuditLog } from "#services/auditLog";
import { logger } from "#utils/logger";

export const verifyEmail = async (req, res) => {

  try {

    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message: "Verification token missing."
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      // Audit failed attempt — token was invalid or expired
      await createAuditLog({
        user:         null,
        action:       "email_verification_failed",
        resourceType: "User",
        resourceId:   null,
        ip:           req.ip,
        userAgent:    req.headers['user-agent'],
        meta:         { reason: "Invalid or expired token" }
      }).catch((e) => logger.error("Audit log failed", { error: e.message }));

      return res.status(400).json({
        message: "Invalid or expired verification token."
      });
    }

    user.emailVerified           = true;
    user.emailVerificationToken  = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    logger.info("Email successfully verified", { userId: user._id });

    // Audit successful verification
    await createAuditLog({
      user:         user._id,
      action:       "email_verified",
      resourceType: "User",
      resourceId:   user._id,
      ip:           req.ip,
      userAgent:    req.headers['user-agent'],
    }).catch((e) => logger.error("Audit log failed", { error: e.message }));

    return res.json({
      message: "Email successfully verified. You may now log in."
    });

  } catch (err) {

    logger.error("Email verification error", { error: err.message });

    return res.status(500).json({
      message: "Email verification failed."
    });

  }

};