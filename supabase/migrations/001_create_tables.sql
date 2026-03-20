-- Registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT DEFAULT '',
  timezone TEXT DEFAULT '',
  device_type TEXT DEFAULT '',
  segment_choice TEXT DEFAULT '',
  guest_question TEXT DEFAULT '',
  ai_tags JSONB,
  ticket_number TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  referred_by TEXT,
  commitment_confirmed BOOLEAN DEFAULT FALSE,
  committed_at TIMESTAMPTZ,
  ticket_shared BOOLEAN DEFAULT FALSE,
  calendar_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_registration_id UUID REFERENCES registrations(id),
  referred_email TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  converted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signal responses table (for pre-registration questions and future signals)
CREATE TABLE IF NOT EXISTS signal_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID REFERENCES registrations(id),
  question_key TEXT NOT NULL,
  answer_text TEXT DEFAULT '',
  ai_tags JSONB,
  segment_tag TEXT DEFAULT '',
  confidence_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_referral_code ON registrations(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_signal_responses_registration_id ON signal_responses(registration_id);

-- Enable Row Level Security
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_responses ENABLE ROW LEVEL SECURITY;

-- Policies: allow inserts from anon key (public registration)
-- Using DROP IF EXISTS + CREATE to make this idempotent (re-runnable)
DROP POLICY IF EXISTS "Allow public inserts" ON registrations;
CREATE POLICY "Allow public inserts" ON registrations
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public reads for count" ON registrations;
CREATE POLICY "Allow public reads for count" ON registrations
  FOR SELECT TO anon USING (true);

-- Note: public UPDATE removed — API routes use service_role key for updates

DROP POLICY IF EXISTS "Allow public inserts" ON referrals;
CREATE POLICY "Allow public inserts" ON referrals
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public reads" ON referrals;
CREATE POLICY "Allow public reads" ON referrals
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow public inserts" ON signal_responses;
CREATE POLICY "Allow public inserts" ON signal_responses
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public reads" ON signal_responses;
CREATE POLICY "Allow public reads" ON signal_responses
  FOR SELECT TO anon USING (true);
