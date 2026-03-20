-- Migration 005: Add columns used in code but missing from schema
-- display_name, ab_variant, ai_segment, ai_reasoning_text on registrations

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS ab_variant TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS ai_segment TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS ai_reasoning_text TEXT DEFAULT '';

-- Index on ai_segment for admin filtering
CREATE INDEX IF NOT EXISTS idx_registrations_ai_segment ON registrations(ai_segment);
