-- Pre-registration v2: Add phone, magic_token, meet_greet_intent table
-- Remove crew matching dependency from registration flow

-- Add phone and magic_token columns to registrations
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS magic_token TEXT UNIQUE;

-- Create index on magic_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_registrations_magic_token ON registrations(magic_token);

-- Meet and greet intent table
CREATE TABLE IF NOT EXISTS meet_greet_intent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES registrations(id),
  wants_consideration BOOLEAN NOT NULL DEFAULT FALSE,
  why_answer TEXT,
  ai_theme TEXT,
  ai_quality_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for meet_greet_intent
CREATE INDEX IF NOT EXISTS idx_meet_greet_intent_user_id ON meet_greet_intent(user_id);

-- RLS for meet_greet_intent
ALTER TABLE meet_greet_intent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on meet_greet_intent" ON meet_greet_intent
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public reads on meet_greet_intent" ON meet_greet_intent
  FOR SELECT TO anon USING (true);

-- Note: public UPDATE removed — API routes use service_role key for updates
