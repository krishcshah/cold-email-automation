# 🚀 OutreachPro — Milestone 5 Running Guide (Agency Mode & White-Labeling)

This guide provides step-by-step setup instructions for **Milestone 5 (Agency Multi-Workspace Mode & White-Labeling)**.

---

## 📋 Features Included in Milestone 5

- 🏢 **Multi-Workspace Agency Dashboard**: Create and shadow isolated client workspaces with sending & enrichment credit meters.
- 🎨 **Full White-Labeling Engine**: Custom domain CNAME setup, custom company name, logo upload, favicon, primary HSL color themes, and watermark removal.
- 📊 **Shareable Live Client Reports**: Generate read-only live performance reports (`/r/[token]`) with PDF print support.
- 🔒 **Enterprise Security & Audit Logs**: 2FA TOTP authenticator status, IP subnet allowlisting, and timestamped action audit logs (`/settings/security`).

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
