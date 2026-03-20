# Scale-Proof Backend Plan — 10,000 Registrations

## What I'll Do (no input needed from you)

### 1. Database Migration: Indexes + Constraints
**New file:** `supabase/migrations/004_scale_hardening.sql`
- Add `UNIQUE(event_id, email)` constraint — prevents duplicate registrations
- Add index on `registrations(created_at)` — admin queries sort by this
- Add index on `registrations(event_id, created_at)` — compound for filtered queries
- Add index on `signal_responses(created_at)`
- Add index on `meet_greet_intent(created_at)`

### 2. Rate Limiting Middleware
**New file:** `src/middleware.ts`
- In-memory sliding window rate limiter (no Redis dependency needed at this scale)
- `/api/register` POST: **5 requests per IP per 15 minutes** (one person shouldn't register 5 times)
- `/api/meet-greet` POST: **3 requests per IP per 15 minutes**
- `/api/admin/*`: **20 requests per IP per minute**
- Returns `429 Too Many Requests` with `Retry-After` header
- Note: If you move to Vercel with serverless, this should switch to Upstash Redis — in-memory won't persist across cold starts. Good enough for single-server / Supabase Edge.

### 3. Harden Registration API (`/api/register/route.ts`)
- **Input validation**: sanitize all strings, enforce max lengths (name: 100, email: 254, phone: 20, city: 100, motivation: 500, question: 300)
- **Duplicate check**: catch unique constraint error and return friendly "already registered" response with existing ticket
- **PATCH lockdown**: only allow specific fields to be updated (`commitment_confirmed`, `ticket_shared`, `calendar_saved`) — currently accepts ANY field
- **AI throttling**: skip AI clustering if `ANTHROPIC_API_KEY` is missing (already does this) + add 5-second timeout on fetch calls so they don't hang

### 4. Harden Admin API (`/api/admin/registrations/route.ts`)
- Add basic auth via `ADMIN_SECRET` env var (checked via `Authorization: Bearer <secret>` header)
- Add pagination: `?page=1&limit=50` instead of dumping 500 rows
- Select only needed columns instead of `SELECT *`
- Use `estimated` count instead of `exact` (avoids full table scan)

### 5. Harden Meet-Greet API (`/api/meet-greet/route.ts`)
- Validate `registration_id` exists before inserting
- Enforce max 1 meet-greet intent per registration (check before insert)
- Add 5-second timeout on AI clustering call

### 6. Delete Dead Crew-Matching Routes
These are no longer used in the flow:
- `src/app/api/crew/match/route.ts`
- `src/app/api/crew/alternatives/route.ts`
- `src/app/api/crew/switch/route.ts`
- `src/app/api/heatmap/route.ts`

### 7. Use Service Role Key for Server-Side Operations
- Switch API routes from anon key to `getServiceClient()` for server-side DB operations
- This bypasses RLS (which is correct for server-side) and avoids exposing anon key capabilities
- Then tighten RLS policies: remove `UPDATE` from anon on registrations (clients shouldn't update directly)

---

## What You Need To Do in Supabase Dashboard

### A. Enable Connection Pooling (5 min)
1. Go to **Supabase Dashboard → Project Settings → Database**
2. Find **Connection Pooling** section
3. Enable **PgBouncer** in **Transaction mode**
4. Note the **pooled connection string** (port 6543 instead of 5432)
5. Set pool size to **50** (handles burst traffic well for 10k total registrations)

### B. Run the Migration (2 min)
After I create `004_scale_hardening.sql`:
1. Go to **SQL Editor** in Supabase Dashboard
2. Paste the migration contents
3. Run it

### C. Set Environment Variables
Make sure these are set in your deployment (Vercel, etc.):
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # (find in Supabase → Settings → API)
ADMIN_SECRET=some-strong-random-string             # for admin endpoint auth
ANTHROPIC_API_KEY=your-key                         # already set if AI clustering works
```

### D. Optional: Tighten RLS After Service Key Migration
Once I switch API routes to use the service role key, you can tighten RLS:
1. SQL Editor → Run:
```sql
-- Remove anon UPDATE on registrations (server handles this now)
DROP POLICY "Allow public updates" ON registrations;
-- Remove anon UPDATE on meet_greet_intent
DROP POLICY "Allow public updates on meet_greet_intent" ON meet_greet_intent;
```

---

## Scale Estimate After Changes

| Metric | Before | After |
|--------|--------|-------|
| Concurrent registrations | ~50-100 | ~2,000-5,000 |
| Duplicate protection | None | Unique constraint |
| Rate limiting | None | IP-based sliding window |
| Admin security | None | Bearer token auth |
| DB connection efficiency | Anon key + RLS overhead | Service key, pooled |
| AI failure handling | Hangs forever | 5-second timeout |
| Dead code / attack surface | 4 unused API routes | Removed |

For 10,000 **total** registrations (not all at once), this is more than sufficient. If you expect 10,000 **concurrent** (all hitting register at the same second), you'd need Redis + queue system, but that's unlikely for a screening event.
