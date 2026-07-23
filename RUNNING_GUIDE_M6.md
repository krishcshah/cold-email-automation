# 🚀 OutreachPro — Milestone 6 Running Guide (Complete Enterprise Version)

This guide provides step-by-step setup instructions, environment variable keys, database commands, and production deployment notes for **Milestone 6 (AI Autopilot Inbox, Advanced Analytics, Deliverability AI & Enterprise Compliance)**.

---

## 📋 Features Included in Milestone 6

- 🤖 **AI Reply Agent & Autopilot Inbox**: Incoming reply intent classification (`Interested`, `Meeting Request`, `Question`, `Not Interested`), automated response draft generator, knowledge base QA integration, and 1-click approval queue.
- 📊 **Advanced Analytics & Predictive Intelligence**: 7x24 send time heatmap grid, sequence performance conversion funnels, industry benchmarks, attributed revenue calculation ($), and predictive lead scoring (0-100%).
- 🛡️ **Deliverability AI & Writing Assistant**: Real-time spam word detector and subject line open rate predictor.
- 🏢 **Enterprise Compliance & Privacy**: SAML 2.0 Enterprise SSO (Okta, Azure AD), 1-click full account JSON backup export, GDPR right-to-be-forgotten lead deletion, dedicated IP pools, and 99.99% SLA uptime status.
- 🏢 **Agency & White-Labeling**: Multi-client workspace switcher, sending credit meters, custom domain CNAME setup, custom logos, HSL color theme pickers, and read-only shareable client report links (`/r/[token]`).
- 🔍 **B2B Lead Database & Integrations**: Prospect search, email finder & verifier (MX, catch-all, confidence score), waterfall lead enrichment, native CRM sync (HubSpot, Pipedrive, Salesforce), Slack alerts, Clay webhook ingestion, and Google Sheets sync.
- 💼 **Multichannel Outreach**: Email (SMTP/IMAP), LinkedIn browser automation steps, Twilio SMS outreach, and interactive Call Task queue with outcome loggers.

---

## 🛠️ Step 1: System Requirements & Installation

1. **Node.js**: Ensure Node.js v18.0 or higher is installed (`node -v`).
2. **PostgreSQL Database**: A running PostgreSQL database instance (local PostgreSQL, or cloud databases like [Supabase](https://supabase.com), [Neon](https://neon.tech), or [Railway](https://railway.app)).
3. **Repository Setup**:
   ```bash
   git clone https://github.com/krishcshah/cold-email-automation.git
   cd cold-email-automation/app
   npm install
   ```

---

## 🔑 Step 2: Environment Variables Setup (`app/.env`)

Create a file named `.env` in the `app/` directory with the following variables:

```env
# ─── DATABASE CONNECTION ──────────────────────────────────────────────────
# How to get: Create a free PostgreSQL database on Supabase or Neon.tech and copy the connection string.
DATABASE_URL="postgresql://postgres:password@localhost:5432/cold_email_db?schema=public"

# ─── NEXTAUTH AUTHENTICATION ──────────────────────────────────────────────
# How to get: Set NEXTAUTH_URL to your app domain. Generate NEXTAUTH_SECRET using `openssl rand -base64 32`
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="a_random_32_character_secret_key_change_in_production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ─── AI PERSONALIZATION & AUTOPILOT (OPENAI) ──────────────────────────────
# How to get: Sign up at https://platform.openai.com/api-keys and create a secret key.
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"

# ─── SMS OUTREACH (TWILIO) ─────────────────────────────────────────────────
# How to get: Create a free account at https://www.twilio.com/console. Copy Account SID, Auth Token, and trial phone number.
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+15550199"

# ─── SLACK NOTIFICATIONS ───────────────────────────────────────────────────
# How to get: In your Slack workspace, create an App -> Incoming Webhooks -> Activate and copy Webhook URL.
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T000/B000/XXXX"

# ─── HUBSPOT CRM INTEGRATION ──────────────────────────────────────────────
# How to get: In HubSpot -> Settings -> Integrations -> Private Apps -> Create Private App with contacts scope and copy token.
HUBSPOT_API_KEY="pat-na1-xxxxxxxxxxxxxxxx"

# ─── BACKGROUND JOBS & CRON (UPSTASH QSTASH) ────────────────────────────────
# How to get: Sign up at https://upstash.com -> QStash -> Copy QSTASH_TOKEN and QSTASH_CURRENT_SIGNING_KEY.
QSTASH_TOKEN="ey...xxxxxxxx"
QSTASH_CURRENT_SIGNING_KEY="sig_xxxxxxxx"
```

---

## 🗄️ Step 3: Database Initialization & Seeding

Run the following commands inside the `app/` folder:

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Push schema to your PostgreSQL database
npx prisma db push

# 3. (Optional) Seed sample data
npm run seed
```

---

## 🚀 Step 4: Running the Platform Locally

Start the Next.js development server:

```bash
npm run dev
```

Open **`http://localhost:3000`** in your browser.

- **Default Admin Login Credentials**:
  - Email: `admin@example.com`
  - Password: `password123`

---

## 📌 What Has Been Left Pending for Production Deployment

To run OutreachPro in production with real external volume:
1. **Real SMTP/IMAP Accounts**: Replace test SMTP credentials with real Google Workspace or Microsoft 365 app passwords.
2. **DNS Record Verification**: Configure real SPF, DKIM, and DMARC DNS records for your sender domains on Cloudflare/Route53.
3. **Twilio A2P 10DLC Registration**: Register your business on Twilio for US carrier SMS compliance.
4. **Upstash QStash Production Trigger Endpoint**: Configure your QStash dashboard to point to `https://your-domain.com/api/jobs/process-campaign` for background sending cron jobs.
