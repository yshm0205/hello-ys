/**
 * 🔥 핫 리스트 API
 * GET /api/hot-list - 오늘 핫 리스트 조회
 * GET /api/hot-list?date=2026-01-23 - 특정 날짜 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { HotListResponse, KR_VIDEO_CATEGORIES } from '@/lib/youtube/hot-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const searchParams = request.nextUrl.searchParams;

        // 파라미터 파싱
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
        const offset = parseInt(searchParams.get('offset') || '0');
        const category = searchParams.get('category');
        const sortBy = searchParams.get('sort') || 'score'; // score, velocity, performance

        // 핫 리스트 조회 (영상 + 채널 정보 조인)
        let query = supabase
            .from('hot_list_daily')
            .select(`
        *,
        video:hot_videos!inner(
          video_id,
          title,
          published_at,
          duration_seconds,
          category_id,
          thumbnail_url,
          channel_id
        )
      `)
            .eq('date', date);

        // 카테고리 필터
        if (category) {
            query = query.eq('video.category_id', category);
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
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 채널 정보 추가 로드
        const channelIds = [...new Set((items || []).map(item => item.video?.channel_id).filter(Boolean))];

        const { data: channels } = await supabase
            .from('hot_channels')
            .select('*')
            .in('channel_id', channelIds);

        const channelMap = new Map(
            (channels || []).map(ch => [ch.channel_id, ch])
        );

        // 응답 데이터 구성
        const enrichedItems = (items || []).map(item => ({
            ...item,
            channel: channelMap.get(item.video?.channel_id) || null,
            category_name: KR_VIDEO_CATEGORIES[item.video?.category_id as keyof typeof KR_VIDEO_CATEGORIES] || '기타',
        }));

        // 전체 개수 조회
        const { count } = await supabase
            .from('hot_list_daily')
            .select('*', { count: 'exact', head: true })
            .eq('date', date);

        // 통계 계산
        const stats = {
            avg_views: enrichedItems.length > 0
                ? Math.round(enrichedItems.reduce((sum, i) => sum + i.view_count, 0) / enrichedItems.length)
                : 0,
            avg_performance: enrichedItems.length > 0
                ? enrichedItems.reduce((sum, i) => sum + i.performance_rate, 0) / enrichedItems.length
                : 0,
            max_performance: enrichedItems.length > 0
                ? Math.max(...enrichedItems.map(i => i.performance_rate))
                : 0,
            top_category: '엔터테인먼트', // TODO: 실제 계산
        };

        const response: HotListResponse = {
            date,
            total: count || 0,
            items: enrichedItems,
            stats,
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Hot list API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch hot list' },
            { status: 500 }
        );
    }
}
