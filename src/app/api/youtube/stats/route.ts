import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// 토큰 갱신 함수
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
        if (tokens.access_token) {
            return tokens.access_token;
        }
    } catch (error) {
        console.error('Token refresh error:', error);
    }
    return null;
}

// YouTube 채널/영상 통계 조회 API
export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('youtube_access_token')?.value;
    const refreshToken = cookieStore.get('youtube_refresh_token')?.value;

    // 토큰이 없으면 연결 안 됨
    if (!accessToken) {
        if (refreshToken) {
            // 토큰 갱신 시도
            accessToken = await refreshAccessToken(refreshToken) || undefined;
            if (accessToken) {
                // 새 토큰 저장
                cookieStore.set('youtube_access_token', accessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 3600,
                    path: '/',
                });
            }
        }

        if (!accessToken) {
            return NextResponse.json({ connected: false, error: 'Not connected to YouTube' }, { status: 401 });
        }
    }

    try {
        // 1. 채널 정보 조회
        const channelResponse = await fetch(
            'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const channelData = await channelResponse.json();

        if (channelData.error) {
            // 토큰 만료 시 갱신 시도
            if (channelData.error.code === 401 && refreshToken) {
                accessToken = await refreshAccessToken(refreshToken) || undefined;
                if (accessToken) {
                    // 재시도
                    const retryResponse = await fetch(
                        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    );
                    const retryData = await retryResponse.json();
                    if (!retryData.error) {
                        return processChannelData(retryData, accessToken);
                    }
                }
            }
            return NextResponse.json({ connected: false, error: channelData.error.message }, { status: 400 });
        }

        return processChannelData(channelData, accessToken);

    } catch (error) {
        console.error('YouTube stats error:', error);
        return NextResponse.json({ connected: false, error: 'Failed to fetch YouTube data' }, { status: 500 });
    }
}

async function processChannelData(channelData: any, accessToken: string) {
    if (!channelData.items || channelData.items.length === 0) {
        return NextResponse.json({ connected: true, channel: null, videos: [] });
    }

    const channel = channelData.items[0];
    const channelInfo = {
        id: channel.id,
        title: channel.snippet.title,
        thumbnail: channel.snippet.thumbnails?.default?.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics.videoCount || '0'),
        viewCount: parseInt(channel.statistics.viewCount || '0'),
    };

    // 2. 최근 영상 목록 조회 (최근 10개)
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
    let videos: any[] = [];

    if (uploadsPlaylistId) {
        const videosResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const videosData = await videosResponse.json();

        if (videosData.items) {
            const videoIds = videosData.items.map((v: any) => v.snippet.resourceId.videoId).join(',');

            // 영상 상세 정보 (조회수 등)
            const statsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const statsData = await statsResponse.json();
            const statsMap = new Map(statsData.items?.map((v: any) => [v.id, v]) || []);

            videos = videosData.items.map((item: any) => {
                const videoId = item.snippet.resourceId.videoId;
                const stats = statsMap.get(videoId) as any;
                return {
                    id: videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails?.medium?.url,
                    publishedAt: item.snippet.publishedAt,
                    viewCount: parseInt(stats?.statistics?.viewCount || '0'),
                    likeCount: parseInt(stats?.statistics?.likeCount || '0'),
                    commentCount: parseInt(stats?.statistics?.commentCount || '0'),
                };
            });
        }
    }

    return NextResponse.json({
        connected: true,
        channel: channelInfo,
        videos,
    });
}

// 연결 해제
export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete('youtube_access_token');
    cookieStore.delete('youtube_refresh_token');

    return NextResponse.json({ success: true, message: 'YouTube disconnected' });
}
