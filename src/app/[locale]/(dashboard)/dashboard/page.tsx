import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let initialProjects: Array<{
    id: string;
    title: string;
    createdAt: string;
    versions: number;
    archetype: string;
    niche?: string | null;
  }> = [];
  let initialCompletedVodCount = 0;
  let totalLectureVods = 0;

  try {
    const { count: lectureCount } = await supabase
      .from('lectures')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true);

    totalLectureVods = lectureCount ?? 0;
  } catch {
    // fall back to 0
  }

  try {
    const { data } = await supabase
      .from('script_generations')
      .select('id, input_text, scripts, created_at, niche')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    initialProjects = (data ?? []).map((item) => {
      const inputText = item.input_text || '';
      const title = inputText.length > 30 ? `${inputText.substring(0, 30)}...` : inputText || '제목 없음';

      return {
        id: item.id,
        title,
        createdAt: new Date(item.created_at).toLocaleString('ko-KR'),
        versions: Array.isArray(item.scripts) ? item.scripts.length : 0,
        archetype: Array.isArray(item.scripts) && item.scripts[0]?.archetype ? item.scripts[0].archetype : 'UNKNOWN',
        niche: item.niche || null,
      };
    });
  } catch {
    // Ignore dashboard preview load failures and fall back to an empty list.
  }

  try {
    const { count } = await supabase
      .from('lecture_progress')
      .select('vod_id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('completed_at', 'is', null);

    initialCompletedVodCount = count ?? 0;
  } catch {
    // Ignore lecture progress preview load failures and fall back to zero.
  }

  return (
    <DashboardContent
      user={user}
      initialProjects={initialProjects}
      initialCompletedVodCount={initialCompletedVodCount}
      totalLectureVods={totalLectureVods}
    />
  );
}
