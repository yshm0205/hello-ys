import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// 토큰 갱신
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;

    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });

        const tokens = await response.json();
        return tokens.access_token || null;
    } catch (error) {
        console.error('Token refresh error:', error);
        return null;
    }
}

// 유효한 액세스 토큰 가져오기
async function getValidAccessToken(): Promise<string | null> {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('youtube_access_token')?.value;
    const refreshToken = cookieStore.get('youtube_refresh_token')?.value;

    if (!accessToken && refreshToken) {
        accessToken = await refreshAccessToken(refreshToken) || undefined;
    }

    return accessToken || null;
}

// GET: 특정 영상의 시청자 유지율 곡선 조회
export async function GET(request: NextRequest) {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
        return NextResponse.json({ error: 'Not connected to YouTube' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
        return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    try {
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        const endDate = new Date();

        // YouTube Analytics API로 유지율 곡선 조회
        // elapsedVideoTimeRatio 차원으로 시간별 데이터 요청
        const response = await fetch(
            `https://youtubeanalytics.googleapis.com/v2/reports?` +
            `ids=channel==MINE` +
            `&startDate=${startDate.toISOString().split('T')[0]}` +
            `&endDate=${endDate.toISOString().split('T')[0]}` +
            `&metrics=audienceWatchRatio,relativeRetentionPerformance` +
            `&dimensions=elapsedVideoTimeRatio` +
            `&filters=video==${videoId}` +
            `&sort=elapsedVideoTimeRatio`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const data = await response.json();

        if (data.error) {
            return NextResponse.json({
                error: data.error.message || 'Analytics API error',
                code: data.error.code
            }, { status: 400 });
        }

        if (!data.rows || data.rows.length === 0) {
            return NextResponse.json({
                videoId,
                dataPoints: [],
                message: 'No retention data available (may take up to 48 hours)'
            });
        }

        // 데이터 변환
        const dataPoints = data.rows.map((row: any[]) => ({
            ratio: parseFloat(row[0]),  // 영상 진행률 (0.01 ~ 1.00)
            retention: parseFloat(row[1]) || 0,  // 시청자 유지율
            relativePerformance: parseFloat(row[2]) || 0.5,  // 상대 성과
        }));

        // 통계 계산
        const retentions = dataPoints.map((p: any) => p.retention);
        const avgRetention = retentions.length > 0
            ? retentions.reduce((a: number, b: number) => a + b, 0) / retentions.length
            : 0;

        // 급락/스파이크 지점 탐지
        const dropOffPoints: number[] = [];
        const spikePoints: number[] = [];

        for (let i = 1; i < retentions.length; i++) {
            const diff = retentions[i] - retentions[i - 1];
            if (diff < -0.1) {  // 10% 이상 급락
                dropOffPoints.push(i);
            } else if (diff > 0.05) {  // 5% 이상 상승 (되감기 등)
                spikePoints.push(i);
            }
        }

        return NextResponse.json({
            videoId,
            dataPoints,
            avgRetention,
            dropOffPoints,
            spikePoints,
            pointCount: dataPoints.length,
        });

    } catch (error: any) {
        console.error('Retention API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch retention data' }, { status: 500 });
    }
}
