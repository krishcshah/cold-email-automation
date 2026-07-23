# 🚀 OutreachPro — Milestone 1 Running Guide (Deliverability & Warmup Engine)

This guide provides step-by-step setup instructions for **Milestone 1 (Deliverability, Warmup Engine & Domain Health)**.

---

## 📋 Features Included in Milestone 1

- 🔥 **Automated Email Warmup**: Peer-to-peer warmup network simulation with linear/exponential ramp-up curves, configurable daily target counts, and target reply % controls.
- 📈 **Warmup Analytics Dashboard**: Health scores (0-100), daily activity charts, and spam rescue metrics per connected email account.
- 🔄 **Inbox Rotation Engine**: Dynamic sender account rotation across campaign steps.
- 🛡️ **Deliverability & Domain Health**: Real-time DNS check (SPF, DKIM, DMARC validation) and real-time DNSBL blacklist monitor.
- 🚫 **Suppression List & Custom Tracking Domains**: Custom CNAME tracking domains and domain/email suppression filters.

---

## 🔑 Environment Variables Setup (`app/.env`)

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/cold_email_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="a_random_32_character_secret_key_change_in_production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional Background Job Cron (Upstash QStash)
QSTASH_TOKEN="ey...xxxxxxxx"
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
