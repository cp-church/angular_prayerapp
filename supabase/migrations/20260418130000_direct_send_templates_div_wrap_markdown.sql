-- Templates rendered directly from `EmailNotificationService` (not via the
-- queue) inject sanitized HTML into the `{{prayerDescription}}` /
-- `{{updateContent}}` placeholder. Those outputs are block-level
-- (`<p>`, `<ul>`, `<blockquote>`, `<ol>`, `<pre>`, `<h3>`, `<h4>`), but the
-- current templates wrap the placeholder in a `<p>`, producing invalid
-- nested HTML. Swap the immediate wrapper to a `<div>` so strict email
-- clients don't drop the inner block elements.

-- admin_notification_prayer
UPDATE public.email_templates
SET html_body = replace(
      html_body,
      '<p style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">{{prayerDescription}}</p>',
      '<div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">{{prayerDescription}}</div>'
    ),
    updated_at = now()
WHERE template_key = 'admin_notification_prayer';

-- admin_notification_update (multi-line <p ...> wrapper; anchor on unique {{updateContent}})
UPDATE public.email_templates
SET html_body = regexp_replace(
      html_body,
      '<p\s+style="[^"]*"\s*>\s*\{\{updateContent\}\}\s*</p>',
      '<div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">{{updateContent}}</div>'
    ),
    updated_at = now()
WHERE template_key = 'admin_notification_update';

-- denied_prayer
UPDATE public.email_templates
SET html_body = replace(
      html_body,
      '<p style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">{{prayerDescription}}</p>',
      '<div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">{{prayerDescription}}</div>'
    ),
    updated_at = now()
WHERE template_key = 'denied_prayer';

-- denied_update
UPDATE public.email_templates
SET html_body = replace(
      html_body,
      '<p style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">{{updateContent}}</p>',
      '<div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">{{updateContent}}</div>'
    ),
    updated_at = now()
WHERE template_key = 'denied_update';

-- requester_approval
UPDATE public.email_templates
SET html_body = replace(
      html_body,
      '<p style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">{{prayerDescription}}</p>',
      '<div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">{{prayerDescription}}</div>'
    ),
    updated_at = now()
WHERE template_key = 'requester_approval';
