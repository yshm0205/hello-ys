-- ================================================================
-- 🔥 FlowSpot 핫 리스트 데이터베이스 스키마
-- ================================================================

-- 1. 채널 정보 (캐싱용, 1주일 유효)
CREATE TABLE IF NOT EXISTS hot_channels (
  channel_id TEXT PRIMARY KEY,
  title TEXT,
  thumbnail_url TEXT,
  subscriber_count BIGINT DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  total_view_count BIGINT DEFAULT 0,
  avg_view_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 영상 기본 정보
CREATE TABLE IF NOT EXISTS hot_videos (
  video_id TEXT PRIMARY KEY,
  channel_id TEXT REFERENCES hot_channels(channel_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  category_id TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 일별 영상 통계 (후보 풀)
CREATE TABLE IF NOT EXISTS hot_video_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  video_id TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  age_hours FLOAT DEFAULT 0,
  velocity FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, video_id)
);

-- 4. 일별 핫 리스트 (필터 통과 영상)
CREATE TABLE IF NOT EXISTS hot_list_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  video_id TEXT NOT NULL,
  rank INTEGER,
  view_count INTEGER DEFAULT 0,
  subscriber_count BIGINT DEFAULT 0,
  avg_channel_views INTEGER DEFAULT 0,
  contribution_rate FLOAT DEFAULT 0,
  performance_rate FLOAT DEFAULT 0,
  view_velocity FLOAT DEFAULT 0,
  engagement_rate FLOAT DEFAULT 0,
  score FLOAT DEFAULT 0,
  reason_flags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, video_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_hot_videos_channel ON hot_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_hot_videos_published ON hot_videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_hot_video_daily_date ON hot_video_daily(date);
CREATE INDEX IF NOT EXISTS idx_hot_list_date ON hot_list_daily(date);
CREATE INDEX IF NOT EXISTS idx_hot_list_score ON hot_list_daily(date, score DESC);
CREATE INDEX IF NOT EXISTS idx_hot_list_rank ON hot_list_daily(date, rank);

-- 오래된 데이터 자동 정리 함수 (30일 이상)
CREATE OR REPLACE FUNCTION cleanup_old_hot_data()
RETURNS void AS $$
BEGIN
  DELETE FROM hot_video_daily WHERE date < CURRENT_DATE - INTERVAL '30 days';
  DELETE FROM hot_list_daily WHERE date < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
