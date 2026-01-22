/**
 * 🔥 핫 리스트 API
 * GET /api/hot-list - 오늘 핫 리스트 조회
 * GET /api/hot-list?date=2026-01-23 - 특정 날짜 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { KR_VIDEO_CATEGORIES } from '@/lib/youtube/hot-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
    // 환경변수 체크
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase env vars');
        return NextResponse.json({
            date: new Date().toISOString().split('T')[0],
            total: 0,
            items: [],
            stats: { avg_views: 0, avg_performance: 0, max_performance: 0, top_category: '-' },
            error: 'Database not configured'
        });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const searchParams = request.nextUrl.searchParams;

        // 파라미터 파싱
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
        const offset = parseInt(searchParams.get('offset') || '0');
        const sortBy = searchParams.get('sort') || 'score';

        // 필터 파라미터
        const minSubs = parseInt(searchParams.get('min_subs') || '0');
        const maxSubs = parseInt(searchParams.get('max_subs') || '0');
        const minPerf = parseInt(searchParams.get('min_perf') || '0');

        // 먼저 hot_list_daily만 조회
        let query = supabase
            .from('hot_list_daily')
            .select('*')
            .eq('date', date);

        // 성과 필터
        if (minPerf > 0) {
            query = query.gte('performance_rate', minPerf);
        }

        // 구독자 필터
        if (minSubs > 0) {
            query = query.gte('subscriber_count', minSubs);
        }
        if (maxSubs > 0) {
            query = query.lte('subscriber_count', maxSubs);
        }

        // 정렬
        if (sortBy === 'velocity') {
            query = query.order('view_velocity', { ascending: false });
        } else if (sortBy === 'performance') {
            query = query.order('performance_rate', { ascending: false });
        } else if (sortBy === 'views') {
            query = query.order('view_count', { ascending: false });
        } else {
            query = query.order('score', { ascending: false });
        }

        // 페이지네이션
        query = query.range(offset, offset + limit - 1);

        const { data: items, error } = await query;

        if (error) {
            console.error('Hot list query error:', error);
        }

        // 데이터가 없으면 빈 응답
        if (!items || items.length === 0) {
            return NextResponse.json({
                date,
                total: 0,
                items: [],
                stats: {
                    avg_views: 0,
                    avg_performance: 0,
                    max_performance: 0,
                    top_category: '아직 데이터 없음',
                },
            });
        }

        // 영상 정보 조회
        const videoIds = items.map(item => item.video_id);
        const { data: videos } = await supabase
            .from('hot_videos')
            .select('*')
            .in('video_id', videoIds);

        const videoMap = new Map(
            (videos || []).map(v => [v.video_id, v])
        );

        // 채널 정보 조회
        const channelIds = [...new Set((videos || []).map(v => v.channel_id).filter(Boolean))];
        const { data: channels } = channelIds.length > 0
            ? await supabase.from('hot_channels').select('*').in('channel_id', channelIds)
            : { data: [] };

        const channelMap = new Map(
            (channels || []).map(ch => [ch.channel_id, ch])
        );

        // 응답 데이터 구성
        const enrichedItems = items.map(item => {
            const video = videoMap.get(item.video_id);
            const channel = video ? channelMap.get(video.channel_id) : null;
            return {
                ...item,
                video: video || null,
                channel: channel || null,
                category_name: video?.category_id
                    ? (KR_VIDEO_CATEGORIES[video.category_id as keyof typeof KR_VIDEO_CATEGORIES] || '기타')
                    : '기타',
            };
        });

        // 전체 개수 조회
        const { count } = await supabase
            .from('hot_list_daily')
            .select('*', { count: 'exact', head: true })
            .eq('date', date);

        // 통계 계산
        const stats = {
            avg_views: enrichedItems.length > 0
                ? Math.round(enrichedItems.reduce((sum, i) => sum + (i.view_count || 0), 0) / enrichedItems.length)
                : 0,
            avg_performance: enrichedItems.length > 0
                ? enrichedItems.reduce((sum, i) => sum + (i.performance_rate || 0), 0) / enrichedItems.length
                : 0,
            max_performance: enrichedItems.length > 0
                ? Math.max(...enrichedItems.map(i => i.performance_rate || 0))
                : 0,
            top_category: '엔터테인먼트',
        };

        return NextResponse.json({
            date,
            total: count || 0,
            items: enrichedItems,
            stats,
        });

    } catch (error) {
        console.error('Hot list API error:', error);
        return NextResponse.json({
            date: new Date().toISOString().split('T')[0],
            total: 0,
            items: [],
            stats: { avg_views: 0, avg_performance: 0, max_performance: 0, top_category: '-' },
            error: 'Server error'
        });
    }
}

