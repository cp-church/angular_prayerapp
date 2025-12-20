# Church Prayer Manager

A modern, responsive web application for managing prayer requests in your church community. Built with **Angular 19+**, TypeScript, Vite, and Supabase.

## 📚 Documentation

**Complete documentation available in [`docs/`](docs/README.md)**

Quick links:
- **[Features Guide](docs/FEATURES.md)** - Complete feature overview and usage
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deploy to production with Vercel
- **[Email Notifications](docs/EMAIL_NOTIFICATIONS.md)** - Email system and configuration
- **[Testing Guide](docs/TESTING.md)** - Unit and integration testing with Jasmine/Karma
- **[Performance Guide](docs/PERFORMANCE.md)** - Optimization strategies and best practices
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Accessibility Guide](docs/ACCESSIBILITY.md)** - WCAG compliance and a11y testing

## Tech Stack

- **Framework**: Angular 19+ with standalone components
- **Language**: TypeScript 5.6+
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with dark mode support
- **Backend**: Supabase (PostgreSQL + Edge Functions + RLS)
- **Real-time**: RxJS observables and Supabase real-time subscriptions
- **Testing**: Jasmine + Karma
- **Error Tracking**: Sentry
- **Analytics**: Microsoft Clarity
- **Deployment**: Vercel

## Features

### 🙏 Prayer Management
- **Add Prayer Requests**: Create new prayer requests with titles, descriptions, categories, and requester information
- **Status Tracking**: Track prayers through various status stages (pending, approved, active, answered, closed)
- **Updates**: Add prayer updates to track progress and answered prayers
- **Categories**: Organize prayers by custom prayer types
- **Admin Approval**: Moderation system with approval workflow

### 📧 Email Notifications
- **Prayer Reminders**: Automated email reminders for pending prayers
- **Prayer Updates**: Notify subscribers when prayers are updated
- **Approval Notifications**: Alert users when their prayers are approved
- **Customizable Frequency**: Users control email notification preferences
- **9+ notification types** including approval, denial, status changes, and more

### 📱 User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Updates**: Live prayer updates using Supabase real-time subscriptions
- **Theme Support**: Light and dark mode with persistent user preferences
- **Advanced Filtering**: Search and filter prayers by category, status, or keywords
- **Printable Lists**: Generate printable prayer request and prayer prompt lists

### ⚙️ Admin Portal
- **Prayer Moderation**: Review, approve, or deny prayer requests and updates
- **User Management**: Manage admin access and user permissions
- **Email Settings**: Configure email notifications and subscriber lists
- **Analytics Dashboard**: View site statistics and prayer metrics
- **Session Management**: Configurable inactivity timeout and max session duration
- **Content Management**: Manage prayer types, prompts, and app branding

### 🎨 Modern Interface
- Clean, intuitive design focused on readability and accessibility
- WCAG 2.1 AA accessibility compliance with ARIA labels
- Keyboard navigation support
- Dark mode with system preference detection
- Color-coded prayer statuses and categories

### 🔒 Security Features
- **Row Level Security (RLS)**: Database security at the row level
- **Email Verification**: Verify user email addresses before access
- **Admin Authentication**: Session-based admin authentication
- **Approval Workflow**: All user-generated content requires admin approval

## Getting Started

### Prerequisites
- Node.js 18+ (required for Angular 19+)
- npm or yarn package manager

### Installation & Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

3. **Open your browser**
   Navigate to `http://localhost:4200`

### Building for Production

```bash
npm run build
```

The production build will be created in the `dist/prayerapp` directory.

## Usage Guide

### Adding a Prayer Request
1. Navigate to the home page
2. Click the "Submit Prayer" button
3. Fill out the prayer request form with details
4. Submit your prayer request for admin approval

### Tracking Prayer Status
- View all prayers with their current status
- Filter prayers by status, category, or search term
- Check email for notifications when your prayer is approved or updated

### Prayer Updates
- Add updates to track prayer progress
- View all updates on the prayer request card
- Get notified of updates from prayers you're following

### Admin Portal
- Access the admin dashboard for moderation
- Approve, deny, or edit pending prayer requests and updates
- Manage email settings and notification preferences
- View analytics and site statistics
- Configure session timeouts and session duration limits

## Documentation Structure

The comprehensive documentation includes:

- **[FEATURES.md](docs/FEATURES.md)** - Detailed feature descriptions and user workflows
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment with Vercel and environment setup
- **[EMAIL_NOTIFICATIONS.md](docs/EMAIL_NOTIFICATIONS.md)** - Email system, templates, and configuration
- **[TESTING.md](docs/TESTING.md)** - Testing approach with Jasmine/Karma and TestBed examples
- **[PERFORMANCE.md](docs/PERFORMANCE.md)** - Performance optimization, bundle analysis, and best practices
- **[ACCESSIBILITY.md](docs/ACCESSIBILITY.md)** - WCAG compliance, a11y testing, and color contrast verification
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues, debugging guides, and solutions

See [docs/README.md](docs/README.md) for the complete documentation index.

---

*Built with ❤️ for church communities*
```
