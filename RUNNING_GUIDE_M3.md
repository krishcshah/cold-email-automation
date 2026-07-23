# 🚀 OutreachPro — Milestone 3 Running Guide (Multichannel Outreach & Built-in CRM)

This guide provides step-by-step setup instructions for **Milestone 3 (Multichannel Outreach & Built-in CRM)**.

---

## 📋 Features Included in Milestone 3

- 💼 **LinkedIn Outreach**: Browser automation step support (connection requests, messages, profile views) with encrypted session cookie auth (`li_at`) and daily rate limits.
- 📱 **Twilio SMS Outreach**: Sequence steps for SMS text messages with variable substitution (`{{first_name}}`).
- 📞 **Interactive Call Tasks Queue**: Scheduled phone call queue with one-click outcome loggers (`Connected`, `Voicemail`, `No Answer`) auto-advancing sequences.
- 🗂️ **Built-in CRM & Kanban Pipeline**: 6-stage deal board (`New Lead` → `Closed Won`), contact timelines, deal values ($), custom color tags, and organization groupings.
- 👥 **Team Workspace Collaboration**: Invite team members with role assignments (`Admin`, `Member`, `Viewer`) and real-time activity log stream.

---

## 🔑 Environment Variables Setup (`app/.env`)

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/cold_email_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="a_random_32_character_secret_key_change_in_production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"

# Twilio SMS API Keys (How to get: https://www.twilio.com/console)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+15550199"
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
