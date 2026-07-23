# 🚀 Cold Email Outreach Automation Tool — Master Build Prompt

## Context & Vision

We are building a **full-stack cold email outreach automation platform** that clones and surpasses the best tools in the market:

| Tool | Specialty |
|---|---|
| **Instantly.ai** | Unlimited inboxes, built-in lead database, AI copilot |
| **Smartlead.ai** | Agency white-labeling, deep API/webhooks, advanced inbox rotation |
| **lemlist** | Dynamic image/video personalization, landing pages |
| **Reply.io** | Multichannel (email + LinkedIn + calls + SMS), AI Jason assistant |
| **Woodpecker** | Simplicity, reliable deliverability, SMB-friendly |
| **Mailshake** | Clean UI, easy sequences, small team outbound |
| **Snov.io** | Email finder, verifier, drip campaigns |
| **Apollo.io** | Massive B2B database, enrichment, sequences |
| **Salesloft / Outreach.io** | Enterprise sales engagement, analytics |

Our goal: **one platform that outperforms all of them**.

---

## 🟢 BEGINNER PROMPT — Foundation (Works End-to-End)

> Use this prompt to build the initial working shell of the application. Everything must be functional at a basic level.

---

**PROMPT:**

Build a full-stack cold email outreach automation web application. This is the **foundation version** — every feature listed below must work end-to-end, even if it's basic. No mock data, no fake buttons. Everything must be real and functional.

### Tech Stack
- **Frontend:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Backend:** Next.js API routes (or Express.js if preferred)
- **Database:** PostgreSQL with Prisma ORM
- **Email Sending:** Nodemailer (SMTP)
- **Email Receiving:** IMAP via `imapflow` library
- **File Uploads:** CSV parsing with `papaparse`
- **Auth:** NextAuth.js with email/password

### Core Screens & Features to Build

#### 1. Authentication
- Sign up / Login / Logout
- Session management

#### 2. Dashboard
- Overview stats: total leads, emails sent, open rate, reply rate, bounce rate
- List of active campaigns with status indicators

#### 3. Email Accounts (Senders) Management
- Add email sending accounts via SMTP credentials (host, port, username, password, from name)
- Add email receiving/reply tracking via IMAP credentials (host, port, username, password)
- Upload multiple sender accounts via CSV (columns: smtp_host, smtp_port, smtp_user, smtp_pass, imap_host, imap_port, imap_user, imap_pass, from_name, from_email)
- Test connection button for each account
- List all connected accounts with status (active/error)

#### 4. Lead Lists
- Upload leads via CSV file
- CSV must support columns: email, first_name, last_name, company, title, phone, website, and any custom columns
- Preview uploaded leads before saving
- View all lead lists with count
- View individual leads within a list

#### 5. Campaign Builder
- Create a new campaign with a name
- Select which lead list(s) to use
- Select which sender account(s) to use (support multiple for rotation)
- Email Sequence Builder:
  - Step 1: Subject + Body (HTML rich text editor)
  - Add follow-up steps (Step 2, 3, etc.) with configurable delay in days
  - Support personalization variables: {{first_name}}, {{last_name}}, {{company}}, {{title}}, {{email}}, and any custom CSV columns
- Sending Settings:
  - Daily email limit per sender account
  - Delay between emails in seconds (min/max range for randomization)
  - Schedule: select days of week to send (Mon–Fri toggle)
  - Send window: start time and end time (e.g., 9am–5pm)
  - Timezone selector
  - Track opens: yes/no toggle
  - Track clicks: yes/no toggle

#### 6. Campaign Launch & Control
- Save campaign as draft
- Launch campaign (status changes to "Active")
- Pause / Resume campaign
- Stop campaign

#### 7. Campaign Analytics (Basic)
- Per-campaign stats: sent, delivered, opened, clicked, replied, bounced, unsubscribed
- Per-lead status view (which step they're on, last email sent)

#### 8. Unified Inbox (Basic)
- Show all replies received across all campaigns in one view
- Mark reply as: Interested / Not Interested / Meeting Booked / Unsubscribe
- Reply to leads directly from the inbox

#### 9. Unsubscribe Handling
- Auto-detect "unsubscribe" keyword in replies and mark lead as unsubscribed
- Support one-click unsubscribe link in emails via token URL
- Never email unsubscribed leads again

### Non-Functional Requirements
- Responsive UI (desktop-first but mobile-friendly)
- Background job processing for email sending (use a queue: BullMQ + Redis or similar)
- All operations must be per-user (multi-tenant safe, no data leakage between users)
- Proper error handling and user-facing error messages
- Environment variable config for all secrets

---

## 🔵 MILESTONE 1 — Deliverability & Warmup Engine

> Goal: Make sure emails land in inbox, not spam. Build the warmup and deliverability infrastructure.

**PROMPT:**

Extend the cold email platform with a full **email deliverability and warmup system**:

### Features to Add

#### Email Warmup
- Each connected email account gets an automated warmup process
- Warmup pool: simulate a network of internal "warmup" email accounts that send and reply to each other
- Configurable warmup settings per account:
  - Warmup emails per day (start low, ramp up over 30 days)
  - Reply rate percentage (default 30–40%)
  - Mark as important percentage
  - Rescue from spam percentage
- Warmup dashboard: show health score (0–100), daily activity graph, inbox placement rate
- Warmup schedule: ramp-up curve (linear, exponential)
- Enable/disable warmup per account

#### Inbox Rotation
- When a campaign has multiple sender accounts, distribute emails across them automatically
- Smart rotation: prefer accounts with lower daily send count
- ESP (Email Service Provider) matching: detect if recipient is on Gmail/Outlook and prefer sending from a matching provider

#### Deliverability Tools
- Spam score checker: run email content through SpamAssassin-style scoring before sending
- Blacklist monitor: check sending domains against major DNS blacklists (DNSBL)
- Inbox placement test: send test emails to seed accounts and report Gmail/Outlook/Yahoo inbox vs spam placement
- DNS health check for connected domains: SPF, DKIM, DMARC validation
- Custom tracking domain: allow users to set their own domain for open/click tracking pixels

#### Email Validation
- Validate lead email addresses before sending (MX record check + syntax check)
- Mark invalid emails and skip them in campaigns
- Show validation stats per lead list

---

## 🟡 MILESTONE 2 — AI Personalization & Advanced Sequences

> Goal: Supercharge reply rates with AI-powered content and smart sequencing logic.

**PROMPT:**

Extend the platform with **AI-powered personalization and advanced campaign sequencing**:

### Features to Add

#### AI Email Writing
- AI subject line generator: input campaign goal + persona, get 5 subject line variants
- AI body writer: generate personalized email body based on lead's company, title, and goal
- AI spintax generator: create {variant1|variant2|variant3} spin variations for natural-sounding bulk sends
- AI opening line generator: generate unique first lines per lead using their name/company/title
- AI icebreaker: generate unique personalized icebreakers by scraping/reading lead's LinkedIn summary or company website

#### Variable System (Advanced)
- Support all CSV column values as {{variables}} in subject and body
- Conditional variables: {{first_name | "there"}} (fallback if field is empty)
- Dynamic snippets: reusable text blocks insertable into any email template

#### Advanced Sequence Logic
- Condition-based branching: if lead opens email → send follow-up A; if not → send follow-up B
- Reply-based stopping: auto-stop sequence when lead replies (this must already exist, but make it bulletproof)
- Click-triggered branches: if lead clicks link → trigger a different sub-sequence
- Out-of-office detection: pause sequence for leads who auto-reply with OOO, resume after their return date
- A/B testing per step: test multiple subject lines or bodies, track winner, auto-stop losers
- Sequence pause rules: global suppression list, company domain suppression

#### Personalized Assets
- Dynamic image personalization: embed lead's name/company into images (like lemlist)
- Personalized landing page per lead: generate a unique URL with lead's name/company pre-filled
- Video thumbnail personalization: add lead's name overlay on video thumbnail images

---

## 🟠 MILESTONE 3 — Multichannel Outreach + CRM

> Goal: Expand beyond email into a full sales engagement platform.

**PROMPT:**

Extend the platform with **multichannel outreach capabilities and a built-in CRM**:

### Features to Add

#### LinkedIn Outreach (via Browser Automation)
- LinkedIn connection request step in sequences
- LinkedIn message step in sequences
- LinkedIn profile view step (engagement signal)
- Safety limits: respect LinkedIn daily limits
- Cookie-based LinkedIn session auth

#### SMS / WhatsApp Outreach
- Add Twilio integration for SMS steps in sequences
- SMS template with {{variables}}
- Track SMS delivery and replies

#### Call Tasks
- Add "Call" task steps in sequences
- Show call task queue: list of leads to call today
- Log call outcome: connected / voicemail / no answer
- Auto-advance sequence based on call outcome

#### Built-in CRM
- Leads automatically become "Contacts" when they reply
- Contact profile: full timeline of all touchpoints (emails sent/opened/replied, LinkedIn messages, calls)
- Pipeline view (Kanban): stages like New Lead → Contacted → Interested → Meeting Booked → Closed Won / Lost
- Deal value field per contact
- Notes and tasks per contact
- Company-level grouping: see all contacts from the same company
- Tag system: label contacts for filtering and segmentation
- Bulk actions: move stage, add tag, assign to team member

#### Team Collaboration
- Invite team members to workspace
- Role-based permissions: Admin / Member / Viewer
- Assign campaigns and leads to specific team members
- Activity feed: see what teammates are doing

---

## 🔴 MILESTONE 4 — Lead Database, Enrichment & Integrations

> Goal: Make it a self-contained lead generation and enrichment machine.

**PROMPT:**

Extend the platform with a **native B2B lead database, enrichment engine, and deep integrations**:

### Features to Add

#### B2B Lead Database
- Integrate with a leads API (e.g., Hunter.io, Apollo.io API, or Prospeo) to search for leads by:
  - Job title, seniority, department
  - Company name, industry, company size
  - Location (country, city)
  - Technology stack (company uses HubSpot, Shopify, etc.)
- Show results in a searchable table
- Save selected leads directly into a lead list
- Show lead count and available credits

#### Email Finder & Verifier
- Find email addresses by entering name + company domain
- Bulk email finder via CSV (name + domain columns)
- Email verification: syntax, MX record, SMTP ping, catch-all detection
- Confidence score per found email
- Deduplicate leads against existing lists

#### Lead Enrichment
- Enrich leads with missing data: company size, industry, LinkedIn URL, phone, revenue
- Use enrichment APIs: Clearbit, Apollo, or similar
- Waterfall enrichment: try multiple providers, use first successful result
- Enrichment per-lead and bulk enrichment per list

#### Native Integrations
- **HubSpot:** Sync contacts, log email activity, update deal stages
- **Pipedrive:** Sync contacts and deals
- **Salesforce:** Push leads and log activities
- **Zapier / Make.com:** Webhook triggers for all events (email sent, opened, replied, bounced, meeting booked)
- **Slack:** Notifications for positive replies and meeting bookings
- **Clay:** Accept leads pushed from Clay workflows
- **Google Sheets:** Two-way sync with a Google Sheet as a lead source

#### API & Webhooks (Public)
- Full REST API for all platform features
- API key management per user
- Webhook configuration: subscribe to events (email.sent, email.opened, email.replied, email.bounced, lead.unsubscribed, meeting.booked)
- Webhook retry logic with exponential backoff
- API documentation (Swagger/OpenAPI spec auto-generated)

---

## 🟣 MILESTONE 5 — Agency Mode & White Labeling

> Goal: Turn the platform into an agency-grade multi-tenant SaaS.

**PROMPT:**

Extend the platform with **full agency and white-label capabilities**:

### Features to Add

#### Multi-Workspace (Agency Mode)
- Create and manage multiple client workspaces from a single agency dashboard
- Each client workspace is fully isolated (leads, campaigns, inboxes, analytics)
- Invite clients to their own workspace with restricted access
- Agency can shadow any client workspace
- Transfer campaigns and lead lists between workspaces

#### White Labeling
- Custom domain: host the platform under client's domain (e.g., app.clientagency.com)
- Custom branding: logo, primary color, favicon, email footer branding
- Remove all references to the underlying platform
- Custom "From" in system emails (e.g., support@clientagency.com)
- White-labeled client login page

#### Client Reporting
- Shareable campaign reports (read-only link for clients)
- Automated weekly/monthly PDF report generation per client
- Report includes: emails sent, open rate, reply rate, meetings booked, ROI estimate
- Custom report branding (client logo + agency logo)

#### Billing & Credits (Agency)
- Allocate sending credits (emails/month) per client workspace
- Allocate lead database credits per client
- Track credit usage per client in real time
- Block campaigns when client exceeds credit limit

#### User Management
- SSO support (Google OAuth, SAML for enterprise)
- 2FA (TOTP authenticator app)
- Audit log: full log of all user actions with timestamp, IP, and action type
- IP allowlisting per workspace

---

## ⚫ MILESTONE 6 — AI Agent, Advanced Analytics & Enterprise

> Goal: Build the most intelligent, data-rich, and scalable platform in the market.

**PROMPT:**

Extend the platform with **AI-driven automation, enterprise analytics, and a conversational AI agent**:

### Features to Add

#### AI Reply Agent (Autopilot)
- AI reads all incoming replies and categorizes them: Interested / Not Interested / Meeting Request / Out of Office / Question / Referral / Bounce
- For "Interested" replies: AI drafts a response and queues it for human review (one-click approve/edit/send)
- For "Meeting Request" replies: AI checks connected calendar (Google Calendar / Outlook) and offers available slots
- Auto-book meeting: if lead picks a slot, create calendar invite automatically
- For "Not Interested" replies: AI unsubscribes lead and logs reason
- For "Question" replies: AI drafts an answer based on a knowledge base you provide
- Full autopilot mode: AI sends approved replies without human review (opt-in)

#### Advanced Analytics
- Campaign heatmaps: best day/time to send for maximum open rates
- Cohort analysis: track reply rate trends over time across all campaigns
- Sender reputation dashboard: per-account health score over 90-day history
- Revenue attribution: if integrated with CRM, show pipeline value generated by campaigns
- Predictive lead scoring: AI scores each lead on likelihood to reply based on historical data
- Sequence performance funnel: visual drop-off at each step
- Competitive benchmarking: show how your stats compare to industry averages

#### Deliverability AI
- AI writing assistant: real-time spam word detection and suggestions while composing emails
- Automated subject line scoring: predict open rate before sending
- Send time optimization per lead: AI picks the best time to send each individual email based on lead's past behavior
- Adaptive sending throttle: auto-reduce volume if bounce rate or spam complaints spike

#### Enterprise Features
- SSO with SAML 2.0 (Okta, Azure AD)
- Dedicated IP pools for high-volume senders
- Custom email infrastructure provisioning (domain + mailbox setup automation)
- SLA dashboard and uptime guarantees
- Priority support queue and dedicated CSM (customer success manager) assignment
- Data export: full account data export to CSV/JSON at any time
- GDPR compliance tools: data deletion requests, consent tracking, DPA agreement management

---

## 📋 Complete Feature Classification Table

| Feature | Milestone |
|---|---|
| Auth, CSV upload, SMTP/IMAP setup, basic sequence, sending scheduler | **Beginner** |
| Unified inbox, campaign analytics (basic), unsubscribe handling | **Beginner** |
| Email warmup engine, inbox rotation, ESP matching | **M1** |
| Spam score checker, blacklist monitor, DNS health check | **M1** |
| Custom tracking domain, email validation | **M1** |
| AI email writer, spintax, icebreakers | **M2** |
| Conditional sequence branching, A/B testing, OOO detection | **M2** |
| Dynamic image/landing page personalization | **M2** |
| LinkedIn outreach steps, SMS steps, call task queue | **M3** |
| Built-in CRM, pipeline Kanban, contact timeline | **M3** |
| Team roles, collaboration, activity feed | **M3** |
| B2B lead database, email finder/verifier, enrichment | **M4** |
| HubSpot/Pipedrive/Salesforce integrations | **M4** |
| Public REST API, webhooks, Zapier/Make integration | **M4** |
| Multi-workspace, client isolation, agency dashboard | **M5** |
| White labeling (custom domain, branding) | **M5** |
| Client reporting, credit allocation, audit logs | **M5** |
| AI reply agent (categorize, draft, autopilot) | **M6** |
| Calendar integration, auto-book meetings | **M6** |
| Advanced analytics, predictive lead scoring | **M6** |
| Send time optimization, deliverability AI | **M6** |
| Enterprise SSO, dedicated IPs, GDPR tools | **M6** |

---

## 🎯 Golden Rules for Every Milestone

1. **Every feature must be functional** — no placeholders, no fake UI, no lorem ipsum
2. **Multi-tenant from Day 1** — all data is scoped to the user/workspace
3. **Background jobs for everything async** — email sending, warmup, enrichment all run in queues
4. **Proper error states** — every action has a loading, success, and error state in the UI
5. **Mobile responsive** — every screen must work on mobile
6. **Rate limiting** — protect all API endpoints
7. **Logging** — log all email events (sent, opened, bounced, replied) with timestamps to the database
