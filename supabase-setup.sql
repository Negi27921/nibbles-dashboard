-- Nibbles Marketing Dashboard — Supabase Tables
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Workflow Runs — tracks every workflow execution
CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_id INTEGER,
  workflow_name TEXT NOT NULL,
  category TEXT DEFAULT 'ON-DEMAND',
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  prompt TEXT,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 2. Generated Content — tracks every blog, image, graphic created
CREATE TABLE IF NOT EXISTS generated_content (
  id TEXT PRIMARY KEY,
  type TEXT DEFAULT 'blog' CHECK (type IN ('blog', 'image', 'graphic', 'glossary', 'case_study', 'listicle', 'comparison')),
  title TEXT,
  article_id TEXT,
  workflow_id INTEGER,
  status TEXT DEFAULT 'published',
  tags TEXT[] DEFAULT '{}',
  word_count INTEGER DEFAULT 0,
  products_linked TEXT[] DEFAULT '{}',
  has_key_takeaways BOOLEAN DEFAULT FALSE,
  has_faq BOOLEAN DEFAULT FALSE,
  has_comparison_table BOOLEAN DEFAULT FALSE,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS) — open for now (dashboard is private)
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Allow all operations (dashboard is not public-facing)
CREATE POLICY "Allow all on workflow_runs" ON workflow_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on generated_content" ON generated_content FOR ALL USING (true) WITH CHECK (true);

-- 4. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_runs_created ON workflow_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_status ON workflow_runs (status);
CREATE INDEX IF NOT EXISTS idx_runs_workflow ON workflow_runs (workflow_id);
CREATE INDEX IF NOT EXISTS idx_content_created ON generated_content (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_type ON generated_content (type);
