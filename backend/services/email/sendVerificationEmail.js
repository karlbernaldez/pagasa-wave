import { transporter, FROM_ADDRESS, APP_NAME, APP_URL } from './mailer.config.js';

const buildEmailTemplate = ({ title, preheader, body, ctaText, ctaUrl }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f8fa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f8fa;min-height:100vh;">
    <tr><td align="center" style="padding:48px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(90deg,#0ea5e9 0%,#6366f1 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:40px 48px 32px;"><span style="font-size:22px;font-weight:700;color:#0f172a;">${APP_NAME}</span></td></tr>
        <tr><td style="padding:0 48px;"><div style="height:1px;background-color:#e2e8f0;">&nbsp;</div></td></tr>
        <tr><td style="padding:40px 48px;">${body}</td></tr>
        <tr><td align="center" style="padding:0 48px 40px;"><a href="${ctaUrl}" style="display:inline-block;padding:14px 36px;background:#0ea5e9;border-radius:8px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${ctaText}</a></td></tr>
        <tr><td align="center" style="padding:0 48px 24px;"><p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">Button not working? Copy and paste this link into your browser:<br/><a href="${ctaUrl}" style="color:#0ea5e9;word-break:break-all;text-decoration:none;">${ctaUrl}</a></p></td></tr>
        <tr><td style="padding:0 48px;"><div style="height:1px;background-color:#e2e8f0;">&nbsp;</div></td></tr>
        <tr><td align="center" style="padding:28px 48px 36px;"><p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

export const sendVerificationEmail = async (email, username, token) => {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  const html = buildEmailTemplate({
    title: `Verify your ${APP_NAME} email`,
    preheader: `Hi ${username}, please verify your email address to activate your ${APP_NAME} account.`,
    ctaText: 'Verify Email Address',
    ctaUrl: verifyUrl,
    body: `
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#0f172a;">Verify your email</h1>
      <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">Hi <strong>${username}</strong>,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">Thanks for signing up for ${APP_NAME}. Click the button below to verify your email address.</p>
      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">This link expires in <strong>1 hour</strong>.</p>
    `,
  });

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: email,
    subject: `Verify your ${APP_NAME} email address`,
    html,
  });
};
