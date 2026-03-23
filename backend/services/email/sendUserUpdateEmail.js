import { transporter, FROM_ADDRESS, APP_NAME, APP_URL, SUPPORT_EMAIL, EMAIL_USER, NODE_ENV } from './mailer.config.js';

const YEAR = new Date().getFullYear();

// ── Status-specific messaging ─────────────────────────────────────────────
// Drives the subject line, headline, intro copy, and badge colour
// whenever the change is purely a status update.
const STATUS_MESSAGING = {
  active: {
    subject:  `Your ${APP_NAME} account has been activated`,
    headline: 'Account Activated',
    intro:    `Your ${APP_NAME} account has been reviewed and approved by an administrator. You now have full access to the platform and may sign in to access marine forecasts, reports, and all available features. Welcome to ${APP_NAME}.`,
    cta:      { text: 'Sign In to Dashboard', url: `${APP_URL}/studio`},
    badge:    { bg: '#f0fdf4', border: '#86efac', color: '#166534', label: 'Activated' },
    details: [
      { label: 'Access Level', value: 'Full platform access granted' },
      { label: 'Effective',    value: 'Immediately' },
      { label: 'Next Step',    value: 'Sign in to your dashboard to get started' },
    ],
  },
  suspended: {
    subject:  `Your ${APP_NAME} account has been suspended`,
    headline: 'Account Suspended',
    intro:    `Your ${APP_NAME} account has been temporarily suspended by an administrator. Access to the platform has been restricted for the duration of the suspension. If you believe this action was taken in error or require further clarification, please contact your administrator directly.`,
    cta:      { text: 'Contact Support', url: `mailto:${SUPPORT_EMAIL}` },
    badge:    { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', label: 'Suspended' },
    details: [
      { label: 'Access Level', value: 'Platform access restricted' },
      { label: 'Duration',     value: 'Until further notice from your administrator' },
      { label: 'Next Step',    value: `Contact your administrator or write to ${SUPPORT_EMAIL}` },
    ],
  },
  disabled: {
    subject:  `Your ${APP_NAME} account has been disabled`,
    headline: 'Account Disabled',
    intro:    `Your ${APP_NAME} account has been disabled by an administrator and your access to the platform has been revoked. If you believe this was done in error or wish to appeal this decision, please contact your administrator or reach out to our support team.`,
    cta:      { text: 'Contact Support', url: `mailto:${SUPPORT_EMAIL}` },
    badge:    { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', label: 'Disabled' },
    details: [
      { label: 'Access Level', value: 'Access permanently revoked' },
      { label: 'Account Data', value: 'Your records remain on file' },
      { label: 'Next Step',    value: 'Contact your administrator to appeal or inquire' },
    ],
  },
  inactive: {
    subject:  `Your ${APP_NAME} account has been set to inactive`,
    headline: 'Account Set to Inactive',
    intro:    `Your ${APP_NAME} account has been marked as inactive by an administrator. Your account data remains intact and on record; however, platform access has been restricted until the account is reactivated. Please contact your administrator if you require access to be restored.`,
    cta:      { text: 'Contact Support', url: `mailto:${SUPPORT_EMAIL}` },
    badge:    { bg: '#f8fafc', border: '#cbd5e1', color: '#475569', label: 'Inactive' },
    details: [
      { label: 'Access Level', value: 'Sign-in temporarily restricted' },
      { label: 'Account Data', value: 'All data preserved and on record' },
      { label: 'Next Step',    value: 'Contact your administrator to reactivate access' },
    ],
  },
  pending: {
    subject:  `Your ${APP_NAME} account is under administrative review`,
    headline: 'Account Under Review',
    intro:    `Your ${APP_NAME} account has been placed under administrative review. Sign-in access is restricted while the review is in progress. You will receive a notification via email once a decision has been made. For inquiries, please contact your administrator.`,
    cta:      { text: 'Contact Support', url: `mailto:${SUPPORT_EMAIL}` },
    badge:    { bg: '#f0f9ff', border: '#7dd3fc', color: '#075985', label: 'Under Review' },
    details: [
      { label: 'Access Level', value: 'Sign-in restricted pending review' },
      { label: 'Timeline',     value: 'Typically resolved within 1–2 business days' },
      { label: 'Next Step',    value: 'Await a follow-up email notification' },
    ],
  },
  locked: {
    subject:  `Your ${APP_NAME} account has been locked`,
    headline: 'Account Locked',
    intro:    `Your ${APP_NAME} account has been locked by an administrator. This is typically a temporary security measure. You will not be able to sign in until the lock has been lifted. Please contact your administrator for further information.`,
    cta:      { text: 'Contact Support', url: `mailto:${SUPPORT_EMAIL}` },
    badge:    { bg: '#faf5ff', border: '#d8b4fe', color: '#6b21a8', label: 'Locked' },
    details: [
      { label: 'Access Level', value: 'Sign-in access locked' },
      { label: 'Duration',     value: 'Until unlocked by an administrator' },
      { label: 'Next Step',    value: 'Contact your administrator to have the lock removed' },
    ],
  },
};

const GENERIC_MESSAGING = {
  subject:  `Your ${APP_NAME} account was updated`,
  headline: 'Your account was updated',
  intro:    `An administrator just made the following changes to your <strong style="color:#334155;">${APP_NAME}</strong> account.`,
  badge:    { bg: '#f0f9ff', border: '#bae6fd', color: '#0369a1', label: 'Account Update' },
};

/**
 * Resolves the messaging config for a given change set.
 * If the only change is a status field, use status-specific copy.
 * Otherwise fall back to the generic "account updated" copy.
 */
const resolveMessaging = (changes) => {
  if (changes.length === 1 && changes[0].field === 'Status') {
    const key = changes[0].to?.toLowerCase();
    return STATUS_MESSAGING[key] ?? GENERIC_MESSAGING;
  }
  return GENERIC_MESSAGING;
};

const buildUserUpdateEmail = (name, changes) => {
  const firstName = name?.split(' ')[0] ?? 'there';
  const msg       = resolveMessaging(changes);
  const cta       = msg.cta ?? { text: 'Sign In to Dashboard', url: APP_URL };
  const LOGO_URL  = `${APP_URL}/pagasa-logo.png`;
  const details   = msg.details ?? [];

  // ── Detail rows (replaces the diff table for status-only changes) ────────
  const detailRows = details.map(({ label, value }, index) => {
    const isLast = index === details.length - 1;
    return `
      <tr>
        <td style="padding:13px 20px;${isLast ? '' : 'border-bottom:1px solid #f1f5f9;'}">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td width="160" valign="top"
                  style="font-size:11.5px;font-weight:700;color:#64748b;
                         text-transform:uppercase;letter-spacing:0.6px;
                         padding-right:16px;padding-top:1px;white-space:nowrap;">
                ${label}
              </td>
              <td valign="top"
                  style="font-size:13.5px;color:#1e293b;font-weight:500;line-height:1.5;">
                ${value}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join('');

  // ── Generic field change rows (used only for multi-field updates) ────────
  const changeRows = changes.map(({ field, from, to }, index) => {
    const isLast = index === changes.length - 1;
    return `
      <tr>
        <td style="padding:13px 20px;${isLast ? '' : 'border-bottom:1px solid #f1f5f9;'}">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td width="160" valign="top"
                  style="font-size:11.5px;font-weight:700;color:#64748b;
                         text-transform:uppercase;letter-spacing:0.6px;
                         padding-right:16px;padding-top:1px;white-space:nowrap;">
                ${field}
              </td>
              <td valign="top">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="padding:2px 10px;background:#fef2f2;border:1px solid #fecaca;
                               border-radius:4px;font-size:12.5px;color:#991b1b;
                               font-family:'Courier New',Courier,monospace;white-space:nowrap;">
                      ${from ?? '—'}
                    </td>
                    <td style="padding:0 10px;font-size:12px;color:#94a3b8;">&rarr;</td>
                    <td style="padding:2px 10px;background:#f0fdf4;border:1px solid #86efac;
                               border-radius:4px;font-size:12.5px;font-weight:600;color:#166534;
                               font-family:'Courier New',Courier,monospace;white-space:nowrap;">
                      ${to ?? '—'}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join('');

  // Decide which rows to render in the info panel
  const infoRows    = details.length > 0 ? detailRows : changeRows;
  const infoLabel   = details.length > 0 ? 'What This Means for You' : 'Changes Applied';
  const infoCount   = details.length > 0 ? null : `${changes.length} item${changes.length !== 1 ? 's' : ''}`;

  // ── Plain-text fallback ──────────────────────────────────────────────────
  const text = `
${APP_NAME}
PAGASA Marine Forecast Platform

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACCOUNT NOTIFICATION — ${msg.headline.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear ${firstName},

${msg.intro.replace(/<[^>]+>/g, '')}

CHANGES APPLIED
${changes.map(({ field, from, to }) => `  ${field.padEnd(18)} ${from ?? '—'}  →  ${to ?? '—'}`).join('\n')}

Applied on: ${new Date().toUTCString()}

${cta.text}: ${cta.url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If you did not expect this change, contact your administrator
or email ${SUPPORT_EMAIL} immediately.

© ${YEAR} ${APP_NAME} · ${APP_URL}
  `.trim();

  // ── HTML ─────────────────────────────────────────────────────────────────
  const html = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>${msg.headline} — ${APP_NAME}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    *,*::before,*::after{box-sizing:border-box;}
    body,table,td,p,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;}
    img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
    body{margin:0;padding:0;background-color:#f1f5f9;
         font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,'Helvetica Neue',Arial,sans-serif;
         -webkit-font-smoothing:antialiased;}
    @media only screen and (max-width:620px){
      .card{border-radius:0!important;}
      .card-header{padding:32px 24px!important;}
      .card-body{padding:32px 24px!important;}
      .card-footer{padding:20px 24px!important;}
    }
  </style>
</head>
<body>

  <!-- Preheader -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;overflow:hidden;mso-hide:all;color:#f1f5f9;">
    ${msg.headline} — ${APP_NAME} account notification.&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="card"
               style="max-width:580px;background:#ffffff;border-radius:12px;
                      border:1px solid #dde3ed;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,0.06),0 0 0 1px rgba(0,0,0,0.02);">

          <!-- Top accent bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#0369a1,#1d4ed8);
                       font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td class="card-header"
                style="padding:36px 48px 28px;background:#ffffff;
                       border-bottom:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <!-- Logo -->
                  <td valign="middle">
                    <img src="${LOGO_URL}"
                         alt="${APP_NAME}" width="120"
                         style="display:block;height:auto;max-width:120px;" />
                  </td>
                  <!-- Status badge -->
                  <td valign="middle" align="right">
                    <span style="display:inline-block;padding:5px 14px;
                                 background:${msg.badge.bg};
                                 border:1px solid ${msg.badge.border};
                                 border-radius:4px;
                                 font-size:11px;font-weight:700;
                                 color:${msg.badge.color};
                                 letter-spacing:0.7px;
                                 text-transform:uppercase;">
                      ${msg.badge.label}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="card-body" style="padding:36px 48px;">

              <!-- Headline -->
              <p style="margin:0 0 6px;font-size:22px;font-weight:700;
                        color:#0f172a;letter-spacing:-0.3px;line-height:1.3;">
                ${msg.headline}
              </p>
              <p style="margin:0 0 28px;font-size:13px;color:#94a3b8;
                        text-transform:uppercase;letter-spacing:0.8px;font-weight:500;">
                Account Notification
              </p>

              <!-- Salutation & intro -->
              <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.8;">
                Dear <strong>${firstName}</strong>,
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#475569;line-height:1.8;">
                ${msg.intro}
              </p>

              <!-- Info panel -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="border:1px solid #e2e8f0;border-radius:8px;
                            overflow:hidden;margin-bottom:32px;">
                <!-- Panel header -->
                <tr>
                  <td style="padding:11px 20px;background:#f8fafc;
                             border-bottom:1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td>
                          <span style="font-size:11px;font-weight:700;color:#64748b;
                                       letter-spacing:0.8px;text-transform:uppercase;">
                            ${infoLabel}
                          </span>
                        </td>
                        ${infoCount ? `<td align="right"><span style="font-size:11px;color:#94a3b8;">${infoCount}</span></td>` : ''}
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Panel rows -->
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      ${infoRows}
                    </table>
                  </td>
                </tr>
                <!-- Timestamp footer -->
                <tr>
                  <td style="padding:10px 20px;background:#f8fafc;
                             border-top:1px solid #e2e8f0;">
                    <span style="font-size:11.5px;color:#94a3b8;">
                      Effective ${new Date().toUTCString()}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation"
                     style="margin-bottom:32px;">
                <tr>
                  <td style="background:#1d4ed8;border-radius:6px;">
                    <a href="${cta.url}"
                       style="display:inline-block;padding:12px 28px;
                              color:#ffffff;font-size:14px;font-weight:600;
                              text-decoration:none;letter-spacing:0.2px;">
                      ${cta.text}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="margin-bottom:24px;">
                <tr><td style="border-top:1px solid #f1f5f9;"></td></tr>
              </table>

              <!-- Security notice -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:14px 18px;background:#f8fafc;
                             border:1px solid #e2e8f0;border-left:3px solid #94a3b8;
                             border-radius:0 6px 6px 0;">
                    <p style="margin:0 0 3px;font-size:12.5px;font-weight:600;color:#334155;">
                      Did not expect this notification?
                    </p>
                    <p style="margin:0;font-size:12.5px;color:#64748b;line-height:1.65;">
                      If this change was not authorised or you have concerns,
                      please contact your administrator or write to
                      <a href="mailto:${SUPPORT_EMAIL}"
                         style="color:#1d4ed8;font-weight:500;text-decoration:none;">
                        ${SUPPORT_EMAIL}
                      </a> immediately.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="card-footer"
                style="padding:20px 48px;background:#f8fafc;
                       border-top:1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:11.5px;color:#94a3b8;line-height:1.6;">
                      This is an automated notification from
                      <a href="${APP_URL}"
                         style="color:#64748b;font-weight:600;text-decoration:none;">
                        ${APP_NAME}
                      </a>.
                      Please do not reply to this email.
                    </p>
                    <p style="margin:0;font-size:11px;color:#cbd5e1;">
                      &copy; ${YEAR} ${APP_NAME} &nbsp;&middot;&nbsp; PAGASA Marine Forecast Platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Card -->

        <p style="margin:20px auto 0;max-width:480px;font-size:11.5px;
                  color:#94a3b8;text-align:center;line-height:1.7;">
          You are receiving this email because an administrator made a change
          to your ${APP_NAME} account.
        </p>

      </td>
    </tr>
  </table>

</body>
</html>`.trim();

  return { subject: msg.subject, text, html };
};


export const sendUserUpdateEmail = async (email, name, changes) => {
  if (!changes?.length) return;

  if (NODE_ENV !== 'production' && !EMAIL_USER) {
    console.debug(`[USER UPDATE DEV] Email to ${email}:`, changes);
    return;
  }

  const { subject, text, html } = buildUserUpdateEmail(name, changes);

  try {
    const info = await transporter.sendMail({ from: FROM_ADDRESS, to: email, subject, text, html });
    console.info(`[sendUserUpdateEmail] Delivered — messageId: ${info.messageId}`);
  } catch (err) {
    console.error('[sendUserUpdateEmail] SMTP error:', err.message);
    throw new Error('Failed to send account update email.');
  }
};