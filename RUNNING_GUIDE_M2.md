# 🚀 OutreachPro — Milestone 2 Running Guide (AI Personalization & Advanced Sequences)

This guide provides step-by-step setup instructions for **Milestone 2 (AI Personalization, Spintax, A/B Testing & Branching)**.

---

## 📋 Features Included in Milestone 2

- 🤖 **AI Email Writing Engine**: OpenAI GPT-4 powered subject line generator, body generator, personalized icebreaker generator, and spintax variations generator (`{variant1|variant2}`).
- 🔀 **A/B Testing Engine**: Multi-variant sequence step support (Variant A, B, C) with sent, open, and click conversion tracking.
- 🌿 **Condition-Based Branching**: If opened → Send Follow-up A; If not opened → Send Follow-up B.
- 🖼️ **Dynamic Image & Video Personalization**: Dynamic lead canvas image generation with lead names overlaid on custom imagery.

---

## 🔑 Environment Variables Setup (`app/.env`)

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/cold_email_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="a_random_32_character_secret_key_change_in_production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OpenAI API Key (Required for AI subject, body, icebreaker, spintax)
# How to get: https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"
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
