# Watch Party Pre-Registration — Setup Guide

## What This Is

A Next.js 14 pre-registration flow for private screening events (DOAC / Behind The Diary). Users register with name, email, phone, answer a question, and get a confirmation ticket + email. Later, they receive a magic link (via SMS) to join the screening.

## Tech Stack

- **Framework:** Next.js 14 (App Router, standalone output)
- **Database:** Supabase (Postgres + RLS)
- **Email:** Resend (transactional confirmation emails)
- **SMS:** Twilio (magic link delivery — not yet configured)
- **AI:** Anthropic Claude API (motivation clustering + question tagging)
- **Analytics:** Rudderstack
- **Styling:** Tailwind CSS + Framer Motion
- **Deployment:** Docker → Google Cloud Run (via Cloud Build)

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── register/page.tsx     # Multi-step registration flow
│   ├── admin/page.tsx        # Admin dashboard
│   └── api/
│       ├── register/route.ts       # POST: register, PATCH: update commitment
│       ├── email/confirmation/     # POST: send ticket email via Resend
│       ├── sms/send-magic-link/    # POST: send magic link via Twilio
│       ├── admin/registrations/    # GET: admin data (Bearer auth)
│       └── meet-greet/route.ts     # POST: meet & greet consideration
├── components/               # UI components (screens, transitions)
├── lib/
│   ├── supabase.ts           # Supabase clients (anon + service role)
│   ├── twilio.ts             # Twilio SMS client
│   ├── types.ts              # TypeScript types
│   ├── analytics.ts          # Rudderstack tracking
│   └── utils.ts              # Utility functions
└── middleware.ts             # Rate limiting
```

## Registration Flow

1. User fills multi-step form (name, email, phone, motivation, guest question)
2. `POST /api/register` creates record in Supabase with `magic_token` + `ticket_number`
3. Async (non-blocking):
   - Confirmation email sent via **Resend**
   - Confirmation SMS sent via **Twilio** (if configured)
   - AI clustering via **Anthropic** (if configured)
4. User sees ticket confirmation screen
5. Before event: admin triggers magic link SMS via `/api/sms/send-magic-link`

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in values.

### Required

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API (keep secret!) |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |

### Required for Resend to Actually Send

1. Sign up at [resend.com](https://resend.com)
2. Add and **verify your domain** (DNS records: SPF, DKIM)
3. Create an API key
4. Update `RESEND_FROM_ADDRESS` to match your verified domain (e.g. `DOAC <tickets@yourdomain.com>`)
5. Without a verified domain, Resend will only deliver to the account owner's email

### Optional

| Variable | Purpose |
|---|---|
| `TWILIO_ACCOUNT_SID` | SMS magic links (not yet set up) |
| `TWILIO_AUTH_TOKEN` | SMS magic links |
| `TWILIO_PHONE_NUMBER` | SMS sender number |
| `ANTHROPIC_API_KEY` | AI motivation clustering + question tagging |
| `NEXT_PUBLIC_RUDDERSTACK_WRITE_KEY` | Analytics |
| `NEXT_PUBLIC_RUDDERSTACK_DATA_PLANE_URL` | Analytics |
| `ADMIN_SECRET` | Bearer token for admin API |
| `NEXT_PUBLIC_APP_URL` | Base URL for magic links |

## Supabase Setup

Run migrations in order from `supabase/migrations/`:

```sql
-- In Supabase SQL Editor, run these in order:
001_create_tables.sql          -- Core tables: registrations, referrals, signal_responses
003_pre_registration_v2.sql    -- Add phone, magic_token, meet_greet_intent table
004_scale_hardening.sql        -- Indexes, unique constraints
005_add_missing_columns.sql    -- display_name, ab_variant, ai_segment columns
```

### Tables

- **registrations** — Main user data (name, email, phone, ticket, magic_token, AI tags)
- **signal_responses** — AI-tagged question responses
- **meet_greet_intent** — Users who want meet & greet consideration
- **referrals** — Referral tracking

## Integration Status Checklist

- [x] **Supabase** — Database + auth working
- [x] **Resend** — Email confirmation wired into registration flow
- [ ] **Twilio** — SMS client built, needs account credentials
- [ ] **Anthropic** — AI clustering built, needs API key (degrades gracefully)
- [ ] **Rudderstack** — Analytics client built, needs write key
- [ ] **Domain verification** — Resend requires verified domain for production email delivery

## Local Development

```bash
npm install
cp .env.local.example .env.local  # fill in your values
npm run dev                        # http://localhost:3000
```

## Docker Build

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -t watch-party .
```

Note: Only `NEXT_PUBLIC_*` vars are build args (baked into client bundle). Server-side secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, etc.) are runtime env vars.

## Rate Limits

- `/api/register` — 5 requests per IP per 15 min
- `/api/meet-greet` — 3 requests per IP per 15 min
- `/api/admin/*` — 30 requests per IP per min

## Key Notes for Agents

- All AI features (clustering, tagging) are **non-blocking** with 5s timeouts — the app works fine without them
- SMS (Twilio) and email (Resend) fail silently if not configured — registration still succeeds
- The `from` address in Resend must match a verified domain or emails won't deliver
- `next.config.js` uses `output: "standalone"` for Docker deployment
- The admin endpoint requires `Authorization: Bearer <ADMIN_SECRET>` header
