-- Outlook desktop (Word HTML engine) safe email_templates.html_body updates.
-- Pulled from live Prayer App DB then rewritten: solid bgcolor + optional gradient,
-- nested presentation tables, inline styles only, CTA bgcolor cells.
-- subject / text_body / name / description unchanged. Do not apply to prod before test DB.

-- account_approval_request
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#2F5F54" style="background-color:#2F5F54;padding:20px;border-radius:8px 8px 0 0;">
              <h2 style="color:#ffffff;margin:0;font-size:22px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">New Account Access Request</h2>
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:20px;border-radius:0 0 8px 8px;">
              <p>A new user is requesting access to the prayer application:</p>
              <div style="background-color:#f5f5f5;padding:15px;border-radius:5px;margin:20px 0;">
                <p style="margin:5px 0;"><strong>Name:</strong> {{firstName}} {{lastName}}</p>
                <p style="margin:5px 0;"><strong>Email:</strong> {{email}}</p>
                <p style="margin:5px 0;"><strong>Requested:</strong> {{requestedDate}}</p>
              </div>
              <p>This email was not found in Planning Center. Please review and approve or deny this request:</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#10b981" style="background-color:#10b981;border-radius:6px;">
                    <a href="{{adminLink}}" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Go to Admin Portal</a>
                  </td>
                </tr>
              </table>
              <p style="color:#666;font-size:12px;margin-top:30px;">This is an automated message from your prayer application.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'account_approval_request';

-- account_approved
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#2F5F54" style="background-color:#2F5F54;padding:20px;border-radius:8px 8px 0 0;">
              <h2 style="color:#ffffff;margin:0;font-size:22px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Account Approved!</h2>
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:20px;border-radius:0 0 8px 8px;">
              <p>Hi {{firstName}},</p>
              <p>Great news! Your account access request has been approved by an administrator.</p>
              <p>You can now log in to the prayer application using your email address:</p>
              <div style="background-color:#f0fdf4;padding:15px;border-radius:5px;margin:20px 0;border-left:4px solid #2F5F54;">
                <p style="margin:0;"><strong>Email:</strong> {{email}}</p>
              </div>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#2F5F54" style="background-color:#2F5F54;border-radius:6px;">
                    <a href="{{loginLink}}" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Log In Now</a>
                  </td>
                </tr>
              </table>
              <p style="color:#666;font-size:12px;margin-top:30px;">This is an automated message from your prayer application.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'account_approved';

-- account_denied
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#666666" style="background-color:#666666;padding:20px;border-radius:8px 8px 0 0;">
              <h2 style="color:#ffffff;margin:0;font-size:22px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Account Request Status</h2>
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:20px;border-radius:0 0 8px 8px;">
              <p>Hi {{firstName}},</p>
              <p>Thank you for your interest in accessing the prayer application.</p>
              <p>After review, we are unable to approve your account request at this time. If you believe this is an error or would like more information, please contact an administrator.</p>
              <p style="color:#666;font-size:12px;margin-top:30px;">This is an automated message from your prayer application.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'account_denied';

-- admin_invitation
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#dc2626" style="background-color:#dc2626;background-image:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);padding:30px;border-radius:8px 8px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">🙏 Prayer App</h1>
              <p style="margin:10px 0 0 0;color:#ffffff;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Admin Access Granted</p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <h2 style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;color:#1f2937;">Welcome, {{name}}!</h2>
              <p>You've been granted admin access to the Prayer App. As an admin, you can:</p>
              <ul>
                <li>Review and approve prayer requests</li>
                <li>Manage prayer updates and deletions</li>
                <li>Configure email settings and subscribers</li>
                <li>Manage prayer prompts and types</li>
                <li>Access the full admin portal</li>
              </ul>
              <p>To sign in to the admin portal:</p>
              <ol>
                <li>Go to the login page link at the bottom of the main site</li>
                <li>Enter your email address: <strong>{{email}}</strong></li>
                <li>Click "Send Code"</li>
                <li>Check your email for the verification code</li>
                <li>Enter the code to sign in</li>
              </ol>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#dc2626" style="background-color:#dc2626;border-radius:6px;">
                    <a href="{{adminLink}}" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Go to Admin Portal</a>
                  </td>
                </tr>
              </table>
              <p style="color:#6b7280;font-size:14px;margin-top:30px;">
                <strong>Note:</strong> Prayer App uses secure verification codes for authentication. You'll receive a code via email each time you sign in.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;color:#6b7280;font-size:14px;">
              <p style="margin:0;">Prayer App Admin Portal</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'admin_invitation';

-- admin_notification_deletion
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#f59e0b" style="background-color:#f59e0b;background-image:linear-gradient(to right,#f59e0b,#d97706);padding:20px;border-radius:8px 8px 0 0;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">🗑️ Deletion Request Approval Needed</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <h2 style="color:#1f2937;margin-top:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{prayerTitle}}</h2>
              <p><strong>Requested by:</strong> {{requestedBy}}</p>
              <p><strong>Reason for deletion:</strong></p>
              <p style="background-color:#ffffff;padding:15px;border-radius:6px;border-left:4px solid #f59e0b;">{{reason}}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#f59e0b" style="background-color:#f59e0b;border-radius:6px;">
                    <a href="{{adminLink}}" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Go to Admin Portal</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;color:#6b7280;font-size:14px;">
              <p style="margin:0;">This is an automated notification from your prayer app.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'admin_notification_deletion';

-- admin_notification_prayer
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#10b981" style="background-color:#10b981;background-image:linear-gradient(to right,#10b981,#059669);padding:20px;border-radius:8px 8px 0 0;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">🙏 New Prayer Request Approval Needed</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <h2 style="color:#1f2937;margin-top:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{prayerTitle}}</h2>
              <p><strong>Requested by:</strong> {{requesterName}}</p>
              <p><strong>Description:</strong></p>
              <div style="background-color:#ffffff;padding:15px;border-radius:6px;border-left:4px solid #3b82f6;">{{prayerDescription}}</div>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#10b981" style="background-color:#10b981;border-radius:6px;">
                    <a href="{{adminLink}}" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Go to Admin Portal</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;color:#6b7280;font-size:14px;">
              <p style="margin:0;">This is an automated notification from your prayer app.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'admin_notification_prayer';

-- admin_notification_update
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#3b82f6" style="background-color:#3b82f6;background-image:linear-gradient(to right,#3b82f6,#2563eb);padding:20px;border-radius:8px 8px 0 0;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">💬 New Prayer Update Approval Needed</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <h2 style="color:#1f2937;margin-top:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Update for: {{prayerTitle}}</h2>
              <p><strong>Posted by:</strong> {{authorName}}</p>
              <p><strong>Update Content:</strong></p>
              <div style="background-color:#ffffff;padding:15px;border-radius:6px;border-left:4px solid #3b82f6;">{{updateContent}}</div>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#3b82f6" style="background-color:#3b82f6;border-radius:6px;">
                    <a href="{{adminLink}}" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Go to Admin Portal</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;color:#6b7280;font-size:14px;">
              <p style="margin:0;">This is an automated notification from your prayer app.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'admin_notification_update';

-- admin_subscriber_manual_broadcast
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;">
          <tr>
            <td bgcolor="#39704D" style="background-color:#39704D;background-image:linear-gradient(135deg,#39704D,#2d5a3d);padding:20px 24px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">Message from your prayer ministry</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 24px;">
              <div style="margin:0;color:#1f2937;font-size:16px;line-height:1.6;">{{broadcastBodyHtml}}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'admin_subscriber_manual_broadcast';

-- approved_prayer
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#10b981" style="background-color:#10b981;background-image:linear-gradient(to right,#10b981,#059669);padding:20px;border-radius:8px 8px 0 0;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">🙏 New Prayer Request</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <h2 style="color:#1f2937;margin-top:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{prayerTitle}}</h2>
              <div style="margin-bottom:15px;">
                <p style="margin:5px 0;"><strong>Requested by:</strong> {{requesterName}}</p>
              </div>
              <p><strong>Description:</strong></p>
              <div style="background-color:#ffffff;padding:15px;border-radius:6px;border-left:4px solid #10b981;">{{prayerDescriptionHtml}}</div>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#10b981" style="background-color:#10b981;border-radius:6px;">
                    <a href="{{appLink}}" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">View Prayer</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;color:#6b7280;font-size:14px;">
              <p style="margin:0 0 15px;">This prayer has been approved and is now active. Join us in prayer!</p>
              <p style="margin:0;font-size:12px;">
                To unsubscribe from emails, <a href="{{appLink}}" style="color:#6b7280;text-decoration:underline;">visit the app and open the Settings menu (⚙️ gear icon)</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'approved_prayer';

-- approved_update
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#3b82f6" style="background-color:#3b82f6;background-image:linear-gradient(to right,#3b82f6,#2563eb);padding:20px;border-radius:8px 8px 0 0;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">💬 Prayer Update</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <h2 style="color:#1f2937;margin-top:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Update for: {{prayerTitle}}</h2>
              <p style="margin:5px 0 15px 0;"><strong>Posted by:</strong> {{authorName}}</p>
              <p><strong>Original Prayer Request:</strong></p>
              <div style="background-color:#ecfdf5;padding:15px;border-radius:6px;border-left:4px solid #10b981;margin-bottom:20px;">
                <div style="margin:0 0 15px 0;">{{prayerDescriptionHtml}}</div>
                <p style="margin:15px 0 10px 0;"><strong>Update:</strong></p>
                <div style="background-color:#ffffff;padding:15px;border-radius:6px;border-left:4px solid #3b82f6;margin:0;">{{updateContentHtml}}</div>
              </div>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#3b82f6" style="background-color:#3b82f6;border-radius:6px;">
                    <a href="{{appLink}}" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">View Prayer</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;color:#6b7280;font-size:14px;">
              <p style="margin:0 0 15px;">Let's continue to lift this prayer up together.</p>
              <p style="margin:0;font-size:12px;">
                To unsubscribe from emails, <a href="{{appLink}}" style="color:#6b7280;text-decoration:underline;">visit the app and open the Settings menu (⚙️ gear icon)</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'approved_update';

-- denied_prayer
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#ef4444" style="background-color:#ef4444;background-image:linear-gradient(to right,#ef4444,#dc2626);padding:20px;border-radius:8px 8px 0 0;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">📋 Prayer Request Status</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <h2 style="color:#1f2937;margin-top:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{prayerTitle}}</h2>
              <p style="margin-bottom:15px;">Thank you for submitting your prayer request. After careful review, we are unable to approve this request at this time.</p>
              <div style="background-color:#fef2f2;border-left:4px solid #ef4444;padding:15px;border-radius:6px;margin:20px 0;">
                <p style="margin:0;color:#991b1b;"><strong>Reason:</strong></p>
                <p style="margin:10px 0 0 0;color:#991b1b;">{{denialReason}}</p>
              </div>
              <p style="margin-top:20px;"><strong>Your Submission:</strong></p>
              <div style="background-color:#ffffff;padding:15px;border-radius:6px;border:1px solid #e5e7eb;">{{prayerDescription}}</div>
              <p style="margin-top:20px;font-size:14px;color:#6b7280;">If you have questions or would like to discuss this decision, please feel free to contact the administrator.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#6b7280" style="background-color:#6b7280;border-radius:6px;">
                    <a href="{{appLink}}" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Visit Prayer App</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;color:#6b7280;font-size:14px;">
              <p style="margin:0;">This is an automated notification from your prayer app.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'denied_prayer';

-- denied_update
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#ef4444" style="background-color:#ef4444;background-image:linear-gradient(to right,#ef4444,#dc2626);padding:20px;border-radius:8px 8px 0 0;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">💬 Update Status</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <h2 style="color:#1f2937;margin-top:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Update for: {{prayerTitle}}</h2>
              <p style="margin-bottom:15px;">Thank you for submitting an update. After careful review, we are unable to approve this update at this time.</p>
              <div style="background-color:#fef2f2;border-left:4px solid #ef4444;padding:15px;border-radius:6px;margin:20px 0;">
                <p style="margin:0;color:#991b1b;"><strong>Reason:</strong></p>
                <p style="margin:10px 0 0 0;color:#991b1b;">{{denialReason}}</p>
              </div>
              <p style="margin-top:20px;"><strong>Your Update:</strong></p>
              <div style="background-color:#ffffff;padding:15px;border-radius:6px;border:1px solid #e5e7eb;">{{updateContent}}</div>
              <p style="margin-top:20px;font-size:14px;color:#6b7280;">If you have questions or would like to discuss this decision, please feel free to contact the administrator.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#6b7280" style="background-color:#6b7280;border-radius:6px;">
                    <a href="{{appLink}}" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Visit Prayer App</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;color:#6b7280;font-size:14px;">
              <p style="margin:0;">This is an automated notification from your prayer app.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'denied_update';

-- prayer_answered
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#10b981" style="background-color:#10b981;background-image:linear-gradient(to right,#10b981,#059669);padding:20px;border-radius:8px 8px 0 0;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">🎉 Prayer Answered</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <h2 style="color:#1f2937;margin-top:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Update for: {{prayerTitle}}</h2>
              <p style="margin:5px 0 15px 0;"><strong>Posted by:</strong> {{authorName}}</p>
              <p><strong>Original Prayer Request:</strong></p>
              <div style="background-color:#ecfdf5;padding:15px;border-radius:6px;border-left:4px solid #10b981;margin-bottom:20px;">
                <div style="margin:0 0 15px 0;">{{prayerDescriptionHtml}}</div>
                <p style="margin:15px 0 10px 0;"><strong>Update:</strong></p>
                <div style="background-color:#ffffff;padding:15px;border-radius:6px;border-left:4px solid #10b981;margin:0;">{{updateContentHtml}}</div>
              </div>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#10b981" style="background-color:#10b981;border-radius:6px;">
                    <a href="{{appLink}}" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">View Prayer</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;color:#6b7280;font-size:14px;">
              <p style="margin:0 0 15px;">Let's give thanks and praise for this answered prayer!</p>
              <p style="margin:0;font-size:12px;">
                To unsubscribe from emails, <a href="{{appLink}}" style="color:#6b7280;text-decoration:underline;">visit the app and open the Settings menu (⚙️ gear icon)</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'prayer_answered';

-- prayer_reminder
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#3b82f6" style="background-color:#3b82f6;background-image:linear-gradient(to right,#3b82f6,#2563eb);padding:20px;border-radius:8px 8px 0 0;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">⏰ Prayer Update Reminder</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <p>Hello {{requesterName}},</p>
              <p>This is a friendly reminder to update your prayer request if there have been any changes or answered prayers.</p>
              <div style="background-color:#ffffff;padding:15px;border-radius:6px;border-left:4px solid #3b82f6;margin:20px 0;">
                <p style="margin:5px 0;"><strong>Prayer:</strong> {{prayerTitle}}</p>
              </div>
              <p>You can add an update or mark it as answered by visiting the prayer app and clicking "Add Update" on your prayer.</p>
              <br/>
              <p style="margin:0;color:#991b1b;font-size:14px;">
                <strong>ℹ️ Important:</strong> After a period of inactivity, your prayer will be automatically archived and moved to the <strong>"Total Prayers"</strong> filter. The good news is that <strong>you can still update archived prayers at any time</strong>—simply add a new update to your prayer, and it will continue to receive prayer support from our community.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#3b82f6" style="background-color:#3b82f6;border-radius:6px;">
                    <a href="{{appLink}}" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Add Update Now</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;color:#6b7280;font-size:14px;">
              <p style="margin:0;">Praying with you,<br/>The Prayer Team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'prayer_reminder';

-- requester_approval
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#10b981" style="background-color:#10b981;background-image:linear-gradient(to right,#10b981,#059669);padding:20px;border-radius:8px 8px 0 0;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">✅ Prayer Approved</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <h2 style="color:#1f2937;margin-top:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{prayerTitle}}</h2>
              <p>Great news! Your prayer request has been approved and is now live on the prayer app.</p>
              <p><strong>Description:</strong></p>
              <div style="background-color:#ffffff;padding:15px;border-radius:6px;border-left:4px solid #10b981;">{{prayerDescription}}</div>
              <p style="margin-top:20px;">Your prayer is now being lifted up by our community. You will receive updates via email when the prayer status changes or when updates are posted.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#10b981" style="background-color:#10b981;border-radius:6px;">
                    <a href="{{appLink}}" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">View Your Prayer</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;color:#6b7280;font-size:14px;">
              <p style="margin:0;">Thank you for your faithfulness in prayer!</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'requester_approval';

-- subscriber_welcome
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F8F7F5;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F8F7F5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#39704D" style="background-color:#39704D;padding:30px 20px;border-radius:8px 8px 0 0;">
              <h1 style="color:#F8F7F5;margin:0;font-size:28px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;text-align:center;">
                Welcome to the Cross Point Prayer Community! 🙏
              </h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#E8E5E1" style="background-color:#E8E5E1;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;border:1px solid #D1CCC4;border-top:none;">
              <p style="font-size:16px;margin-bottom:20px;">Hello,</p>
              <p style="margin-bottom:20px;">
                We're so glad you've joined our prayer community! You're now connected
                to a group of people who believe in the power of prayer and the
                importance of lifting up one another.
              </p>
              <div style="background-color:#D1CCC4;border-left:4px solid #39704D;padding:20px;border-radius:6px;margin:25px 0;">
                <h3 style="margin-top:0;color:#004B3D;">What You Can Do:</h3>
                <ul style="margin:10px 0;padding-left:20px;color:#3E5266;">
                  <li style="margin:8px 0;"><strong>Submit Prayer Requests</strong> – Share what you would like prayer for.</li>
                  <li style="margin:8px 0;"><strong>Update Previous Requests</strong> – Keep the church up to date on the status of your requests.</li>
                  <li style="margin:8px 0;"><strong>Receive Prayer Updates</strong> – Stay connected to how God is moving.</li>
                  <li style="margin:8px 0;"><strong>Prayer Prompts</strong> – Explore the Prompts for ideas of what to pray for.</li>
                  <li style="margin:8px 0;"><strong>Be Encouraged</strong> – See what God has done in the Answered prayers.</li>
                  <li style="margin:8px 0;"><strong>Focused Prayer</strong> – Use the Pray button for a focused time of prayer for each request.</li>
                  <li style="margin:8px 0;"><strong>Lift Others Up</strong> – Your prayers make a difference.</li>
                </ul>
              </div>
              <div style="background-color:#F8D97A;border:1px solid #B8860B;border-radius:6px;padding:15px;margin:25px 0;">
                <p style="margin:0;color:#6B6256;">
                  <strong>💡 Pro Tip:</strong> Don't want to receive prayer request emails? Unsubscribe any time under the settings menu.
                </p>
              </div>
              <div style="background-color:#E8E5E1;border-left:4px solid #39704D;padding:18px;border-radius:6px;margin:25px 0;">
                <p style="margin:0;color:#3E5266;">
                  <strong>📧 Quick Gmail Tip:</strong><br />
                  If the Prayer Site opens inside the Gmail app, it can be tough to switch back to grab your login code.
                  <br /><br />
                  Just open the menu in the top corner and choose <em>"Open in browser"</em>. That makes it much easier to move between Gmail and the Prayer Site.
                  <br /><br />
                  You can also copy the link and paste it into your browser if needed.
                </p>
              </div>
              <h3 style="margin-top:25px;margin-bottom:10px;color:#3E5266;">Have Feedback or Questions?</h3>
              <p style="margin-bottom:15px;">
                We'd love to hear from you! Your thoughts help us create a better experience for everyone.
              </p>
              <p style="margin-bottom:15px;">
                <strong>📝 Share Your Feedback:</strong> Use the feedback form in the setting menu under “Send Feedback.”
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#39704D" style="background-color:#39704D;border-radius:6px;">
                    <a href="{{appLink}}info" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Enter the Prayer Site</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;color:#6b7280;font-size:14px;">
              <p style="margin:10px 0;"><strong>Blessings,</strong><br />Your Prayer Community Team</p>
              <p style="margin:10px 0;font-size:12px;">
                You're receiving this email because you've joined our prayer community.
                This is a one-time welcome message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'subscriber_welcome';

-- user_hourly_prayer_reminder
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;">
          <tr>
            <td bgcolor="#2563eb" style="background-color:#2563eb;background-image:linear-gradient(135deg,#3b82f6,#2563eb);padding:20px 24px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">Time to pray</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 20px;">
              <p style="margin:0 0 20px;color:#1f2937;font-size:16px;line-height:1.5;">Take a moment to pray.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:8px auto 24px;">
                <tr>
                  <td bgcolor="#2563eb" style="background-color:#2563eb;border-radius:8px;">
                    <a href="{{appLink}}" style="display:inline-block;padding:12px 28px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Open prayer app</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">You can turn off these reminders anytime in <strong style="color:#4b5563;">Settings</strong> → <strong style="color:#4b5563;">Prayer reminders</strong> in the app.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'user_hourly_prayer_reminder';

-- user_hourly_prayer_reminder_with_spotlight
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#2563eb" style="background-color:#2563eb;background-image:linear-gradient(to right,#3b82f6,#2563eb);padding:20px;border-radius:8px 8px 0 0;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">🙏 Prayer spotlight</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <h2 style="color:#1f2937;margin-top:0;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{spotlightPrayerTitle}}</h2>
              <p style="margin:5px 0 15px 0;"><strong>{{spotlightPrayerKind}}</strong></p>
              <p><strong>Requested by:</strong> {{spotlightPrayerRequester}}</p>
              <div style="background-color:#ecfdf5;padding:15px;border-radius:6px;border-left:4px solid #10b981;margin-bottom:20px;">
                <p style="margin:0;white-space:pre-wrap;">{{spotlightPrayerDescription}}</p>
                {{spotlightUpdateBlockHtml}}
              </div>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:30px auto 0;">
                <tr>
                  <td bgcolor="#3b82f6" style="background-color:#3b82f6;border-radius:6px;">
                    <a href="{{appLink}}" style="display:inline-block;padding:12px 24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">Open prayer app</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;color:#6b7280;font-size:14px;">
              <p style="margin:0 0 15px;">Take a moment to pray. Spotlight items are current community prayers or your personal prayers (not answered).</p>
              <p style="margin:0;font-size:12px;">
                To change hourly reminders, <a href="{{appLink}}" style="color:#6b7280;text-decoration:underline;">open the app</a> and go to <strong>Settings</strong> → <strong>Prayer reminders</strong> (gear icon).
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'user_hourly_prayer_reminder_with_spotlight';

-- verification_code
UPDATE public.email_templates
SET html_body = $html_body$
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
          <tr>
            <td bgcolor="#10b981" style="background-color:#10b981;padding:20px;border-radius:8px 8px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;text-align:center;">Verification Code</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
              <p>You requested to {{actionDescription}}. Please use the verification code below:</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
                <tr>
                  <td bgcolor="#ffffff" style="background-color:#ffffff;padding:20px;border-radius:8px;text-align:center;font-size:32px;font-weight:bold;color:#10b981;letter-spacing:8px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{code}}</td>
                </tr>
              </table>
              <p>This code will expire in 15 minutes.</p>
              <p>If you didn't request this code, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;text-align:center;color:#6b7280;font-size:14px;">
              <p style="margin:0;">This is an automated message. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

$html_body$,
    updated_at = now()
WHERE template_key = 'verification_code';
