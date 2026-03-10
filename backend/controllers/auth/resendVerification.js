import crypto from "crypto";
import User from "../../models/User.js";
import { sendVerificationEmail } from "#services/email/sendVerificationEmail";
import { createAuditLog } from "#services/auditLog";
import { logger } from "#utils/logger";

// ── In-process rate limit: max 3 resends per email per 10 minutes ──────────
// Replace with Redis/upstash in production for multi-instance safety.
const resendMap = new Map(); // email → { count, windowStart }
const MAX_RESENDS = 3;
const WINDOW_MS   = 10 * 60 * 1_000;

const checkResendRateLimit = (email) => {
  const now    = Date.now();
  const record = resendMap.get(email);

  if (!record || now - record.windowStart > WINDOW_MS) {
    resendMap.set(email, { count: 1, windowStart: now });
    return false;
  }

  if (record.count >= MAX_RESENDS) return true;

  record.count += 1;
  return false;
};

// ── Generic success message — prevents email enumeration ──────────────────
const GENERIC_OK = "If that email exists and is unverified, a new link has been sent.";

export const resendVerification = async (req, res) => {
  const email = (req.body?.email ?? "").toLowerCase().trim();

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  // ── Rate limit ───────────────────────────────────────────────────────────
  if (checkResendRateLimit(email)) {
    logger.warn("Resend verification rate limited", { email, ip: req.ip });
    return res.status(429).json({
      message: "Too many resend requests. Please wait a few minutes before trying again.",
    });
  }

  try {
    const user = await User.findOne({ email, deletedAt: null }).select(
      "email firstName emailVerified emailVerificationToken emailVerificationExpires"
    );

    // Return 200 even for unknown / already-verified emails (enumeration guard)
    if (!user || user.emailVerified) {
      return res.status(200).json({ message: GENERIC_OK });
    }

    // ── Generate a fresh verification token ────────────────────────────────
    // createEmailVerificationToken() should: generate a random raw token,
    // store its sha256 hash + an expiry on the document, and return the raw token.
    if (typeof user.createEmailVerificationToken !== "function") {
      logger.error("createEmailVerificationToken method missing on User model");
      return res.status(500).json({ message: "Server error. Please try again." });
    }

    const rawToken = user.createEmailVerificationToken(); // sets hash + expiry on user
    await user.save();

    // ── Send the email — propagate failures so the client knows ───────────
    await sendVerificationEmail(user.email, user.firstName, rawToken);

    logger.info("Verification email resent", { userId: user._id, ip: req.ip });

    // Fire-and-forget audit log — never block the response on it
    createAuditLog({
      user:         user._id,
      action:       "email_verification_resent",
      resourceType: "User",
      resourceId:   user._id,
      ip:           req.ip,
      userAgent:    req.headers["user-agent"],
    }).catch((e) => logger.error("Audit log failed", { error: e.message }));

    return res.status(200).json({ message: GENERIC_OK });

  } catch (err) {
    // Distinguish mail errors from other server errors for better observability
    const isMailError = err.code === "ECONNREFUSED"
      || err.code === "EAUTH"
      || err.responseCode >= 400;

    logger.error(isMailError ? "Resend verification mail error" : "Resend verification error", {
      error:   err.message,
      code:    err.code,
      email,
      ip:      req.ip,
    });

    return res.status(500).json({
      message: isMailError
        ? "Failed to send email. Please check your inbox again shortly."
        : "Server error. Please try again.",
    });
  }
};