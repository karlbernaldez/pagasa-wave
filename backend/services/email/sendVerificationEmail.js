import { transporter, FROM_ADDRESS, APP_NAME, APP_URL, EMAIL_USER, NODE_ENV } from './mailer.config.js';

const buildEmailTemplate = ({ title, preheader, body, ctaText, ctaUrl }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f6f8fa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌
  </div>

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:#f6f8fa;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

          <!-- Header accent bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#0ea5e9 0%,#6366f1 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Logo / Brand -->
          <tr>
            <td align="center" style="padding:40px 48px 32px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#0ea5e9,#6366f1);border-radius:12px;padding:10px 14px;">
                    <svg width="28" height="18" viewBox="0 0 28 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 9 C4 3, 7 3, 10 9 S16 15, 19 9 S25 3, 27 9"
                            stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                    </svg>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">
                      Wave<span style="background:linear-gradient(90deg,#0ea5e9,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Lab</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 48px;">
              <div style="height:1px;background-color:#e2e8f0;font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding:40px 48px;">
              ${body}
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 48px 40px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#0ea5e9,#6366f1);border-radius:8px;">
                    <a href="${ctaUrl}"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td align="center" style="padding:0 48px 24px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                Button not working? Copy and paste this link into your browser:<br/>
                <a href="${ctaUrl}" style="color:#0ea5e9;word-break:break-all;text-decoration:none;">
                  ${ctaUrl}
                </a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 48px;">
              <div style="height:1px;background-color:#e2e8f0;font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 48px 36px;">
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                You're receiving this email because you signed up for ${APP_NAME}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const sendVerificationEmail = async (email, username, token) => {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  const html = buildEmailTemplate({
    title:      `Verify your ${APP_NAME} email`,
    preheader:  `Hi ${username}, please verify your email address to activate your ${APP_NAME} account.`,
    ctaText:    'Verify Email Address',
    ctaUrl:     verifyUrl,
    body: `
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">
        Verify your email
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;letter-spacing:0.5px;text-transform:uppercase;font-weight:500;">
        Account Activation
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">
        Hi <strong style="color:#0f172a;">${username}</strong>,
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">
        Thanks for signing up for ${APP_NAME}! To get started, please verify your
        email address by clicking the button below.
      </p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0;">
        <tr>
          <td style="background-color:#f8fafc;border-left:3px solid #0ea5e9;border-radius:4px;padding:14px 18px;">
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
              ⏱ &nbsp;This link expires in <strong style="color:#0f172a;">1 hour</strong>.
              If it expires, you can request a new one from the login page.
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
        If you didn't create a ${APP_NAME} account, you can safely ignore this email —
        no action is required.
      </p>
    `,
  });

  await transporter.sendMail({
    from:    FROM_ADDRESS,
    to:      email,
    subject: `Verify your ${APP_NAME} email address`,
    html,
  });
};