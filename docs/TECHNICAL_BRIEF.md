# BTD Virtual Watch Parties — Technical Brief & Scope of Work

**Prepared for:** Sam Hawes / FS Innovation
**Date:** March 2026
**Status:** Pre-registration backend complete, watch party web app next

---

## 1. Architecture Overview

### What We're Building

Two connected experiences under one infrastructure:

| Experience | Purpose | Status |
|-----------|---------|--------|
| **Pre-registration flow** | Capture registrations, questions, meet-greet intent before the event | Built ✅ |
| **Watch party web app** | Live community experience layer during the screening (polls, conversation cards, photobooth, admin dashboard) | Next phase |

Both share the same Supabase project (Pro tier) and the same user identity. A person who registers gets a `magic_token` sent via SMS — that token is their key into the watch party web app on screening night. Every interaction traces back to their registration.

### Infrastructure

| Service | Purpose | Tier |
|---------|---------|------|
| **Supabase** | PostgreSQL database, auth, real-time subscriptions | Pro ($25/mo) |
| **Next.js 14** | App framework (App Router, API routes, SSR) | — |
| **Vercel** (recommended) | Hosting, edge functions, CDN | Pro |
| **Zoom** | Video infrastructure for the screening | Business |
| **Anthropic Claude API** | AI clustering, sentiment analysis, question tagging | Pay-per-use |
| **Resend** | Transactional email (ticket confirmations) | Free tier likely sufficient |
| **SMS provider** (TBD) | Magic link delivery before events | TBD |

### Database Schema (Single Supabase Project)

**Pre-registration tables (built):**
- `registrations` — core user data, ticket, magic token
- `meet_greet_intent` — who wants to meet Steven + AI quality scoring
- `signal_responses` — questions with AI topic clustering
- `referrals` — referral tracking

**Watch party tables (to be built):**
- `watch_party_sessions` — event sessions with run-of-show state
- `poll_questions` / `poll_responses` — live polls during screening
- `conversation_cards` — icebreaker responses (opt-in, named/anonymous)
- `photobooth_entries` — virtual step-and-repeat captures
- `attendance_signals` — join/leave timestamps, camera-on tracking
- `chat_messages` — moderated community chat (with AI filtering)
- `admin_events` — admin actions log (stage invites, video start/stop)

All tables link back to `registrations.id` — one person, one identity, full signal history.

---

## 2. What Was Built (Pre-Registration Backend)

### Registration Flow
1. **Screen 1** — Name, email, phone, city → generates ticket + magic token
2. **Screen 2** — "What brings you here tonight?" (motivation, AI-clustered)
3. **Screen 3** — "Ask Steven one thing about behind the diary" (AI-tagged)
4. **Screen 4** — Commitment screen ("This screening happens once")
5. **Screen 5** — Sealed envelope → ticket reveal → Steven video → meet-greet intent → share

### Backend Hardening (Completed)

| Protection | Detail |
|-----------|--------|
| **Rate limiting** | 5 registrations per IP per 15 min, 3 meet-greet submissions per IP per 15 min |
| **Duplicate prevention** | Unique constraint on (event_id + email). If someone registers twice, they get their existing ticket back |
| **Input validation** | All fields sanitized, max lengths enforced (name: 100, email: 254, phone: 20, city: 100, motivation: 500, question: 300) |
| **PATCH lockdown** | Only 3 fields can be updated via API: `commitment_confirmed`, `ticket_shared`, `calendar_saved` |
| **Admin auth** | Admin endpoint requires `ADMIN_SECRET` bearer token |
| **AI timeouts** | All Anthropic API calls timeout after 5 seconds (non-blocking, never delays user) |
| **Service role key** | API routes use Supabase service key (bypasses RLS overhead, faster queries) |
| **Dead code removal** | 4 unused crew-matching API routes deleted |

### Database Indexes

| Index | Purpose |
|-------|---------|
| `(event_id, email)` UNIQUE | Prevent duplicate registrations |
| `(event_id, created_at DESC)` | Fast event-scoped admin queries |
| `(created_at DESC)` on registrations | Admin dashboard sort |
| `(created_at DESC)` on signal_responses | Time-based lookups |
| `(created_at DESC)` on meet_greet_intent | Time-based lookups |
| `(user_id)` UNIQUE on meet_greet_intent | One submission per person |
| `(magic_token)` UNIQUE | Fast magic link lookups |

### Estimated Capacity

| Metric | Capacity |
|--------|----------|
| Total registrations | 10,000+ comfortably |
| Concurrent registrations | 2,000–5,000 with PgBouncer |
| Database connections | 200+ (Pro + PgBouncer in transaction mode) |
| API response time | <200ms for registration, <50ms for reads |

---

## 3. Supabase Setup Instructions

### A. Enable Connection Pooling

1. Go to **Supabase Dashboard** → your project
2. Click **Settings** (gear icon) → **Database**
3. Scroll to **Connection Pooling**
4. Toggle **Enable** → set mode to **Transaction**
5. Set **Pool Size** to **50**
6. Save

### B. Run the Migration

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Paste the contents of `supabase/migrations/004_scale_hardening.sql`:

```sql
-- Prevent duplicate registrations (same email for same event)
ALTER TABLE registrations
  ADD CONSTRAINT unique_event_email UNIQUE (event_id, email);

-- Index for admin queries that sort by created_at
CREATE INDEX IF NOT EXISTS idx_registrations_created_at
  ON registrations(created_at DESC);

-- Compound index for event-scoped queries sorted by time
CREATE INDEX IF NOT EXISTS idx_registrations_event_created
  ON registrations(event_id, created_at DESC);

-- Index for signal_responses time-based queries
CREATE INDEX IF NOT EXISTS idx_signal_responses_created_at
  ON signal_responses(created_at DESC);

-- Index for meet_greet_intent time-based queries
CREATE INDEX IF NOT EXISTS idx_meet_greet_intent_created_at
  ON meet_greet_intent(created_at DESC);

-- Ensure only one meet-greet intent per registration
ALTER TABLE meet_greet_intent
  ADD CONSTRAINT unique_meet_greet_per_user UNIQUE (user_id);
```

4. Click **Run**

### C. Set Environment Variables

In your deployment platform (Vercel, etc.), add:

| Variable | Where to find it | What it does |
|----------|-----------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Database URL (likely already set) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Public key (likely already set) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | Server-side DB access (never expose to client) |
| `ADMIN_SECRET` | You create this — any strong random string | Protects the admin endpoint |
| `ANTHROPIC_API_KEY` | Anthropic Console | AI clustering (optional, degrades gracefully) |
| `RESEND_API_KEY` | Resend dashboard | Email confirmations (optional) |

### D. Tighten RLS Policies (Optional, After Service Key Is Working)

Run in SQL Editor:
```sql
-- Remove anon UPDATE on registrations (server handles this now)
DROP POLICY IF EXISTS "Allow public updates" ON registrations;
-- Remove anon UPDATE on meet_greet_intent
DROP POLICY IF EXISTS "Allow public updates on meet_greet_intent" ON meet_greet_intent;
```

---

## 4. Load Testing — Freelancer Scope of Work

### Objective

Simulate realistic traffic patterns for both the pre-registration flow and the upcoming watch party web app. Identify bottlenecks, fix them, and produce a report with before/after benchmarks.

### Scope

**Phase 1: Pre-Registration Load Testing (Week 1)**

- Write load test scripts (k6 or Artillery) for all active API endpoints:
  - `POST /api/register` — registration flow
  - `PATCH /api/register` — commitment confirmation
  - `POST /api/meet-greet` — meet-greet intent
  - `GET /api/admin/registrations` — admin dashboard
  - `GET /api/referral` — referral counts
  - `GET /api/questions/count` — question counts
- Ramp testing: 100 → 500 → 1,000 → 3,000 concurrent virtual users
- Identify: P95 response times, error rates, database connection saturation, rate limiter behavior
- Fix bottlenecks found (query optimization, connection tuning, caching)

**Phase 2: Frontend Performance Audit (Week 1)**

- Lighthouse audit (mobile + desktop) for `/register` flow
- Core Web Vitals: LCP, FID, CLS across all 5 screens
- Framer Motion animation performance on low-end devices
- Video player loading/streaming optimization
- Cross-browser testing: Chrome, Safari, Firefox (mobile + desktop)

**Phase 3: Watch Party Readiness (Week 2, if web app is built)**

- WebSocket / Supabase Realtime load testing (simulating 2,000 concurrent connections)
- Poll response throughput under load
- Chat message filtering latency
- Admin dashboard real-time update performance

### Deliverables

1. Load test scripts (checked into repo, reusable for future events)
2. Performance report with:
   - Baseline metrics (before optimization)
   - Bottlenecks identified with root cause
   - Fixes applied
   - Final metrics (after optimization)
   - Recommendations for scaling beyond 5,000 concurrent
3. Frontend audit report with Lighthouse scores + fixes

### Candidate Requirements

- Experience with k6 or Artillery
- Familiar with Next.js + Supabase (PostgreSQL + PgBouncer)
- Understands Vercel serverless deployment model
- Can profile and optimize PostgreSQL queries
- Bonus: experience with Supabase Realtime / WebSocket load testing

### Budget Estimate

| Scope | Range |
|-------|-------|
| Phase 1 + 2 only (pre-registration) | $1,500 – $2,500 |
| Phase 1 + 2 + 3 (including watch party) | $2,500 – $4,000 |

Platforms: Upwork, Toptal, or Arc.dev — search for "performance engineer" or "load testing specialist."

---

## 5. What's Next: Watch Party Web App

### Magic Link Auth Flow
1. Registered user receives SMS with `watchparty.steven.com/?token=ABC123`
2. Web app looks up `magic_token` in `registrations` table
3. If valid → user is authenticated, all interactions linked to their `registration_id`
4. If invalid → "This link isn't valid" error page

### Core Features (Priority Order)

1. **Authenticated entry** — magic link → welcome screen with their name + ticket
2. **Live polls** — admin pushes poll questions, results update in real-time via Supabase Realtime
3. **Conversation cards** — 2 icebreaker questions, opt-in, choose named or anonymous
4. **Virtual photobooth / step-and-repeat** — capture + share moment
5. **Moderated chat** — AI-filtered, rate-limited, with admin controls
6. **Admin dashboard** — live signal metrics, poll management, stage invite controls
7. **AI signal engine** — real-time clustering of community sentiment + question themes

### Signal Tracking (Mapped to PRD)

| Signal Category | What We Track | Table |
|----------------|---------------|-------|
| **Format signals** | Camera-on rate, web app scan rate, drop-off timing, experience polls | `attendance_signals`, `poll_responses` |
| **Community signals** | Conversation card participation, photobooth usage, community platform interest | `conversation_cards`, `photobooth_entries`, `poll_responses` |
| **Meet & greet signals** | Pre-reg intent (built ✅), poll completion rate | `meet_greet_intent`, `poll_responses` |

---

## 6. Timeline

| Phase | What | When |
|-------|------|------|
| ✅ Pre-registration flow | Registration, motivation, question, commitment, envelope, meet-greet | Done |
| ✅ Backend hardening | Rate limiting, validation, indexes, auth, cleanup | Done |
| 🔲 Supabase config | Run migration, enable pooling, set env vars | Sam — this week |
| 🔲 Load testing | Hire freelancer or run k6 scripts | 1-2 weeks |
| 🔲 Watch party web app | Magic link auth, polls, cards, photobooth, chat, admin | Next phase |
| 🔲 SMS integration | Magic link delivery to registered users | Before Event 1 |

---

*Document generated from the BTD Virtual Watch Parties technical implementation. For questions, reference the codebase at `github.com/FS-Innovation/watch-party-pre-registration-`.*
