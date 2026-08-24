import { transporter, FROM_ADDRESS, APP_NAME, APP_URL, SUPPORT_EMAIL } from './mailer.config.js';
import { buildVerificationUrl } from './verificationUrl.js';

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const sendEmailChangeVerificationEmail = async ({ email, firstName, token }) => {
  const verifyUrl = buildVerificationUrl(APP_URL, token);
  const safeName = escapeHtml(firstName || 'there');

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: email,
    subject: `Confirm your new ${APP_NAME} email address`,
    text: [
      `Hi ${firstName || 'there'},`,
      '',
      `You requested to use ${email} as the email address for your ${APP_NAME} account.`,
      'Confirm this address using the link below. Your current email remains active until confirmation succeeds.',
      '',
      verifyUrl,
      '',
      'This link expires in 1 hour. If you did not request this change, ignore this message and contact support.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;line-height:1.6">
        <h2>Confirm your new email address</h2>
        <p>Hi <strong>${safeName}</strong>,</p>
        <p>You requested to use <strong>${escapeHtml(email)}</strong> as the email address for your ${APP_NAME} account.</p>
        <p>Your current email remains active until this address is confirmed.</p>
        <p style="margin:28px 0"><a href="${verifyUrl}" style="background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600">Confirm new email</a></p>
        <p style="font-size:13px;color:#64748b">This link expires in 1 hour. If you did not request this change, ignore this message and contact ${escapeHtml(SUPPORT_EMAIL)}.</p>
        <p style="font-size:12px;color:#94a3b8;word-break:break-all">${verifyUrl}</p>
      </div>
    `,
  });
};

export const sendEmailChangeSecurityNotice = async ({ email, firstName, pendingEmail }) => {
  const safeName = escapeHtml(firstName || 'there');
  const safePendingEmail = escapeHtml(pendingEmail);

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: email,
    subject: `${APP_NAME} email change requested`,
    text: [
      `Hi ${firstName || 'there'},`,
      '',
      `A request was made to change your ${APP_NAME} account email to ${pendingEmail}.`,
      'Your current email is still active and the change will not take effect until the new address is verified.',
      '',
      `If this was not you, change your password and contact ${SUPPORT_EMAIL} immediately.`,
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;line-height:1.6">
        <h2>Email change requested</h2>
        <p>Hi <strong>${safeName}</strong>,</p>
        <p>A request was made to change your ${APP_NAME} account email to <strong>${safePendingEmail}</strong>.</p>
        <p>Your current email is still active. The change will not take effect until the new address is verified.</p>
        <p>If this was not you, change your password and contact <strong>${escapeHtml(SUPPORT_EMAIL)}</strong> immediately.</p>
      </div>
    `,
  });
};
