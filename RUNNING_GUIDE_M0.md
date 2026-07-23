# 🚀 OutreachPro — Milestone 0 Running Guide (Foundation Version)

This guide provides step-by-step setup instructions, environment variable keys, database commands, and notes for **Milestone 0 (Foundation Cold Email Platform)**.

---

## 📋 Features Included in Milestone 0

- 🔐 **Authentication**: Email/Password signup, login, NextAuth session management.
- 📊 **Dashboard**: High-level metrics overview (total leads, emails sent, open rate, reply rate, bounce rate) & active campaign status.
- ✉️ **Email Accounts**: Connect SMTP sending accounts & IMAP receiving credentials with AES-256 password encryption.
- 👥 **Lead Lists**: CSV import via PapaParse, lead table viewer, status tracking (`active`, `unsubscribed`, `bounced`, `replied`).
- 📧 **Campaign Builder**: Create campaigns, configure daily limits, send schedules, and write multi-step email sequences.
- 🚀 **Outreach Sending Engine**: Multi-sender round-robin email dispatcher with randomized delays.
- 📬 **Unified Inbox**: Single-pane inbox displaying incoming replies with automatic reply tracking.

---

## 🛠️ Step 1: System Requirements & Installation

1. **Node.js**: Ensure Node.js v18.0 or higher is installed (`node -v`).
2. **PostgreSQL Database**: A running PostgreSQL database (local or cloud like Supabase/Neon).
3. **Repository Setup**:
   ```bash
   git clone -b milestone-0 https://github.com/krishcshah/cold-email-automation.git
   cd cold-email-automation/app
   npm install
   ```

---

## 🔑 Step 2: Environment Variables Setup (`app/.env`)

Create a `.env` file in the `app/` folder:

```env
# ─── DATABASE CONNECTION ──────────────────────────────────────────────────
# How to get: Create a free PostgreSQL database on Supabase or Neon.tech and copy the connection string.
DATABASE_URL="postgresql://postgres:password@localhost:5432/cold_email_db?schema=public"

# ─── NEXTAUTH AUTHENTICATION ──────────────────────────────────────────────
# How to get: Set NEXTAUTH_URL to your app domain. Generate NEXTAUTH_SECRET using `openssl rand -base64 32`
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="a_random_32_character_secret_key_change_in_production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🗄️ Step 3: Database Initialization

```bash
npx prisma generate
npx prisma db push
```

---

## 🚀 Step 4: Running Locally

```bash
npm run dev
```

Open **`http://localhost:3000`** in your browser.
