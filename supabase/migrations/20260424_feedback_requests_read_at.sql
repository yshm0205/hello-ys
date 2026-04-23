-- 피드백 요청에 유저 읽음 시각 추가 (대시보드 미확인 알림용)
ALTER TABLE public.feedback_requests
  ADD COLUMN IF NOT EXISTS user_read_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_feedback_requests_user_unread
  ON public.feedback_requests (user_id)
  WHERE status = 'answered' AND user_read_at IS NULL;
