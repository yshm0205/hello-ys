-- batch_job_items: item 단위 niche (job 단위 → item 단위 전환)
ALTER TABLE batch_job_items ADD COLUMN IF NOT EXISTS niche text DEFAULT 'knowledge';
