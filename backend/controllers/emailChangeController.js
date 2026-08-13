import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import User from '../models/User.js';
import { sendEmailChangeSecurityNotice, sendEmailChangeVerificationEmail } from '#services/email/sendEmailChangeEmails';
import { createAuditLog } from '#services/auditLog';
import { logger } from '#utils/logger';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_CHANGE_TTL_MS = 60 * 60_000;

const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const createRawToken = () => crypto.randomBytes(32).toString('hex');

const audit = (payload) =>
  createAuditLog(payload).catch((error) =>
    logger.error('Email change audit log failed', { error: error.message })
  );

export const requestEmailChange = async (req, res) => {
  const userId = req.params.userId;
  const newEmail = normalizeEmail(req.body?.newEmail);
  const currentPassword = req.body?.currentPassword;

  if (!newEmail || !EMAIL_RE.test(newEmail)) {
    return res.status(400).json({ message: 'Enter a valid new email address.' });
  }

  if (!currentPassword) {
    return res.status(400).json({ message: 'Current password is required to change email.' });
  }

  try {
    const user = await User.findOne({ _id: userId, deletedAt: null })
      .select('+password email firstName pendingEmail')
      .lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (newEmail === user.email) {
      return res.status(400).json({ message: 'New email must be different from your current email.' });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatches) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    const conflict = await User.findOne({
      _id: { $ne: userId },
      deletedAt: null,
      $or: [{ email: newEmail }, { pendingEmail: newEmail }],
    })
      .select('_id')
      .lean();

    if (conflict) {
      return res.status(409).json({ message: 'That email address is already in use.' });
    }

    const rawToken = createRawToken();
    const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TTL_MS);

    const updated = await User.findOneAndUpdate(
      {
        _id: userId,
        deletedAt: null,
        email: user.email,
        password: user.password,
      },
      {
        $set: {
          pendingEmail: newEmail,
          pendingEmailVerificationToken: hashToken(rawToken),
          pendingEmailVerificationExpires: expiresAt,
          pendingEmailRequestedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    ).select('email firstName pendingEmail pendingEmailVerificationExpires');

    if (!updated) {
      return res.status(409).json({
        message: 'Your account changed while this request was being processed. Reload and try again.',
      });
    }

    try {
      await sendEmailChangeVerificationEmail({
        email: updated.pendingEmail,
        firstName: updated.firstName,
        token: rawToken,
      });
    } catch (error) {
      logger.error('Email change verification delivery failed', {
        userId,
        error: error.message,
      });
      return res.status(502).json({
        message: 'Email change saved, but the verification email could not be sent. Please resend it.',
        pendingEmail: updated.pendingEmail,
      });
    }

    sendEmailChangeSecurityNotice({
      email: updated.email,
      firstName: updated.firstName,
      pendingEmail: updated.pendingEmail,
    }).catch((error) =>
      logger.error('Email change security notice failed', { userId, error: error.message })
    );

    audit({
      user: userId,
      action: 'email_change_requested',
      resourceType: 'User',
      resourceId: userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      meta: { pendingEmail: updated.pendingEmail },
    });

    return res.status(202).json({
      message: 'Verification sent to your new email. Your current email remains active until confirmed.',
      email: updated.email,
      pendingEmail: updated.pendingEmail,
      pendingEmailVerificationExpires: updated.pendingEmailVerificationExpires,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'That email address is already in use.' });
    }

    logger.error('Email change request failed', { userId, error: error.message });
    return res.status(500).json({ message: 'Unable to start email change.' });
  }
};

export const resendPendingEmailChange = async (req, res) => {
  const userId = req.params.userId;

  try {
    const current = await User.findOne({
      _id: userId,
      deletedAt: null,
      pendingEmail: { $exists: true, $ne: null },
    })
      .select('email firstName pendingEmail')
      .lean();

    if (!current?.pendingEmail) {
      return res.status(404).json({ message: 'No pending email change found.' });
    }

    const rawToken = createRawToken();
    const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TTL_MS);

    const updated = await User.findOneAndUpdate(
      { _id: userId, deletedAt: null, pendingEmail: current.pendingEmail },
      {
        $set: {
          pendingEmailVerificationToken: hashToken(rawToken),
          pendingEmailVerificationExpires: expiresAt,
          pendingEmailRequestedAt: new Date(),
        },
      },
      { new: true }
    ).select('firstName pendingEmail pendingEmailVerificationExpires');

    if (!updated) {
      return res.status(409).json({ message: 'Pending email changed concurrently. Reload and try again.' });
    }

    await sendEmailChangeVerificationEmail({
      email: updated.pendingEmail,
      firstName: updated.firstName,
      token: rawToken,
    });

    audit({
      user: userId,
      action: 'email_change_verification_resent',
      resourceType: 'User',
      resourceId: userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      message: 'Verification email resent.',
      pendingEmail: updated.pendingEmail,
      pendingEmailVerificationExpires: updated.pendingEmailVerificationExpires,
    });
  } catch (error) {
    logger.error('Pending email resend failed', { userId, error: error.message });
    return res.status(500).json({ message: 'Unable to resend verification email.' });
  }
};

export const cancelPendingEmailChange = async (req, res) => {
  const userId = req.params.userId;

  try {
    const updated = await User.findOneAndUpdate(
      { _id: userId, deletedAt: null, pendingEmail: { $exists: true } },
      {
        $unset: {
          pendingEmail: '',
          pendingEmailVerificationToken: '',
          pendingEmailVerificationExpires: '',
          pendingEmailRequestedAt: '',
        },
      },
      { new: true }
    ).select('email');

    if (!updated) {
      return res.status(404).json({ message: 'No pending email change found.' });
    }

    audit({
      user: userId,
      action: 'email_change_cancelled',
      resourceType: 'User',
      resourceId: userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({ message: 'Pending email change cancelled.', email: updated.email });
  } catch (error) {
    logger.error('Pending email cancellation failed', { userId, error: error.message });
    return res.status(500).json({ message: 'Unable to cancel pending email change.' });
  }
};
