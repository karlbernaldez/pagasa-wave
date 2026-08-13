import crypto from 'crypto';
import User from '../../models/User.js';
import { clearAuthCookies } from '#controllers/auth/utils/cookies';
import { createAuditLog } from '#services/auditLog';
import { logger } from '#utils/logger';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const writeAudit = (payload) =>
  createAuditLog(payload).catch((e) => logger.error('Audit log failed', { error: e.message }));

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message: 'Verification token missing.',
      });
    }

    const hashedToken = hashToken(token);
    const now = new Date();

    const registrationUser = await User.findOneAndUpdate(
      {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: now },
        emailVerified: false,
        deletedAt: null,
      },
      {
        $set: { emailVerified: true },
        $unset: {
          emailVerificationToken: '',
          emailVerificationExpires: '',
        },
      },
      { new: true }
    );

    if (registrationUser) {
      logger.info('Email successfully verified', { userId: registrationUser._id });

      writeAudit({
        user: registrationUser._id,
        action: 'email_verified',
        resourceType: 'User',
        resourceId: registrationUser._id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        kind: 'registration',
        email: registrationUser.email,
        message: 'Email successfully verified. You may now log in.',
      });
    }

    const pending = await User.findOne({
      pendingEmailVerificationToken: hashedToken,
      pendingEmailVerificationExpires: { $gt: now },
      pendingEmail: { $exists: true, $ne: null },
      status: 'active',
      deletedAt: null,
    })
      .select('_id email pendingEmail')
      .lean();

    if (pending?.pendingEmail) {
      try {
        const promoted = await User.findOneAndUpdate(
          {
            _id: pending._id,
            email: pending.email,
            pendingEmail: pending.pendingEmail,
            pendingEmailVerificationToken: hashedToken,
            pendingEmailVerificationExpires: { $gt: now },
            status: 'active',
            deletedAt: null,
          },
          {
            $set: {
              email: pending.pendingEmail,
              emailVerified: true,
            },
            $unset: {
              pendingEmail: '',
              pendingEmailVerificationToken: '',
              pendingEmailVerificationExpires: '',
              pendingEmailRequestedAt: '',
              emailVerificationToken: '',
              emailVerificationExpires: '',
              passwordResetToken: '',
              passwordResetExpires: '',
            },
            $inc: { sessionVersion: 1 },
          },
          { new: true, runValidators: true }
        ).select('email');

        if (promoted) {
          logger.info('Pending email successfully promoted', { userId: promoted._id });

          writeAudit({
            user: promoted._id,
            action: 'email_change_verified',
            resourceType: 'User',
            resourceId: promoted._id,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          });

          clearAuthCookies(res);
          return res.json({
            kind: 'email_change',
            email: promoted.email,
            sessionRevoked: true,
            message: 'Your new email address is verified. Please sign in again with the new email.',
          });
        }
      } catch (error) {
        if (error?.code === 11000) {
          return res.status(409).json({
            message: 'That email address is no longer available. Request a different email change.',
          });
        }
        throw error;
      }
    }

    writeAudit({
      user: null,
      action: 'email_verification_failed',
      resourceType: 'User',
      resourceId: null,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { reason: 'Invalid or expired token' },
    });

    return res.status(400).json({
      message: 'Invalid or expired verification token.',
    });
  } catch (err) {
    logger.error('Email verification error', { error: err.message });

    return res.status(500).json({
      message: 'Email verification failed.',
    });
  }
};
