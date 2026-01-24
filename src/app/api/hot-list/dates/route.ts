/**
 * 📅 핫 리스트 수집 날짜 목록 API
 * GET /api/hot-list/dates - 수집된 날짜 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json({ dates: [], error: 'Database not configured' });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // 수집된 날짜 목록 조회 (중복 제거, 최신순)
        const { data, error } = await supabase
            .from('hot_list_daily')
            .select('date')
            .order('date', { ascending: false });

        if (error) {
            console.error('Dates query error:', error);
            return NextResponse.json({ dates: [], error: error.message });
        }

        // 중복 제거
        const uniqueDates = [...new Set((data || []).map(d => d.date))];

        // 각 날짜별 아이템 수 조회
        const datesWithCount = await Promise.all(
            uniqueDates.slice(0, 30).map(async (date) => {
                const { count } = await supabase
                    .from('hot_list_daily')
                    .select('*', { count: 'exact', head: true })
                    .eq('date', date);
                return { date, count: count || 0 };
            })
        );

        return NextResponse.json({
            dates: datesWithCount,
            total: uniqueDates.length,
        });

    } catch (error) {
        console.error('Dates API error:', error);
        return NextResponse.json({ dates: [], error: 'Server error' });
    }
}
