/**
 * 📊 핫 리스트 순위 변화 분석 API
 * GET /api/hot-list/trends - 날짜별 순위 변화 분석
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json({ error: 'Database not configured' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // 최근 4일 날짜 가져오기
        const { data: datesData } = await supabase
            .from('hot_list_daily')
            .select('date')
            .order('date', { ascending: false });

        const uniqueDates = [...new Set((datesData || []).map(d => d.date))].slice(0, 4);

        if (uniqueDates.length < 2) {
            return NextResponse.json({
                error: 'Not enough data for trend analysis',
                dates: uniqueDates
            });
        }

        // 각 날짜별 데이터 가져오기
        const dateDataMap: Record<string, any[]> = {};
        for (const date of uniqueDates) {
            const { data } = await supabase
                .from('hot_list_daily')
                .select('video_id, rank, score, view_count, performance_rate, view_velocity')
                .eq('date', date)
                .order('rank', { ascending: true });
            dateDataMap[date] = data || [];
        }

        // 영상 정보 가져오기
        const allVideoIds = new Set<string>();
        Object.values(dateDataMap).forEach(items => {
            items.forEach(item => allVideoIds.add(item.video_id));
        });

        const { data: videos } = await supabase
            .from('hot_videos')
            .select('video_id, title, channel_id')
            .in('video_id', Array.from(allVideoIds));

        const videoMap = new Map((videos || []).map(v => [v.video_id, v]));

        // 채널 정보
        const channelIds = [...new Set((videos || []).map(v => v.channel_id).filter(Boolean))];
        const { data: channels } = channelIds.length > 0
            ? await supabase.from('hot_channels').select('channel_id, title').in('channel_id', channelIds)
            : { data: [] };
        const channelMap = new Map((channels || []).map(c => [c.channel_id, c]));

        // 순위 변화 분석
        const latestDate = uniqueDates[0];
        const previousDate = uniqueDates[1];

        const latestItems = dateDataMap[latestDate];
        const previousItems = dateDataMap[previousDate];
        const previousRankMap = new Map(previousItems.map(i => [i.video_id, i.rank]));

        // 변화 유형별 분류
        const trends = {
            new_entries: [] as any[],      // 새로 진입
            rising: [] as any[],           // 순위 상승
            falling: [] as any[],          // 순위 하락
            stable: [] as any[],           // 유지
            dropped_out: [] as any[],      // 퇴출
        };

        // 최신 날짜 기준 분석
        for (const item of latestItems) {
            const video = videoMap.get(item.video_id);
            const channel = video ? channelMap.get(video.channel_id) : null;
            const previousRank = previousRankMap.get(item.video_id);

            const trendItem = {
                video_id: item.video_id,
                title: video?.title || 'Unknown',
                channel: channel?.title || 'Unknown',
                current_rank: item.rank,
                previous_rank: previousRank || null,
                rank_change: previousRank ? previousRank - item.rank : null,
                score: item.score,
                view_count: item.view_count,
                performance_rate: item.performance_rate,
                view_velocity: item.view_velocity,
            };

            if (!previousRank) {
                trends.new_entries.push(trendItem);
            } else if (previousRank > item.rank) {
                trends.rising.push(trendItem);
            } else if (previousRank < item.rank) {
                trends.falling.push(trendItem);
            } else {
                trends.stable.push(trendItem);
            }
        }

        // 퇴출된 영상 (이전에 있었지만 현재 없는)
        const currentVideoIds = new Set(latestItems.map(i => i.video_id));
        for (const item of previousItems) {
            if (!currentVideoIds.has(item.video_id)) {
                const video = videoMap.get(item.video_id);
                const channel = video ? channelMap.get(video.channel_id) : null;
                trends.dropped_out.push({
                    video_id: item.video_id,
                    title: video?.title || 'Unknown',
                    channel: channel?.title || 'Unknown',
                    previous_rank: item.rank,
                    score: item.score,
                });
            }
        }

        // 정렬
        trends.rising.sort((a, b) => (b.rank_change || 0) - (a.rank_change || 0));
        trends.falling.sort((a, b) => (a.rank_change || 0) - (b.rank_change || 0));
        trends.new_entries.sort((a, b) => a.current_rank - b.current_rank);

        // 통계
        const stats = {
            dates: {
                latest: latestDate,
                previous: previousDate,
            },
            counts: {
                total_latest: latestItems.length,
                total_previous: previousItems.length,
                new_entries: trends.new_entries.length,
                rising: trends.rising.length,
                falling: trends.falling.length,
                stable: trends.stable.length,
                dropped_out: trends.dropped_out.length,
            },
            top_risers: trends.rising.slice(0, 5),
            top_fallers: trends.falling.slice(0, 5),
            new_entries: trends.new_entries.slice(0, 10),
            dropped_out: trends.dropped_out.slice(0, 10),
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error('Trends API error:', error);
        return NextResponse.json({ error: 'Server error' });
    }
}
