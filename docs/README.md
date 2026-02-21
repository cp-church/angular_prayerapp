# Prayer App Documentation

Complete documentation for the Cross Pointe Church Prayer Management System.

## Quick Navigation

- **[CHANGELOG.md](CHANGELOG.md)** - Project history and major milestones
- **[SETUP.md](SETUP.md)** - Installation, configuration, and deployment
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Architecture, testing, development, timezone handling, and component documentation
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Solutions to common issues
- **[Capacitor (iOS/Android)](Capacitor/)** - Native app build, push notifications, and backend setup ([CAPACITOR_GETTING_STARTED.md](Capacitor/CAPACITOR_GETTING_STARTED.md), [CAPACITOR_BACKEND_SETUP.md](Capacitor/CAPACITOR_BACKEND_SETUP.md))

---

## 📋 What This App Does

A comprehensive prayer request management system for Cross Pointe Church built with:
- **Frontend**: Angular 19+ with standalone components
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Auth**: Supabase Auth with email verification
- **Email**: Microsoft 365 Graph API
- **Sync**: Planning Center integration
- **Testing**: Vitest with 2840+ tests

## 🎯 Core Capabilities

- ✅ Submit prayer requests (public, requires approval)
- ✅ Add prayer updates (logged-in users)
- ✅ Email notifications (configurable)
- ✅ Admin approval workflow
- ✅ Real-time updates via Supabase
- ✅ Prayer timer & printable lists
- ✅ Personal prayers (private user prayers)
- ✅ Theme system (light/dark)
- ✅ Planning Center contact lookup
- ✅ Planning Center members list mapping (filter prayers by list members)
- ✅ Badge indicators (unread prayers/prompts)

## 🚀 Getting Started

### For Users
- View prayers at [Cross Pointe Prayer App](https://prayers.crosspointe.church)
- Submit new requests
- Configure your email preferences
- Use on mobile (iOS/Android)

### For Developers
1. Clone repo and run `npm install`
2. Copy `.env.example` to `.env.local`
3. Configure Supabase credentials
4. Run `npm run dev` for local development
5. Run `npm test` for tests

### For Deployment
See [SETUP.md - Deployment section](SETUP.md#deployment)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page components (home, admin, etc)
│   ├── services/         # Business logic services
│   ├── guards/           # Route guards
│   ├── types/            # TypeScript types
│   └── app.routes.ts     # Route definitions
├── environments/         # Environment configs
├── lib/                  # Utility libraries
├── styles.css            # Global styles
└── main.ts              # App entry point
```

---

## 🔑 Key Concepts

### Prayer States
- **Pending**: Awaiting admin approval
- **Approved**: Visible to all users
- **Denied**: Rejected by admin (user notified via email)
- **Answered**: Prayer was answered (user marks it)

### User Roles
- **Anonymous**: Can submit prayer requests only
- **Authenticated**: Can submit, update, manage prayers
- **Admin**: Can approve/deny, manage settings

### Email and Push Notifications
- **Email:** Built on Microsoft 365 Graph API; queue-based processing; HTML templates; subscriber management. **`is_active`** on `email_subscribers` controls whether a user receives **mass email** (new/approved prayers, updates). Turning off "email notifications" only stops those bulk emails; direct emails (e.g. your prayer approved/denied) still go out.
- **Push (native app):** Controlled by **`receive_push`** on `email_subscribers`. Push is set to `true` only when the user installs the app and a device token is registered; default is `false`. Admins have a separate **`receive_admin_push`** for admin alerts. See [Capacitor docs](Capacitor/CAPACITOR_BACKEND_SETUP.md) for setup. When an admin approves a prayer or update, the requester/author receives a push notification if they have push enabled.

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **SETUP.md** | Installation, Supabase, email, Planning Center, deployment |
| **DEVELOPMENT.md** | Architecture, testing, performance optimization |
| **TROUBLESHOOTING.md** | Common errors and solutions |
| **CHANGELOG.md** | Project milestones and completed features |
| **Capacitor/** | iOS/Android native app, push notifications, backend checklist |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 19, TypeScript, TailwindCSS |
| **Backend** | Supabase (PostgreSQL, Edge Functions) |
| **Auth** | Supabase Auth, Email verification |
| **Email** | Microsoft 365 Graph API |
| **Testing** | Vitest, Playwright (E2E) |
| **Hosting** | Vercel |
| **Monitoring** | Clarity Analytics, Error logging |

---

## 📞 Support & Issues

- **Questions?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Found a bug?** Open an issue on GitHub
- **Have a suggestion?** Start a discussion

---

## 📄 License

Copyright © 2024-2026 Cross Pointe Church. All rights reserved.
