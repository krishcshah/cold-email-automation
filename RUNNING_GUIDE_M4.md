# 🚀 OutreachPro — Milestone 4 Running Guide (B2B Lead Database & Integrations)

This guide provides step-by-step setup instructions for **Milestone 4 (B2B Prospect Database, Enrichment & Integrations)**.

---

## 📋 Features Included in Milestone 4

- 🔍 **Native B2B Lead Database Search**: Search leads by Title, Company Size, Industry, Location, and Tech Stack with credit meters.
- ⚡ **Email Finder & Verifier**: Find and verify email addresses by Name + Domain with MX resolution, catch-all detection, and confidence scoring.
- 🌊 **Waterfall Lead Enrichment Engine**: Cascade multi-provider data enrichment for company size, industry, LinkedIn URL, phone, and revenue.
- 🔌 **Native Integrations Hub**: Slack channel alerts, HubSpot CRM sync, Pipedrive, Salesforce, Clay workflow lead ingestion webhooks, and Google Sheets sync.
- 🔑 **Secret REST API Keys & Webhooks Engine**: REST API key generation (`op_live_...`), HMAC SHA-256 webhook subscriptions, and interactive OpenAPI documentation (`/docs/api`).

---

## 🔑 Environment Variables Setup (`app/.env`)

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/cold_email_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="a_random_32_character_secret_key_change_in_production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+15550199"

# Slack & HubSpot Optional Keys
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T000/B000/XXXX"
HUBSPOT_API_KEY="pat-na1-xxxxxxxxxxxxxxxx"
```

---

## 🚀 Running Commands

```bash
cd app
npm install
npx prisma generate
npx prisma db push
npm run dev
```
