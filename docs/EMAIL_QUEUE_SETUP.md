# Email Queue Setup Guide

## Overview
The email queue system sends bulk notifications (approved prayers and updates) to all active email subscribers. Only admin-approved prayers/updates trigger email notifications.

## Database Setup

### Initial Table Creation
The `email_queue` table was created with the migration:
- File: `supabase/migrations/20260109_create_email_queue_table.sql`

This migration:
- Creates the email_queue table with columns for recipient, template_key, status, retry attempts, etc.
- Enables Row Level Security (RLS)
- Sets up admin-only insert policy

### Updating RLS Policies (for existing deployments)
If you already have the email_queue table from an earlier deployment, you need to update the RLS policies:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of: `supabase/migrations/20260109_update_email_queue_rls.sql`
4. Click "Run" to apply the migration

This will:
- Drop the overly-restrictive old policies
- Create new policies that only allow admins to insert emails into the queue
- Allow the background processor (service_role) to read and update queue items

## Workflow

### When a Prayer/Update is Approved by Admin:
1. Admin clicks "Approve" in the admin panel
2. `admin-data.service.ts` calls `emailNotification.sendApprovedPrayerNotification()`
3. This method:
   - Queries the `email_subscribers` table for all active subscribers (optout=false, blocked=false)
   - For each subscriber, calls `enqueueEmail()` to add a row to `email_queue`
   - The INSERT is protected by RLS policy - only admins can insert

### Background Processor:
1. GitHub Actions workflow runs every 5 minutes: `.github/workflows/process-email-queue.yml`
2. Runs `scripts/process-email-queue.ts` which:
   - Fetches pending emails from the queue (using service_role credentials)
   - Gets the email template and applies variables
   - Sends each email via Microsoft Graph API
   - Marks as 'sent' or 'failed' in the queue
   - Retries failed emails up to 5 times with exponential backoff

## Troubleshooting

### Email not appearing in queue table

1. **Check admin status**: Verify the logged-in user is marked as `is_admin=true` in the `email_subscribers` table
2. **Check browser console**: Look for error messages from `sendApprovedPrayerNotification()`
3. **Check Supabase logs**: Go to Supabase dashboard → Logs → check for RLS policy violations
4. **Verify migration was applied**: Run this in Supabase SQL Editor:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'email_queue';
   ```
   You should see policies for "Only admins can enqueue emails" and "Service role can process queue"

### Migration Syntax Issues

The RLS policy uses `auth.email()` which is a built-in Supabase function that returns the current user's email from the auth.users table.

It checks:
- User is authenticated (auth.role() = 'authenticated')
- User's email exists in email_subscribers table
- User has is_admin = true
- User has is_active = true

## GitHub Secrets Required

For the background processor to work, set these secrets in GitHub:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Supabase service role key (has full access)
- `AZURE_TENANT_ID`: Azure/Microsoft 365 tenant ID
- `AZURE_CLIENT_ID`: Azure app registration client ID
- `AZURE_CLIENT_SECRET`: Azure app registration client secret
- `MAIL_SENDER_ADDRESS`: Email address to send from (e.g., notifications@yourchurch.org)
- `MAIL_FROM_NAME`: Display name for sender (e.g., "Prayer App Notifications")

## Email Templates

The system uses these email templates from the `email_templates` table:
- `approved_prayer`: Sent when a prayer is approved
- `approved_update`: Sent when a prayer update is approved
- `prayer_answered`: Sent when a prayer is marked as answered

Templates support variable substitution with `{{variableName}}` syntax.

## Unsubscribe

Each email includes:
1. **List-Unsubscribe header** (RFC 8058): `<mailto:crosspointeprayer@cp-church.org?subject=unsubscribe>`
   - Email clients display an "Unsubscribe" button
   
2. **In-email unsubscribe link**: Text in email footer directing to app settings

Users can unsubscribe via:
- Email client's unsubscribe button (sends mailto)
- Settings → Email Preferences in the app
