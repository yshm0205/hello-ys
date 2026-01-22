/**
 * 🔥 핫 리스트 수집 Cron Job
 * Vercel Cron: 매일 00:10 KST
 * 
 * 1. YouTube API로 후보 영상 수집
 * 2. 채널 정보 보강
 * 3. Supabase에 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { collectHotVideos } from '@/lib/youtube/hot-collector';
import { generateHotList, generateStats } from '@/lib/youtube/hot-calculator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cron 인증 확인
function verifyCronSecret(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // 개발 환경에서는 스킵
    if (process.env.NODE_ENV === 'development') return true;

    // Vercel Cron에서 호출 시 인증 확인
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

    return false;
}

export async function GET(request: NextRequest) {
    console.log('[Cron] hot-collect started');

    // 인증 확인
    if (!verifyCronSecret(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const today = new Date().toISOString().split('T')[0];

        // 1. 전날 핫 리스트 가져오기 (쿨다운용)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const { data: yesterdayList } = await supabase
            .from('hot_list_daily')
            .select('video_id')
            .eq('date', yesterdayStr);

        const previousListIds = new Set(
            (yesterdayList || []).map(item => item.video_id)
        );
        console.log(`[Cron] Previous list has ${previousListIds.size} videos`);

        // 2. YouTube API로 데이터 수집
        const { videos, stats, channels } = await collectHotVideos();
        console.log(`[Cron] Collected ${videos.length} videos, ${channels.length} channels`);

        // 3. 채널 정보 저장/업데이트
        if (channels.length > 0) {
            const { error: channelError } = await supabase
                .from('hot_channels')
                .upsert(
                    channels.map(ch => ({
                        channel_id: ch.channel_id,
                        title: ch.title,
                        thumbnail_url: ch.thumbnail_url,
                        subscriber_count: ch.subscriber_count,
                        video_count: ch.video_count,
                        total_view_count: ch.total_view_count,
                        avg_view_count: ch.avg_view_count,
                        updated_at: new Date().toISOString(),
                    })),
                    { onConflict: 'channel_id' }
                );

            if (channelError) {
                console.error('[Cron] Channel upsert error:', channelError);
            }
        }

        // 4. 영상 기본 정보 저장
        if (videos.length > 0) {
            const { error: videoError } = await supabase
                .from('hot_videos')
                .upsert(
                    videos.map(v => ({
                        video_id: v.video_id,
                        channel_id: v.channel_id,
                        title: v.title,
                        published_at: v.published_at,
                        duration_seconds: v.duration_seconds,
                        category_id: v.category_id,
                        thumbnail_url: v.thumbnail_url,
                    })),
                    { onConflict: 'video_id' }
                );

            if (videoError) {
                console.error('[Cron] Video upsert error:', videoError);
            }
        }

        // 5. 일별 통계 저장
        if (stats.length > 0) {
            const { error: statsError } = await supabase
                .from('hot_video_daily')
                .upsert(
                    stats.map(s => ({
                        date: today,
                        video_id: s.video_id,
                        view_count: s.view_count,
                        like_count: s.like_count,
                        comment_count: s.comment_count,
                        age_hours: s.age_hours,
                        velocity: s.velocity,
                    })),
                    { onConflict: 'date,video_id' }
                );

            if (statsError) {
                console.error('[Cron] Stats upsert error:', statsError);
            }
        }

        // 6. 핫 리스트 생성
        const hotList = generateHotList(videos, stats, channels, previousListIds);
        console.log(`[Cron] Generated ${hotList.length} hot items`);

        // 7. 핫 리스트 저장
        if (hotList.length > 0) {
            const { error: hotListError } = await supabase
                .from('hot_list_daily')
                .upsert(
                    hotList.map(item => ({
                        date: today,
                        video_id: item.video_id,
                        rank: item.rank,
                        view_count: item.view_count,
                        subscriber_count: item.subscriber_count,
                        avg_channel_views: item.avg_channel_views,
                        contribution_rate: item.contribution_rate,
                        performance_rate: item.performance_rate,
                        view_velocity: item.view_velocity,
                        engagement_rate: item.engagement_rate,
                        score: item.score,
                        reason_flags: item.reason_flags,
                    })),
                    { onConflict: 'date,video_id' }
                );

            if (hotListError) {
                console.error('[Cron] Hot list upsert error:', hotListError);
            }
        }

        // 8. 통계 생성
        const listStats = generateStats(hotList);

        console.log('[Cron] hot-collect completed successfully');

        return NextResponse.json({
            success: true,
            date: today,
            collected: {
                videos: videos.length,
                channels: channels.length,
                hotItems: hotList.length,
            },
            stats: listStats,
        });

    } catch (error) {
        console.error('[Cron] hot-collect error:', error);
        return NextResponse.json(
            { error: 'Collection failed', details: String(error) },
            { status: 500 }
        );
    }
}

// Vercel Cron 설정
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60초 타임아웃
