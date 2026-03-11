import nodemailer from 'nodemailer';

const {
  EMAIL_HOST    = 'smtp.hostinger.com',
  EMAIL_PORT    = '465',
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  APP_NAME      = 'WaveLab',
  APP_URL       = 'https://wavelab.adovelopers.com',
  SUPPORT_EMAIL = 'support@adovelopers.com',
  NODE_ENV,
} = process.env;

if (NODE_ENV === 'production' && (!EMAIL_USER || !EMAIL_PASS)) {
  throw new Error('[sendOtpEmail] EMAIL_USER and EMAIL_PASS must be set in production.');
}

const transporter = nodemailer.createTransport({
  host:              EMAIL_HOST,
  port:              parseInt(EMAIL_PORT, 10),
  secure:            true,
  auth:              { user: EMAIL_USER, pass: EMAIL_PASS },
  connectionTimeout: 10_000,
  greetingTimeout:   10_000,
});

const OTP_EXPIRY_MINUTES = 5;
const FROM_ADDRESS       = EMAIL_FROM ?? `${APP_NAME} <${EMAIL_USER}>`;
const YEAR               = new Date().getFullYear();

const buildOtpEmail = (otp, username = 'there') => {
  const digits    = otp.toString().split('');
  const firstName = username.split(' ')[0];

  // ── Digit cell renderer ────────────────────────────────────────────────
  const digitBox = (d) => `
<td align="center" valign="middle"
    style="width:52px;height:64px;
           background-color:#f8fafc;
           border:1.5px solid #e2e8f0;
           border-bottom:3px solid #cbd5e1;
           border-radius:10px;
           font-size:30px;font-weight:700;color:#0f172a;
           font-family:'Courier New',Courier,monospace;
           letter-spacing:-1px;">
  ${d}
</td>`.trim();

  const spacer = `<td style="width:16px;"></td>`;

  // Group digits as XXX·XXX with a centred dot separator
  const dotSeparator = `
<td align="center" valign="middle" style="width:24px;">
  <span style="font-size:26px;font-weight:700;color:#cbd5e1;font-family:'Courier New',Courier,monospace;line-height:1;">·</span>
</td>`.trim();

  const digitCells = [
    digits[0], digits[1], digits[2],
    null, // separator
    digits[3], digits[4], digits[5],
  ].map((d, i) => {
    if (d === null) return dotSeparator;
    return digitBox(d) + (i < 6 && digits[i + 1] !== undefined && i !== 2 ? spacer : '');
  }).join('\n');

  // ── Plain-text fallback ────────────────────────────────────────────────
  const text = `
${APP_NAME} — Verification Code
─────────────────────────────────

Hi ${firstName},

Your one-time sign-in code is:

  ${otp.slice(0, 3)} ${otp.slice(3)}

This code expires in ${OTP_EXPIRY_MINUTES} minutes and is single-use.

Didn't request this? Contact us at ${SUPPORT_EMAIL}.

─────────────────────────────────
© ${YEAR} ${APP_NAME} · ${APP_URL}
  `.trim();

  // ── HTML ──────────────────────────────────────────────────────────────
  const html = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no"/>
  <title>Your ${APP_NAME} sign-in code</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body, table, td, p, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }

    body {
      margin:0; padding:0;
      background-color:#f1f5f9;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
      -webkit-font-smoothing:antialiased;
    }

    a { color:#0ea5e9; }
    a:hover { color:#0284c7; }

    @media only screen and (max-width:620px) {
      .outer-pad  { padding:0 !important; }
      .inner-wrap { padding:20px 0 32px !important; }
      .card       { border-radius:0 !important; border-left:none !important; border-right:none !important; }
      .card-head  { padding:24px 20px !important; }
      .card-body  { padding:28px 20px 24px !important; }
      .card-foot  { padding:16px 20px !important; }
      .otp-cell   { width:40px !important; height:52px !important; font-size:24px !important; }
    }
  </style>
</head>

<body>
  <!-- Preheader text (hidden) -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    Your ${APP_NAME} sign-in code: ${otp.slice(0,3)} ${otp.slice(3)} — expires in ${OTP_EXPIRY_MINUTES} minutes.&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         class="outer-pad" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" class="inner-wrap" style="padding:48px 16px;">

        <!-- ═══════════════════════════════════════
             CARD
        ════════════════════════════════════════ -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               class="card"
               style="max-width:580px;background-color:#ffffff;
                      border-radius:16px;
                      border:1px solid #e2e8f0;
                      box-shadow:0 1px 3px rgba(0,0,0,0.05),0 8px 32px rgba(0,0,0,0.06);
                      overflow:hidden;">

          <!-- Top accent bar -->
          <tr>
            <td style="height:4px;
                       background:linear-gradient(90deg,#0ea5e9 0%,#6366f1 100%);
                       font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- ── HEADER ─────────────────────────── -->
          <tr>
            <td class="card-head"
                style="padding:28px 40px 24px;
                       border-bottom:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <!-- Logo mark -->
                  <td valign="middle" width="42">
                    <div style="width:38px;height:38px;border-radius:9px;
                                background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%);
                                text-align:center;line-height:38px;">
                      <svg width="20" height="13" viewBox="0 0 28 18" fill="none"
                           style="vertical-align:middle;margin-top:-1px;"
                           xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 9 C4 3,7 3,10 9 S16 15,19 9 S25 3,27 9"
                              stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                      </svg>
                    </div>
                  </td>
                  <!-- Brand name -->
                  <td valign="middle" style="padding-left:11px;">
                    <span style="font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-0.4px;">
                      ${APP_NAME}
                    </span>
                  </td>
                  <!-- Badge -->
                  <td align="right" valign="middle">
                    <span style="display:inline-block;padding:4px 10px;
                                 background:#f0f9ff;border:1px solid #bae6fd;
                                 border-radius:100px;
                                 font-size:11px;font-weight:600;color:#0369a1;
                                 letter-spacing:0.3px;white-space:nowrap;">
                      Sign-in code
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── BODY ──────────────────────────── -->
          <tr>
            <td class="card-body" style="padding:36px 40px 32px;">

              <!-- Greeting -->
              <p style="margin:0 0 6px;font-size:22px;font-weight:700;
                        color:#0f172a;letter-spacing:-0.4px;line-height:1.3;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.75;">
                Use the code below to sign in to your
                <strong style="color:#334155;font-weight:600;">${APP_NAME}</strong> account.
                It expires in <strong style="color:#334155;font-weight:600;">${OTP_EXPIRY_MINUTES} minutes</strong>
                and can only be used once.
              </p>

              <!-- OTP box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center"
                      style="padding:28px 24px;
                             background-color:#f8fafc;
                             border:1px solid #e2e8f0;
                             border-radius:12px;">

                    <!-- Digit row -->
                    <table cellpadding="0" cellspacing="0" role="presentation"
                           style="border-spacing:7px 0;border-collapse:separate;">
                      <tr>
                        ${[digits[0], digits[1], digits[2]].map(d => digitBox(d)).join('<td style="width:7px;"></td>')}
                        ${dotSeparator}
                        ${[digits[3], digits[4], digits[5]].map(d => digitBox(d)).join('<td style="width:7px;"></td>')}
                      </tr>
                    </table>

                    <!-- Expiry line -->
                    <p style="margin:16px 0 0;font-size:12.5px;color:#94a3b8;letter-spacing:0.1px;">
                      Expires in&nbsp;<strong style="color:#64748b;">${OTP_EXPIRY_MINUTES}&nbsp;minutes</strong>
                      &nbsp;·&nbsp; Single use
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Tip -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="margin-top:20px;">
                <tr>
                  <td style="padding:13px 16px;
                             background:#fffbeb;
                             border:1px solid #fde68a;
                             border-left:3px solid #f59e0b;
                             border-radius:0 8px 8px 0;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                      <strong style="color:#78350f;">Tip:</strong>
                      Switch back to the ${APP_NAME} tab and enter this code.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="margin:28px 0 24px;">
                <tr><td style="border-top:1px solid #f1f5f9;"></td></tr>
              </table>

              <!-- Didn't request this -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td width="36" valign="top" style="padding-top:1px;">
                    <div style="width:32px;height:32px;
                                background:#fff1f2;border:1px solid #fecdd3;
                                border-radius:8px;text-align:center;line-height:32px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                           style="vertical-align:middle;margin-top:-1px;"
                           xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                              stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#334155;">
                      Didn't request this?
                    </p>
                    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.65;">
                      Ignore this email — your account is safe. If you're concerned,
                      reach out at
                      <a href="mailto:${SUPPORT_EMAIL}"
                         style="color:#0ea5e9;font-weight:500;text-decoration:none;">${SUPPORT_EMAIL}</a>.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── FOOTER ────────────────────────── -->
          <tr>
            <td class="card-foot"
                style="padding:18px 40px;
                       background-color:#f8fafc;
                       border-top:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11.5px;color:#94a3b8;line-height:1.7;">
                      This is an automated message from
                      <a href="${APP_URL}"
                         style="color:#94a3b8;font-weight:600;text-decoration:none;">${APP_NAME}</a>.
                      Please do not reply to this email.
                    </p>
                    <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">
                      © ${YEAR} ${APP_NAME} · PAGASA Marine Forecast Platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /CARD -->

        <!-- Below-card note -->
        <p style="margin:20px auto 0;max-width:460px;font-size:11.5px;
                  color:#94a3b8;text-align:center;line-height:1.7;">
          You're receiving this because a sign-in was initiated on your
          ${APP_NAME} account. If this wasn't you, no further action is required.
        </p>

      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return { subject: `${otp.slice(0,3)} ${otp.slice(3)} is your ${APP_NAME} sign-in code`, text, html };
};

export const sendOtpEmail = async (email, otp, username = 'there') => {
  if (NODE_ENV !== 'production' && !EMAIL_USER) {
    console.debug(`[OTP DEV] Code for ${email}: ${otp}`);
    return;
  }

  const { subject, text, html } = buildOtpEmail(otp, username);

  try {
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to:   email,
      subject,
      text,
      html,
    });
    console.info(`[sendOtpEmail] Delivered — messageId: ${info.messageId}`);
  } catch (err) {
    console.error('[sendOtpEmail] SMTP error:', err.message);
    throw new Error('Failed to send OTP email. Please try again.');
  }
};

export const checkMailerHealth = async () => {
  await transporter.verify();
  console.info('[Mailer] SMTP connection verified');
};