import bcrypt from 'bcryptjs';
import crypto from "crypto";

import User from '../../models/User.js';

import { normalizeEmail, normalizeUsername, validateRegistrationPayload } from '#controllers/auth/utils/validators';

import { createNotification } from "#services/notification/notificationService";
import { sendVerificationEmail } from "#services/email/sendVerificationEmail";
import { createAuditLog } from "#services/auditLog";
import { logger } from "#utils/logger";

export const registerUser = async (req, res) => {

  try {

    logger.info("User registration attempt", {
      email: req.body.email,
      ip: req.ip
    });

    const validation = validateRegistrationPayload(req.body);

    if (!validation.ok) {

      logger.warn("Registration validation failed", {
        reason: validation.message,
        ip: req.ip
      });

      return res.status(400).json({ message: validation.message });
    }

    const {
      firstName,
      lastName,
      username,
      email,
      contact,
      password,
      address,
      agency,
      position,
      birthday
    } = req.body;

    const emailNorm = normalizeEmail(email);
    const usernameNorm = normalizeUsername(username);

    const [existingUsername, existingEmail] = await Promise.all([
      User.findOne({ username: usernameNorm }).select('_id').lean(),
      User.findOne({ email: emailNorm }).select('_id').lean(),
    ]);

    if (existingUsername) {

      logger.warn("Duplicate username registration attempt", {
        username: usernameNorm,
        ip: req.ip
      });

      return res.status(409).json({ message: 'Username already exists.' });
    }

    if (existingEmail) {

      logger.warn("Duplicate email registration attempt", {
        email: emailNorm,
        ip: req.ip
      });

      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    /*
      🔐 Generate verification token
    */
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: usernameNorm,
      email: emailNorm,
      contact: contact.trim(),
      password: hashedPassword,
      address: address.trim(),
      agency: agency.trim(),
      position: position.trim(),
      birthday: new Date(birthday),

      status: 'pending',
      role: 'user',

      emailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: Date.now() + 1000 * 60 * 60, // 1 hour

      failedLoginAttempts: 0,
      lockUntil: null,
      lastLogin: null,
    });

    logger.info("User successfully registered", {
      userId: user._id,
      email: user.email
    });

    /*
      🔐 Audit Log
    */
    await createAuditLog({
      user: user._id,
      action: "user_registered",
      resourceType: "User",
      resourceId: user._id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    /*
      📧 Send verification email
    */
    try {

      await sendVerificationEmail(
        user.email,
        user.firstName,
        verificationToken
      );

    } catch (mailErr) {

      logger.error("Verification email failed", {
        error: mailErr.message
      });

    }

    /*
      🔔 Admin notification
    */
    try {
      await createNotification({
        type: "user_registered",
        title: "New User Awaiting Approval",
        message: `${user.firstName} ${user.lastName} registered and is awaiting approval.`,
        recipientRole: "admin",
        resourceType: "User",
        resourceId: user._id
      });
      console.log('[register] ✅ createNotification succeeded'); // ← add
    } catch (notifErr) {

      logger.error("Notification creation failed", {
        error: notifErr.message
      });

    }

    return res.status(201).json({
      message: 'Account created. Please verify your email.'
    });

  } catch (err) {

    logger.error("Registration controller error", {
      error: err.message,
      stack: err.stack
    });

    return res.status(500).json({
      message: 'Server error. Please try again later.'
    });

  }
};