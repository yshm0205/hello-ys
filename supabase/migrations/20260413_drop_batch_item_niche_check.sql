-- 기존 환경에서 CHECK 제약이 남아있을 수 있으므로 별도 migration으로 제거
ALTER TABLE batch_job_items DROP CONSTRAINT IF EXISTS batch_job_items_niche_check;
