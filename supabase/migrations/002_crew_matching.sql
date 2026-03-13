-- Crews table
CREATE TABLE IF NOT EXISTS crews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '',
  primary_segment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'forming' CHECK (status IN ('forming', 'open', 'merged', 'closed')),
  min_threshold INTEGER NOT NULL DEFAULT 20,
  max_capacity INTEGER NOT NULL DEFAULT 40,
  current_count INTEGER NOT NULL DEFAULT 0,
  merged_into_crew_id UUID REFERENCES crews(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Curiosity heatmap table
CREATE TABLE IF NOT EXISTS curiosity_heatmap (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  topic_cluster TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 0,
  percentage FLOAT NOT NULL DEFAULT 0,
  sample_questions JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update registrations table for v2 flow
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS motivation_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS ab_variant TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS ai_segment TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS ai_reasoning_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS crew_id UUID REFERENCES crews(id),
  ADD COLUMN IF NOT EXISTS crew_accepted BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS switched_crew BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS switched_to_crew_id UUID REFERENCES crews(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crews_event_id ON crews(event_id);
CREATE INDEX IF NOT EXISTS idx_crews_segment_status ON crews(primary_segment, status);
CREATE INDEX IF NOT EXISTS idx_curiosity_heatmap_event ON curiosity_heatmap(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_crew_id ON registrations(crew_id);

-- RLS for crews
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE curiosity_heatmap ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public reads on crews" ON crews FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public inserts on crews" ON crews FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public updates on crews" ON crews FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow public reads on heatmap" ON curiosity_heatmap FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public inserts on heatmap" ON curiosity_heatmap FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public updates on heatmap" ON curiosity_heatmap FOR UPDATE TO anon USING (true);
