-- =========================================
-- lecture_materials: 강의 보조 자료
-- 프롬프트(Google Docs), 효과음(mp3), 편집 템플릿(이미지) 등
-- 실제 파일은 Google Drive, DB에는 메타데이터+링크만 저장
-- =========================================

CREATE TABLE IF NOT EXISTS public.lecture_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vod_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('docs', 'audio', 'image', 'folder')),
  url TEXT NOT NULL,
  file_size TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: 인증된 사용자만 읽기 가능
ALTER TABLE public.lecture_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read materials"
  ON public.lecture_materials FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_lecture_materials_vod_id
  ON public.lecture_materials(vod_id);
