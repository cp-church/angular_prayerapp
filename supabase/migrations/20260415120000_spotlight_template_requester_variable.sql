-- Document {{spotlightPrayerRequester}} on the hourly spotlight template (Edge fills it; see send-user-hourly-prayer-reminders).
UPDATE public.email_templates
SET description = E'Hourly spotlight email: random pick from all approved current community prayers plus that subscriber''s personal prayers (excluding Answered). Variables: {{appLink}}, {{spotlightPrayerKind}}, {{spotlightPrayerTitle}}, {{spotlightPrayerFor}}, {{spotlightPrayerRequester}} (community: prayers.requester; personal spotlight: empty), {{spotlightPrayerDescription}}, {{updateContent}}, {{spotlightUpdateBlockHtml}} (Update subsection HTML; empty when no update), {{spotlightLatestUpdateHtml}} (legacy alias), {{spotlightUpdateTextSection}}.'
WHERE template_key = 'user_hourly_prayer_reminder_with_spotlight';
