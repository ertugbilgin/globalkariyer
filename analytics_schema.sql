-- Analytics Schema for GoGlobalCV Admin Dashboard
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('cv_download', 'cover_letter', 'interview_prep', 'premium')),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd' CHECK (currency IN ('usd', 'eur', 'gbp')),
  stripe_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. ANALYTICS EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. DAILY STATS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_revenue INTEGER DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  cv_analyses INTEGER DEFAULT 0,
  avg_analysis_time INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  error_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_email ON transactions(email);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_product ON transactions(product_type);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_session ON transactions(stripe_session_id);

-- Analytics events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

-- Daily stats indexes
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at
    BEFORE UPDATE ON daily_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Revenue summary view
CREATE OR REPLACE VIEW revenue_by_product AS
SELECT 
  product_type,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  DATE_TRUNC('day', created_at) as date
FROM transactions
WHERE status = 'completed'
GROUP BY product_type, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Daily metrics view
CREATE OR REPLACE VIEW daily_metrics AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_transactions,
  SUM(amount) as revenue,
  COUNT(DISTINCT email) as unique_customers,
  AVG(amount) as avg_transaction_value
FROM transactions
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- =============================================
-- ROW LEVEL SECURITY (Optional)
-- =============================================

-- Enable RLS on tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Admin can see everything
CREATE POLICY "Admin full access" ON transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin full access" ON analytics_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin full access" ON daily_stats
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- SAMPLE DATA (for testing)
-- =============================================

-- Uncomment to insert sample data
/*
INSERT INTO transactions (email, product_type, amount, status, stripe_session_id)
VALUES 
  ('test1@example.com', 'cv_download', 499, 'completed', 'cs_test_123'),
  ('test2@example.com', 'premium', 999, 'completed', 'cs_test_456'),
  ('test3@example.com', 'cover_letter', 299, 'completed', 'cs_test_789');

INSERT INTO analytics_events (event_type, metadata)
VALUES 
  ('cv_analysis_start', '{"file_size": 102400}'::jsonb),
  ('cv_analysis_success', '{"duration": 2500, "score": 85}'::jsonb),
  ('cv_analysis_error', '{"error": "Parse failed", "file_type": "pdf"}'::jsonb);
*/

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('transactions', 'analytics_events', 'daily_stats');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'analytics_events', 'daily_stats');

-- Test revenue view
SELECT * FROM revenue_by_product LIMIT 5;

-- Test daily metrics view
SELECT * FROM daily_metrics LIMIT 5;
