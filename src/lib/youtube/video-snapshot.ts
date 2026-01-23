/**
 * 🔥 영상 스냅샷 관리
 * - 매일 영상 조회수 저장
 * - activeRate 계산 지원
 */

import { createClient } from '@supabase/supabase-js';
import { VideoSnapshot, HotVideoDailyStats } from './hot-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 서비스 키로 Supabase 클라이언트 생성 (서버 사이드 전용)
function getSupabaseAdmin() {
    return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * 오늘 날짜 (YYYY-MM-DD)
 */
function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * 스냅샷 저장 (upsert)
 */
export async function saveVideoSnapshots(
    stats: HotVideoDailyStats[]
): Promise<number> {
    if (stats.length === 0) return 0;

    const supabase = getSupabaseAdmin();
    const today = getToday();

    const snapshots: Omit<VideoSnapshot, 'id' | 'created_at'>[] = stats.map(s => ({
        video_id: s.video_id,
        date: today,
        view_count: s.view_count,
        like_count: s.like_count,
        comment_count: s.comment_count,
    }));

    // upsert: 같은 video_id + date면 업데이트
    const { data, error } = await supabase
        .from('video_snapshots')
        .upsert(snapshots, {
            onConflict: 'video_id,date',
            ignoreDuplicates: false,
        });

    if (error) {
        console.error('[VideoSnapshot] Save error:', error);
        return 0;
    }

    console.log(`[VideoSnapshot] Saved ${snapshots.length} snapshots for ${today}`);
    return snapshots.length;
}

/**
 * 어제 스냅샷 조회
 */
export async function getYesterdaySnapshots(
    videoIds: string[]
): Promise<Map<string, VideoSnapshot>> {
    if (videoIds.length === 0) return new Map();

    const supabase = getSupabaseAdmin();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('video_snapshots')
        .select('*')
        .eq('date', yesterdayStr)
        .in('video_id', videoIds);

    if (error) {
        console.error('[VideoSnapshot] Fetch yesterday error:', error);
        return new Map();
    }

    const map = new Map<string, VideoSnapshot>();
    for (const snapshot of data || []) {
        map.set(snapshot.video_id, snapshot);
    }

    console.log(`[VideoSnapshot] Found ${map.size} yesterday snapshots`);
    return map;
}

/**
 * activeRate 계산
 * = (today_views - yesterday_views) / 24
 * 어제 스냅샷 없으면 null 반환
 */
export function calculateActiveRate(
    todayViews: number,
    yesterdaySnapshot: VideoSnapshot | undefined
): number | null {
    if (!yesterdaySnapshot) {
        return null;
    }

    const viewDiff = todayViews - yesterdaySnapshot.view_count;
    const activeRate = viewDiff / 24; // 시간당 조회수 증가

    return Math.max(0, activeRate); // 음수 방지
}

/**
 * 스냅샷 정리 (90일 이상 된 것 삭제)
 */
export async function cleanupOldSnapshots(): Promise<number> {
    const supabase = getSupabaseAdmin();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const { data, error, count } = await supabase
        .from('video_snapshots')
        .delete()
        .lt('date', cutoffStr)
        .select('id');

    if (error) {
        console.error('[VideoSnapshot] Cleanup error:', error);
        return 0;
    }

    const deleted = data?.length || 0;
    console.log(`[VideoSnapshot] Cleaned up ${deleted} old snapshots (before ${cutoffStr})`);
    return deleted;
}
