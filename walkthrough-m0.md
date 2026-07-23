# 🚀 OutreachPro — Cold Email Automation Platform (Foundation Walkthrough)

We have built the **Beginner Foundation** milestone for OutreachPro, a full-stack cold email outreach automation web application built with Next.js 14, TypeScript, Tailwind CSS, PostgreSQL (Prisma ORM + Neon), NextAuth.js v5, Nodemailer, ImapFlow, and Upstash QStash.

Everything is fully implemented end-to-end with real database storage, background job processing, email sending/receiving, and tracking.

---

## 📸 Key Features & Implementation Summary

### 1. 🔒 Authentication & Multi-Tenancy
- **Sign Up & Login**: NextAuth.js v5 with credentials provider (`/login`, `/signup`).
- **Data Security**: All databases tables (email accounts, lead lists, campaigns, inbox) are strictly scoped per-user (`userId`).
- **Password Protection**: User passwords hashed with `bcryptjs`. SMTP/IMAP credentials encrypted at rest using AES-256-CBC encryption.

### 2. 📊 Dashboard Overview
- **Path**: `/dashboard`
- Aggregate statistics: **Total Leads**, **Emails Sent**, **Open Rate (%)**, **Reply Rate (%)**, **Active Campaigns**, **Bounce Rate (%)**.
- Recent campaigns table with real-time status badges.

### 3. 📧 Email Accounts (Sender Management)
- **Path**: `/email-accounts`
- **Manual Add**: Configure SMTP (host, port, username, password, from_name, from_email) and optional IMAP (host, port, username, password).
- **Bulk CSV Upload**: Upload multiple sender accounts via CSV (`from_name`, `from_email`, `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `imap_host`, `imap_port`, `imap_user`, `imap_pass`).
- **Connection Test**: Real-time test button calling Nodemailer `.verify()` and ImapFlow `.connect()`, updating account status to `active` or `error`.

### 4. 👥 Lead Lists & CSV Parsing
- **Path**: `/leads` & `/leads/[id]`
- **CSV Upload**: Client-side parsing using `papaparse` with live 5-row preview table.
- **Dynamic Field Mapping**: Automatically maps `email`, `firstName`, `lastName`, `company`, `title`, `phone`, `website`, and stores all extra columns inside `customFields` JSON.
- **Lead Viewer**: Paginated view of leads per list.

### 5. 🎯 Campaign Builder & Sequence Engine
- **Path**: `/campaigns/new` & `/campaigns/[id]`
- **Multi-List & Multi-Sender Support**: Attach multiple lead lists and multiple sender accounts (for inbox rotation).
- **Sequence Builder**: Unlimited email steps with configurable delay (days).
- **Personalization Variables**: One-click insertion of `{{first_name}}`, `{{last_name}}`, `{{company}}`, `{{title}}`, `{{email}}`, etc., with fallback syntax support (`{{first_name | "there"}}`).
- **Sending Settings**:
  - Daily email limit per sender.
  - Randomized send delay range (min/max seconds).
  - Active day picker (Mon–Sun toggles).
  - Sending time window (start/end hours in UTC/local timezone).
  - Open & click tracking toggles.
- **Control**: Launch, Pause, Resume, Stop campaign states.

### 6. ⏱️ Background Sending Engine & Tracking
- **QStash Job Worker**: `/api/jobs/process-campaign` handles queue execution without needing local Redis/BullMQ (100% Cloudflare Pages compatible).
- **Open Tracking**: Injects 1×1 transparent tracking pixel (`/api/track/open/[token]`).
- **Click Tracking**: Rewrites links to `/api/track/click/[token]` redirector.
- **Unsubscribe Link**: Injects one-click unsubscribe links (`/api/unsubscribe/[token]`) into email footers.

### 7. 📬 Unified Inbox & IMAP Reply Poller
- **Path**: `/inbox` & `/api/cron/poll-imap`
- **IMAP Poller**: Cron-compatible endpoint to check unseen emails across connected IMAP inboxes, matching replies to campaigns via sender/lead email.
- **Auto-Unsubscribe**: Auto-detects keywords ("unsubscribe", "remove me", "opt out") in replies and updates lead status automatically.
- **Inbox Interface**: Filter replies by label (`Interested`, `Not Interested`, `Meeting Booked`, `Unsubscribed`), view thread, and send direct email replies.

---

## 🛠️ Environment Configuration (`.env`)

To run the application locally or deploy to Cloudflare Pages, populate the `.env.local` file based on `.env.example`:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

AUTH_SECRET="your-32-char-random-auth-secret"
NEXTAUTH_URL="http://localhost:3000"

ENCRYPTION_KEY="your-32-char-random-encryption-key"

QSTASH_URL="https://qstash.upstash.io"
QSTASH_TOKEN="your-upstash-token"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🚦 Next Steps & Future Milestones

With the foundation complete, we are ready to proceed to:
- **Milestone 1**: Deliverability & Warmup Engine (Warmup pool, DNS health checks, SpamAssassin scoring, blacklist monitoring).
- **Milestone 2**: AI Personalization & Advanced Sequences (AI subject/body/spintax generator, conditional branching).
