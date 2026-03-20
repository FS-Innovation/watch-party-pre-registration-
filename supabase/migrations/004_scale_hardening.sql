-- Scale hardening: indexes, constraints, and security for 10k registrations

-- Prevent duplicate registrations (same email for same event)
DO $$ BEGIN
  ALTER TABLE registrations ADD CONSTRAINT unique_event_email UNIQUE (event_id, email);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
DO $$ BEGIN
  ALTER TABLE meet_greet_intent ADD CONSTRAINT unique_meet_greet_per_user UNIQUE (user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
