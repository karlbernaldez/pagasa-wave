import nodemailer from 'nodemailer';

const {
  EMAIL_HOST    = 'smtp.hostinger.com',
  EMAIL_PORT    = '465',
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  APP_NAME      = 'WaveLab',
  APP_URL       = 'https://adovelopers.com',
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
  const digits    = otp.split('');
  const firstName = username.split(' ')[0];

  const waveDecoration = `
<svg width="520" height="56" viewBox="0 0 520 56" fill="none"
     xmlns="http://www.w3.org/2000/svg"
     style="display:block;width:100%;max-width:520px;">
  <defs>
    <linearGradient id="wOcean1" x1="0" y1="0" x2="520" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#0c4a6e" stop-opacity="0"/>
      <stop offset="20%"  stop-color="#0369a1" stop-opacity="0.6"/>
      <stop offset="50%"  stop-color="#0ea5e9" stop-opacity="0.85"/>
      <stop offset="80%"  stop-color="#0369a1" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#0c4a6e" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="wOcean2" x1="0" y1="0" x2="520" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#164e63" stop-opacity="0"/>
      <stop offset="30%"  stop-color="#06b6d4" stop-opacity="0.35"/>
      <stop offset="50%"  stop-color="#22d3ee" stop-opacity="0.55"/>
      <stop offset="70%"  stop-color="#06b6d4" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#164e63" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="wOcean3" x1="0" y1="0" x2="520" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#0c4a6e" stop-opacity="0"/>
      <stop offset="40%"  stop-color="#7dd3fc" stop-opacity="0.2"/>
      <stop offset="60%"  stop-color="#bae6fd" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#0c4a6e" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="M0 34 C43 14, 87 54, 130 34 C173 14, 217 54, 260 34 C303 14, 347 54, 390 34 C433 14, 477 54, 520 34"
        stroke="url(#wOcean1)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M0 38 C26 26, 52 50, 78 38 C104 26, 130 50, 156 38 C182 26, 208 50, 234 38 C260 26, 286 50, 312 38 C338 26, 364 50, 390 38 C416 26, 442 50, 468 38 C494 26, 510 46, 520 38"
        stroke="url(#wOcean2)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M0 42 C13 38, 26 46, 39 42 C52 38, 65 46, 78 42 C91 38, 104 46, 117 42 C130 38, 143 46, 156 42 C169 38, 182 46, 195 42 C208 38, 221 46, 234 42 C247 38, 260 46, 273 42 C286 38, 299 46, 312 42 C325 38, 338 46, 351 42 C364 38, 377 46, 390 42 C403 38, 416 46, 429 42 C442 38, 455 46, 468 42 C481 38, 494 46, 507 42 C514 39, 518 43, 520 42"
        stroke="url(#wOcean3)" stroke-width="1" fill="none" stroke-linecap="round"/>
</svg>`.trim();

  const digitBox = (d) => `
<td align="center" valign="middle" class="digit-cell"
    style="width:52px;height:64px;
           background:linear-gradient(170deg,#0c1e30 0%,#071524 100%);
           border:1px solid rgba(14,165,233,0.4);
           border-top:1.5px solid rgba(56,189,248,0.55);
           border-radius:8px;
           font-size:28px;font-weight:700;color:#e0f2fe;
           font-family:'Courier New',Courier,monospace;
           box-shadow:0 0 18px rgba(14,165,233,0.12),
                      0 1px 0 rgba(186,230,253,0.08) inset,
                      0 -1px 0 rgba(0,0,0,0.4) inset;">
  ${d}
</td>`.trim();

  const spacer = `<td class="digit-spacer" style="width:20px;"></td>`;

  const digitCells = [
    digits[0], digits[1], digits[2],
    null,
    digits[3], digits[4], digits[5],
  ].map((d) => (d === null ? spacer : digitBox(d))).join('\n');

  const text = `
${APP_NAME} — Marine Forecast Platform | Login Verification
────────────────────────────────────────────────────────────

Hi ${firstName},

Here is your one-time login code for ${APP_NAME}:

  ${otp.slice(0, 3)} ${otp.slice(3)}

This code expires in ${OTP_EXPIRY_MINUTES} minutes and can only be used once.

If you didn't request this, please contact us at ${SUPPORT_EMAIL}.

────────────────────────────────────────────────────────────
© ${YEAR} ${APP_NAME} · ${APP_URL}
  `.trim();

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
  <title>Your ${APP_NAME} verification code</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;
    }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

    body {
      margin: 0; padding: 0;
      background-color: #020d18;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                   'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }

    @media only screen and (max-width: 600px) {
      .email-outer   { padding: 0 !important; }
      .email-wrapper { padding: 24px 0 32px !important; }
      .card          { border-radius: 0 !important; border-left: none !important; border-right: none !important; }
      .card-head     { padding: 26px 20px 22px !important; }
      .card-body     { padding: 26px 20px 28px !important; }
      .card-foot     { padding: 16px 20px !important; }
      .digit-cell    { width: 40px !important; height: 52px !important; font-size: 22px !important; border-radius: 6px !important; }
      .digit-spacer  { width: 12px !important; }
      .h1-text       { font-size: 22px !important; }
      .sub-text      { font-size: 14px !important; }
      .badge-cell    { display: none !important; }
      .wave-wrap     { margin-top: 18px !important; }
      .tip-cell      { padding: 11px 14px !important; }
    }

    @media only screen and (max-width: 380px) {
      .digit-cell   { width: 33px !important; height: 46px !important; font-size: 19px !important; }
      .digit-spacer { width: 8px !important; }
      .h1-text      { font-size: 20px !important; }
    }
  </style>
</head>

<body>
  <div style="display:none;font-size:1px;color:#020d18;line-height:1px;
              max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${APP_NAME} · Hi ${firstName}, your verification code is ${otp.slice(0,3)} ${otp.slice(3)} — expires in ${OTP_EXPIRY_MINUTES} min.&#847; &#847; &#847; &#847; &#847;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         class="email-outer"
         style="background-color:#020d18;
                background-image:
                  radial-gradient(ellipse 70% 45% at 50% 0%,rgba(3,105,161,0.22) 0%,transparent 65%),
                  radial-gradient(ellipse 50% 35% at 15% 100%,rgba(6,182,212,0.08) 0%,transparent 60%),
                  radial-gradient(ellipse 40% 25% at 85% 90%,rgba(2,132,199,0.07) 0%,transparent 55%);
                padding:0;">
    <tr>
      <td align="center" valign="top">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               class="email-wrapper" style="padding:40px 16px 48px;">
          <tr>
            <td align="center">

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     class="card"
                     style="max-width:580px;
                            background-color:#06111e;
                            border-radius:16px;
                            border:1px solid rgba(14,165,233,0.2);
                            box-shadow:0 0 0 1px rgba(6,182,212,0.06),0 32px 72px rgba(0,0,0,0.7),0 0 100px rgba(3,105,161,0.09);
                            overflow:hidden;">

                <!-- HEADER -->
                <tr>
                  <td class="card-head"
                      style="padding:30px 36px 26px;
                             background:linear-gradient(160deg,rgba(3,105,161,0.18) 0%,rgba(8,145,178,0.10) 50%,rgba(6,182,212,0.05) 100%);
                             border-bottom:1px solid rgba(14,165,233,0.1);">

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td valign="middle">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td valign="middle" style="padding-right:13px;">
                                <div style="width:44px;height:44px;border-radius:50%;
                                            background:linear-gradient(145deg,#0369a1 0%,#0891b2 50%,#22d3ee 100%);
                                            display:inline-block;
                                            box-shadow:0 0 0 1px rgba(34,211,238,0.25),0 4px 20px rgba(14,165,233,0.35),0 0 0 5px rgba(14,165,233,0.06);">
                                  <table width="44" height="44" cellpadding="0" cellspacing="0" role="presentation">
                                    <tr>
                                      <td align="center" valign="middle">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <path d="M2 8 C4.5 4, 7.5 12, 10 8 C12.5 4, 15.5 12, 18 8 C20.5 4, 22 8, 22 8"
                                                stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                                          <path d="M2 15 C4.5 11, 7.5 19, 10 15 C12.5 11, 15.5 19, 18 15 C20.5 11, 22 15, 22 15"
                                                stroke="rgba(255,255,255,0.55)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                                        </svg>
                                      </td>
                                    </tr>
                                  </table>
                                </div>
                              </td>
                              <td valign="middle">
                                <p style="margin:0;font-size:21px;font-weight:800;color:#e0f2fe;letter-spacing:-0.3px;line-height:1;">
                                  ${APP_NAME}
                                </p>
                                <p style="margin:3px 0 0;font-size:9px;font-weight:700;color:rgba(56,189,248,0.7);letter-spacing:2.8px;text-transform:uppercase;line-height:1;">
                                  Marine Forecast Platform
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td align="right" valign="middle" class="badge-cell">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="padding:5px 12px;background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.25);border-radius:100px;">
                                <p style="margin:0;font-size:10px;font-weight:700;color:#7dd3fc;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;">
                                  🔒&nbsp; Secure Access
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <div class="wave-wrap" style="margin-top:20px;line-height:0;overflow:hidden;">
                      ${waveDecoration}
                    </div>
                  </td>
                </tr>

                <!-- BODY -->
                <tr>
                  <td class="card-body" style="padding:32px 36px 28px;">
                    <p style="margin:0 0 7px;font-size:10.5px;font-weight:700;color:#0891b2;letter-spacing:2.8px;text-transform:uppercase;">
                      One-Time Passcode
                    </p>
                    <p class="h1-text" style="margin:0 0 12px;font-size:26px;font-weight:800;color:#e0f2fe;letter-spacing:-0.4px;line-height:1.25;">
                      Hi ${firstName} 👋
                    </p>
                    <p class="sub-text" style="margin:0 0 26px;font-size:14.5px;color:#6b8aa3;line-height:1.78;">
                      Use the verification code below to sign in to
                      <strong style="color:#93c5fd;font-weight:600;">${APP_NAME}</strong>.
                      This is a single-use code — do not share it with anyone.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td align="center"
                            style="background:linear-gradient(175deg,rgba(3,105,161,0.12) 0%,rgba(6,17,30,0.6) 55%,rgba(8,145,178,0.07) 100%);
                                   border:1px solid rgba(14,165,233,0.18);border-radius:12px;padding:24px 20px 20px;">

                          <table cellpadding="0" cellspacing="0" role="presentation"
                                 style="border-collapse:separate;border-spacing:6px 0;">
                            <tr>${digitCells}</tr>
                          </table>

                          <div style="margin:13px auto 0;width:200px;height:1px;
                                      background:linear-gradient(90deg,transparent,#0891b2 30%,#22d3ee 70%,transparent);
                                      opacity:0.45;"></div>

                          <p style="margin:11px 0 0;font-size:11.5px;color:#2e5068;letter-spacing:0.2px;">
                            <span style="color:#0891b2;">⏱</span>
                            &nbsp;<strong style="color:#3d6278;">Expires in ${OTP_EXPIRY_MINUTES} minutes</strong>
                            &nbsp;·&nbsp; Single use only
                          </p>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:18px;">
                      <tr>
                        <td class="tip-cell"
                            style="background:rgba(3,105,161,0.07);border:1px solid rgba(14,165,233,0.12);border-left:3px solid #0891b2;border-radius:0 8px 8px 0;padding:12px 16px;">
                          <p style="margin:0;font-size:13px;color:#3d6278;line-height:1.65;">
                            <strong style="color:#527a94;">💡 Tip:</strong>
                            Return to the ${APP_NAME} tab and enter this code. It auto-expires once used.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0 20px;">
                      <tr><td style="border-top:1px solid rgba(14,165,233,0.07);"></td></tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td width="38" valign="top" style="padding-top:1px;">
                          <div style="width:34px;height:34px;background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.15);border-radius:8px;text-align:center;line-height:34px;">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-top:-1px;">
                              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                                    stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          </div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 3px;font-size:12.5px;font-weight:700;color:#93bfda;">Didn't request this?</p>
                          <p style="margin:0;font-size:12.5px;color:#334e63;line-height:1.65;">
                            Ignore this email — your account remains secure. If concerned,
                            contact us at&nbsp;<a href="mailto:${SUPPORT_EMAIL}" style="color:#38bdf8;font-weight:500;text-decoration:none;">${SUPPORT_EMAIL}</a>.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td class="card-foot"
                      style="padding:18px 36px;background:rgba(0,0,0,0.32);border-top:1px solid rgba(14,165,233,0.07);">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td valign="middle">
                          <p style="margin:0;font-size:11.5px;color:#1e3548;line-height:1.7;">
                            Automated security message from
                            <a href="${APP_URL}" style="color:#1e4560;font-weight:600;text-decoration:none;">${APP_NAME}</a> ·
                            Do not reply directly.
                          </p>
                          <p style="margin:4px 0 0;font-size:10.5px;color:#152535;">
                            © ${YEAR} ${APP_NAME} ·
                            <a href="${APP_URL}" style="color:#152535;">${APP_URL}</a>
                          </p>
                        </td>
                        <td align="right" valign="middle" style="padding-left:16px;">
                          <div style="width:30px;height:30px;border-radius:50%;background:rgba(3,105,161,0.1);border:1px solid rgba(14,165,233,0.12);text-align:center;line-height:30px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;margin-top:-1px;" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2 9 C5 5, 8 13, 11 9 C14 5, 17 13, 20 9 C21.5 7, 22 9, 22 9"
                                    stroke="rgba(14,165,233,0.3)" stroke-width="2" stroke-linecap="round" fill="none"/>
                            </svg>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>

              <p style="margin:16px auto 0;max-width:460px;font-size:11px;color:#0f1e2b;text-align:center;line-height:1.65;">
                You're receiving this because a sign-in was attempted on your ${APP_NAME} operational account. No action needed if this wasn't you.
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return {
    subject: `${otp.slice(0,3)} ${otp.slice(3)} — your ${APP_NAME} verification code`,
    text,
    html,
  };
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