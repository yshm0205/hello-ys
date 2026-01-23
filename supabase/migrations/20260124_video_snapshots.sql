-- 영상 스냅샷 테이블 (activeRate 계산용)
-- 매일 수집 시 영상별 조회수 등 저장

CREATE TABLE IF NOT EXISTS video_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count BIGINT NOT NULL DEFAULT 0,
    comment_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 영상+날짜 복합 유니크 제약
    UNIQUE(video_id, date)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_video_snapshots_video_id ON video_snapshots(video_id);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_date ON video_snapshots(date);
CREATE INDEX IF NOT EXISTS idx_video_snapshots_video_date ON video_snapshots(video_id, date);

-- activeRate 계산 함수
-- activeRate = (today_views - yesterday_views) / 24
CREATE OR REPLACE FUNCTION get_active_rate(p_video_id TEXT, p_date DATE)
RETURNS NUMERIC AS $$
DECLARE
    today_views BIGINT;
    yesterday_views BIGINT;
    active_rate NUMERIC;
BEGIN
    -- 오늘 조회수
    SELECT view_count INTO today_views
    FROM video_snapshots
    WHERE video_id = p_video_id AND date = p_date;
    
    -- 어제 조회수
    SELECT view_count INTO yesterday_views
    FROM video_snapshots
    WHERE video_id = p_video_id AND date = p_date - INTERVAL '1 day';
    
    -- 어제 데이터 없으면 NULL 반환
    IF yesterday_views IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- activeRate 계산 (시간당 조회수)
    active_rate := (today_views - yesterday_views) / 24.0;
    
    RETURN active_rate;
END;
$$ LANGUAGE plpgsql;

-- RLS 정책 (읽기 전용)
ALTER TABLE video_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read video_snapshots"
    ON video_snapshots FOR SELECT
    USING (true);

-- 서비스 키로 쓰기 가능
CREATE POLICY "Service can insert video_snapshots"
    ON video_snapshots FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service can update video_snapshots"
    ON video_snapshots FOR UPDATE
    USING (true);
