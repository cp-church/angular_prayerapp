# Angular Prayer App - Production Deployment Guide

## Comprehensive Deployment Instructions

This guide provides step-by-step instructions for deploying the Angular Prayer App to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Building for Production](#building-for-production)
5. [Deploying to Vercel](#deploying-to-vercel)
6. [Domain & SSL Setup](#domain--ssl-setup)
7. [Monitoring Setup](#monitoring-setup)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved: `ng build`
- [ ] No console.log statements in production code (done)
- [ ] All tests passing
- [ ] No hardcoded secrets or credentials
- [ ] Environment variables properly configured

### Security
- [ ] Admin users created in database
- [ ] RLS policies enabled on all tables
- [ ] Email verification enabled
- [ ] Session timeouts configured
- [ ] API keys secured in environment variables
- [ ] Database backups configured

### Infrastructure
- [ ] Supabase project created
- [ ] Database migrations run
- [ ] Edge functions deployed
- [ ] Email service configured
- [ ] Error tracking (Sentry) set up
- [ ] Analytics (Clarity) configured

### Configuration
- [ ] `.env.production` created
- [ ] Sentry DSN configured
- [ ] Clarity project ID configured
- [ ] Supabase credentials verified
- [ ] Email service credentials set

### Documentation
- [ ] Backup procedures documented
- [ ] Recovery procedures tested
- [ ] Scaling plan documented
- [ ] Monitoring thresholds set

---

## Environment Setup

### 1. Create Production Environment File

Create `.env.production` in project root:

```bash
# Supabase - Production Project
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_SUPABASE_SERVICE_KEY=your-production-service-key

# Monitoring
VITE_SENTRY_DSN=https://your-key@ingest.sentry.io/your-project-id
VITE_CLARITY_PROJECT_ID=your-clarity-project-id

# App Configuration
VITE_APP_VERSION=1.0.0
```

**Security Note:** Never commit `.env.production` to version control. Add to `.gitignore`.

### 2. Verify Supabase Production Project

```bash
# Test connection
curl https://your-project.supabase.co/rest/v1/admin_settings \
  -H "apikey: your-production-anon-key"
```

Expected response: 200 OK with settings data

### 3. Configure Supabase Auth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Email" provider
3. Configure Magic Link settings:
   - Validity period: 24 hours
   - Email type: Magic Link

4. Set redirect URLs:
   ```
   https://yourdomain.com
   https://yourdomain.com/admin
   ```

### 4. Deploy Edge Functions

```bash
cd supabase/functions

# Deploy each function
supabase functions deploy send-verification-code
supabase functions deploy send-email
supabase functions deploy verify-code
supabase functions deploy validate-approval-code
supabase functions deploy check-admin-status
supabase functions deploy planning-center-lookup
supabase functions deploy send-prayer-reminders
```

Verify functions deployed:
```bash
supabase functions list
```

---

## Database Configuration

### 1. Run Migrations

```bash
# Connect to production database
supabase migration list

# Run all pending migrations
supabase db pull  # Pull production schema
```

### 2. Create Initial Admin User

```sql
-- In Supabase SQL Editor

-- Insert admin user
INSERT INTO email_subscribers (email, is_admin, is_active)
VALUES ('admin@yourdomain.com', true, true)
ON CONFLICT (email) DO UPDATE SET is_admin = true;

-- Create admin settings if not exist
INSERT INTO admin_settings (id, require_email_verification)
VALUES (1, true)
ON CONFLICT (id) DO NOTHING;
```

### 3. Initialize Admin Settings

```sql
UPDATE admin_settings SET
  require_email_verification = true,
  verification_code_expiry_minutes = 10,
  inactivity_timeout_minutes = 30,
  max_session_duration_minutes = 480,
  app_title = 'Prayer App',
  app_subtitle = 'Share your prayer requests',
  use_logo = false
WHERE id = 1;
```

### 4. Enable RLS Policies

Ensure all tables have RLS enabled:

```sql
-- Enable RLS on all tables
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables
```

### 5. Configure Email Service

In Supabase:
1. Go to Authentication → Email Templates
2. Configure email sender:
   - From email: noreply@yourdomain.com
   - From name: Prayer App
3. Customize email templates

For production emails, configure SMTP:
1. Settings → Email Provider
2. Set SMTP credentials:
   - Host: your-email-provider
   - Port: 587 (or 465)
   - Username & Password
   - Encryption: TLS

---

## Building for Production

### 1. Build Application

```bash
# Install dependencies (if not already done)
npm install

# Build for production
ng build --configuration production

# Output will be in: dist/prayerapp/
```

### 2. Verify Build

```bash
# Check build size
ls -lh dist/prayerapp/

# Expected main files:
# - main.*.js (~200KB)
# - styles.*.css (~85KB)
# - polyfills.*.js (~90KB)
# - chunks/*.js (various sizes)
```

### 3. Test Production Build Locally

```bash
# Serve production build locally
npx http-server dist/prayerapp/ -p 8080 -o

# Test at http://localhost:8080
# Test prayer submission
# Test admin login
# Test email verification
```

---

## Deploying to Vercel

### 1. Connect Repository to Vercel

```bash
# Option 1: Via CLI
npm install -g vercel
vercel login
vercel link
```

Or visit: https://vercel.com/import

### 2. Configure Vercel Project

In Vercel Dashboard:
1. Select repository
2. Framework: Angular
3. Build Command: `ng build --configuration production`
4. Output Directory: `dist/prayerapp`
5. Install Command: `npm install`

### 3. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key
VITE_SUPABASE_SERVICE_KEY = your-service-key
VITE_SENTRY_DSN = your-sentry-dsn
VITE_CLARITY_PROJECT_ID = your-clarity-id
VITE_APP_VERSION = 1.0.0
```

**Important:** Set these for Production, Preview, and Development if needed.

### 4. Deploy

```bash
# Deploy main branch
git push origin main

# Or manually via CLI
vercel --prod
```

Monitor deployment in Vercel Dashboard. Build typically takes 2-3 minutes.

### 5. Verify Deployment

After deployment completes:
1. Visit https://yourdomain.vercel.app
2. Test home page loads
3. Test prayer submission
4. Test admin login
5. Check Sentry dashboard for errors
6. Monitor Vercel analytics

---

## Domain & SSL Setup

### 1. Add Custom Domain

In Vercel Dashboard → Project Settings → Domains:

1. Add your domain (e.g., prayerapp.com)
2. Add nameserver records to your domain registrar:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
   - ns3.vercel-dns.com
   - ns4.vercel-dns.com

3. Or add A records:
   - A: 76.76.19.61 → prayerapp.com
   - A: 76.76.19.62 → prayerapp.com
   - CNAME: www → cname.vercel-dns.com

### 2. SSL/HTTPS

SSL is automatically configured by Vercel. Takes ~10 minutes to activate.

Verify: https://yourdomain.com (should have green lock)

### 3. Configure Supabase Redirect URLs

Update Supabase Auth settings with your production domain:

```
https://yourdomain.com
https://yourdomain.com/admin
https://www.yourdomain.com
https://www.yourdomain.com/admin
```

---

## Monitoring Setup

### 1. Sentry Configuration

1. Create Sentry project (sentry.io)
2. Create release:
   ```bash
   npm install @sentry/cli --save-dev
   sentry-cli releases create <version>
   sentry-cli releases files <version> upload-sourcemaps ./dist
   ```

3. Get DSN and add to `.env.production`
4. Verify in Sentry Dashboard → Issues

### 2. Clarity Configuration

1. Create Clarity project (clarity.microsoft.com)
2. Get project ID
3. Add to `.env.production`
4. Verify in Clarity Dashboard → Sessions

### 3. Vercel Analytics

Vercel provides built-in analytics:
1. Dashboard → Analytics
2. Monitor:
   - Core Web Vitals
   - Page load times
   - Error rates
   - Unique visitors

### 4. Database Monitoring

In Supabase Dashboard:
1. Monitor → Realtime
2. Monitor → API
3. Monitor → Edge Functions

Set alerts for:
- High query latency
- Function errors
- Subscription failures

---

## Post-Deployment Verification

### 1. Functional Testing

Test each feature:
- [ ] Home page loads
- [ ] Prayer submission works
- [ ] Email verification codes received
- [ ] Prayers appear in admin portal
- [ ] Admin can approve prayers
- [ ] Prayers appear on home page after approval
- [ ] Prayer updates work
- [ ] Prayer deletions work
- [ ] Settings/preferences work
- [ ] Dark mode toggles
- [ ] Mobile responsive
- [ ] Accessibility (Tab navigation, screen reader)

### 2. Performance Testing

Check performance metrics:

```bash
# Lighthouse audit
npm install -g lighthouse
lighthouse https://yourdomain.com --view
```

Target scores:
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

### 3. Security Testing

- [ ] Verify HTTPS active
- [ ] Check SSL certificate valid
- [ ] Verify environment variables not exposed
- [ ] Test RLS policies (can't access other user data)
- [ ] Test email verification required
- [ ] Test session timeouts working

### 4. Monitoring Verification

- [ ] Sentry receiving errors
- [ ] Clarity tracking sessions
- [ ] Vercel analytics active
- [ ] Error alerts configured
- [ ] Performance alerts configured

---

## Backup & Recovery

### 1. Database Backup Strategy

**Manual Backup:**
```bash
# Export database
pg_dump \
  --host=$SUPABASE_HOST \
  --username=$SUPABASE_USER \
  --password \
  --database=postgres > backup.sql

# Compress
gzip backup.sql
```

**Automated Backup:**
In Supabase Dashboard:
1. Settings → Backups
2. Enable automated daily backups
3. Retention: 14 days minimum

### 2. Recovery Procedure

If database corrupted:

1. **Stop application** (pause Vercel deployment)
2. **Restore from backup:**
   ```bash
   gunzip backup.sql.gz
   psql -U postgres -h $SUPABASE_HOST < backup.sql
   ```
3. **Verify data integrity**
4. **Resume application**

### 3. Backup Schedule

- **Daily:** Automated by Supabase (retained 14 days)
- **Weekly:** Manual backup to secure storage
- **Monthly:** Backup to cold storage (S3, etc.)

### 4. Disaster Recovery Plan

If complete service failure:

1. Deploy to alternate domain/server
2. Restore database from backup
3. Update DNS/domain to point to new location
4. Verify all features working
5. Migrate users/data as needed

---

## Scaling Considerations

### When to Scale

Monitor these metrics:
- Database connections > 80% of limit
- Query latency > 1 second
- Edge function duration > 5 seconds
- Email sending failures > 1%

### Scaling Options

1. **Database:**
   - Upgrade Supabase plan
   - Enable connection pooling
   - Add read replicas
   - Optimize slow queries

2. **Application:**
   - Already uses Vercel autoscaling
   - Monitor build times
   - Monitor function durations

3. **Email:**
   - Increase email service plan
   - Implement email queue
   - Add rate limiting

---

## Troubleshooting Deployment Issues

### Issue: Build Fails

**Check:**
1. Vercel build logs
2. All environment variables set
3. No TypeScript errors locally
4. All dependencies in package.json

**Fix:**
```bash
npm install
ng build --configuration production
# Should complete without errors
```

### Issue: Environment Variables Not Found

**Check:**
1. Variables set in Vercel dashboard
2. Correct environment (Production/Preview)
3. Variable names exact match

**Fix:**
1. Redeploy after adding variables
2. Or restart deployment: Vercel Dashboard → Redeploy

### Issue: Database Connection Failed

**Check:**
1. VITE_SUPABASE_URL correct
2. VITE_SUPABASE_ANON_KEY correct
3. Supabase project running
4. Network connectivity

**Test Connection:**
```bash
curl https://your-project.supabase.co/rest/v1/ \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

### Issue: Emails Not Sending

**Check:**
1. Edge function `send-email` deployed
2. Email service configured in Supabase
3. Function logs for errors
4. Admin email notifications enabled

**Debug:**
1. Check Supabase Functions logs
2. Check email provider logs
3. Verify function can reach email service
4. Test with manual email send

### Issue: Admin Portal Not Working

**Check:**
1. Supabase auth configured
2. Admin user exists in database
3. Magic link redirect URL configured
4. Session timeouts not too aggressive

**Test:**
1. Check browser console for errors
2. Check Sentry dashboard
3. Test magic link email received
4. Verify admin status in database

---

## Monitoring Checklist (Post-Deployment)

Daily:
- [ ] Check Sentry for new errors
- [ ] Review Clarity sessions
- [ ] Monitor database performance
- [ ] Check email sending status

Weekly:
- [ ] Review error trends
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Backup database

Monthly:
- [ ] Security audit
- [ ] Database optimization
- [ ] Performance optimization
- [ ] Cost review

---

## Support & Rollback

### Rollback Procedure

If deployment breaks production:

1. In Vercel Dashboard:
   - Go to Deployments
   - Find last working deployment
   - Click "Promote to Production"

2. Or redeploy previous commit:
   ```bash
   git revert <bad-commit>
   git push origin main
   # Vercel auto-deploys
   ```

### Getting Help

- **Build Issues:** Check Vercel build logs
- **Database Issues:** Check Supabase dashboard
- **Email Issues:** Check Supabase function logs
- **Error Tracking:** Check Sentry dashboard
- **Analytics:** Check Clarity dashboard

---

## Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Angular Deployment](https://angular.io/guide/deployment)
- [Sentry Setup](https://docs.sentry.io/platforms/javascript/guides/angular/)
- [Clarity Docs](https://clarity.microsoft.com/docs)

---

**Last Updated:** December 20, 2025
**Status:** Complete Deployment Guide
