-- batch_job_items: item 단위 niche (job 단위 → item 단위 전환)
ALTER TABLE batch_job_items ADD COLUMN IF NOT EXISTS niche text DEFAULT 'knowledge';

-- 기존 item들을 job의 niche로 backfill
UPDATE batch_job_items bi SET niche = bj.niche
FROM batch_jobs bj
WHERE bi.job_id = bj.id AND bi.niche = 'knowledge' AND bj.niche != 'knowledge';

-- DB 안전장치: null 방지 + 허용값 제한
ALTER TABLE batch_job_items ALTER COLUMN niche SET NOT NULL;
ALTER TABLE batch_job_items ADD CONSTRAINT batch_job_items_niche_check CHECK (niche IN ('knowledge', 'seollem'));
