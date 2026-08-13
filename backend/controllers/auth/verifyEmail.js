import crypto from 'crypto';
import User from '../../models/User.js';
import { createAuditLog } from '#services/auditLog';
import { logger } from '#utils/logger';

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message: 'Verification token missing.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOneAndUpdate(
      {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: new Date() },
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

    if (!user) {
      await createAuditLog({
        user: null,
        action: 'email_verification_failed',
        resourceType: 'User',
        resourceId: null,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        meta: { reason: 'Invalid or expired token' },
      }).catch((e) => logger.error('Audit log failed', { error: e.message }));

      return res.status(400).json({
        message: 'Invalid or expired verification token.',
      });
    }

    logger.info('Email successfully verified', { userId: user._id });

    await createAuditLog({
      user: user._id,
      action: 'email_verified',
      resourceType: 'User',
      resourceId: user._id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch((e) => logger.error('Audit log failed', { error: e.message }));

    return res.json({
      message: 'Email successfully verified. You may now log in.',
    });
  } catch (err) {
    logger.error('Email verification error', { error: err.message });

    return res.status(500).json({
      message: 'Email verification failed.',
    });
  }
};
