import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

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

// 유효한 액세스 토큰 가져오기
async function getValidAccessToken(): Promise<string | null> {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('youtube_access_token')?.value;
    const refreshToken = cookieStore.get('youtube_refresh_token')?.value;

    if (!accessToken && refreshToken) {
        accessToken = await refreshAccessToken(refreshToken) || undefined;
        if (accessToken) {
            cookieStore.set('youtube_access_token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 3600,
                path: '/',
            });
        }
    }

    return accessToken || null;
}

// YouTube Data API로 채널 및 영상 정보 수집
async function fetchYouTubeData(accessToken: string, maxVideos: number = 50) {
    // 1. 채널 정보
    const channelRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true',
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const channelData = await channelRes.json();

    if (!channelData.items || channelData.items.length === 0) {
        throw new Error('No channel found');
    }

    const channel = channelData.items[0];
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

    // 2. 영상 목록 가져오기 (페이지네이션)
    const videos: any[] = [];
    let nextPageToken = null;

    while (videos.length < maxVideos) {
        const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
        url.searchParams.set('part', 'snippet,contentDetails');
        url.searchParams.set('playlistId', uploadsPlaylistId);
        url.searchParams.set('maxResults', String(Math.min(50, maxVideos - videos.length)));
        if (nextPageToken) url.searchParams.set('pageToken', nextPageToken);

        const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();

        if (data.items) {
            for (const item of data.items) {
                videos.push({
                    video_id: item.snippet.resourceId.videoId,
                    title: item.snippet.title,
                    published_at: item.snippet.publishedAt,
                    thumbnail: item.snippet.thumbnails?.medium?.url,
                });
            }
        }

        nextPageToken = data.nextPageToken;
        if (!nextPageToken) break;
    }

    // 3. 영상 상세 정보 (조회수, 좋아요 등) - 50개씩 배치
    const videoDetails: Record<string, any> = {};
    for (let i = 0; i < videos.length; i += 50) {
        const batch = videos.slice(i, i + 50);
        const ids = batch.map(v => v.video_id).join(',');

        const statsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${ids}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const statsData = await statsRes.json();

        if (statsData.items) {
            for (const item of statsData.items) {
                videoDetails[item.id] = {
                    view_count: parseInt(item.statistics?.viewCount || '0'),
                    like_count: parseInt(item.statistics?.likeCount || '0'),
                    comment_count: parseInt(item.statistics?.commentCount || '0'),
                    duration: item.contentDetails?.duration,
                };
            }
        }
    }

    // 영상에 상세 정보 병합
    for (const video of videos) {
        if (videoDetails[video.video_id]) {
            Object.assign(video, videoDetails[video.video_id]);
        }
    }

    return {
        channel: {
            channel_id: channel.id,
            title: channel.snippet.title,
            thumbnail: channel.snippet.thumbnails?.default?.url,
            subscriber_count: parseInt(channel.statistics?.subscriberCount || '0'),
            video_count: parseInt(channel.statistics?.videoCount || '0'),
            view_count: parseInt(channel.statistics?.viewCount || '0'),
        },
        videos,
    };
}

// YouTube Analytics API로 분석 데이터 수집
async function fetchAnalyticsData(accessToken: string, videoIds: string[]) {
    if (videoIds.length === 0) return {};

    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const endDate = new Date();

    const analytics: Record<string, any> = {};

    try {
        // 배치로 영상 분석 데이터 수집
        const response = await fetch(
            `https://youtubeanalytics.googleapis.com/v2/reports?` +
            `ids=channel==MINE` +
            `&startDate=${startDate.toISOString().split('T')[0]}` +
            `&endDate=${endDate.toISOString().split('T')[0]}` +
            `&metrics=views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,subscribersGained` +
            `&dimensions=video` +
            `&maxResults=500`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const data = await response.json();

        if (data.rows) {
            for (const row of data.rows) {
                const videoId = row[0];
                analytics[videoId] = {
                    views: row[1] || 0,
                    watch_time_minutes: row[2] || 0,
                    avg_view_duration: row[3] || 0,
                    avg_view_percentage: row[4] || 0,
                    likes: row[5] || 0,
                    comments: row[6] || 0,
                    subscribers_gained: row[7] || 0,
                };
            }
        }
    } catch (error) {
        console.error('Analytics API error:', error);
    }

    return analytics;
}

// POST: 전체 영상 동기화 및 DB 저장
export async function POST(request: NextRequest) {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
        return NextResponse.json({ error: 'Not connected to YouTube' }, { status: 401 });
    }

    // 사용자 인증 확인
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const maxVideos = body.maxVideos || 50;

        // 1. YouTube 데이터 수집
        const ytData = await fetchYouTubeData(accessToken, maxVideos);

        // 2. Analytics 데이터 수집
        const videoIds = ytData.videos.map(v => v.video_id);
        const analyticsData = await fetchAnalyticsData(accessToken, videoIds);

        // 3. 채널 데이터 저장
        const { error: channelError } = await supabase
            .from('youtube_channels')
            .upsert({
                user_id: user.id,
                channel_id: ytData.channel.channel_id,
                title: ytData.channel.title,
                subscriber_count: ytData.channel.subscriber_count,
                video_count: ytData.channel.video_count,
                view_count: ytData.channel.view_count,
                channel_data: ytData.channel,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,channel_id'
            });

        if (channelError) {
            console.error('Channel save error:', channelError);
        }

        // 4. 영상 데이터 저장
        const videosToUpsert = ytData.videos.map(video => ({
            user_id: user.id,
            channel_id: ytData.channel.channel_id,
            video_id: video.video_id,
            title: video.title,
            published_at: video.published_at,
            view_count: video.view_count || 0,
            like_count: video.like_count || 0,
            comment_count: video.comment_count || 0,
            avg_view_duration: analyticsData[video.video_id]?.avg_view_duration || 0,
            avg_view_percentage: analyticsData[video.video_id]?.avg_view_percentage || 0,
            analytics_data: analyticsData[video.video_id] || null,
            updated_at: new Date().toISOString(),
        }));

        // 배치로 저장
        for (let i = 0; i < videosToUpsert.length; i += 50) {
            const batch = videosToUpsert.slice(i, i + 50);
            const { error: videoError } = await supabase
                .from('youtube_videos')
                .upsert(batch, {
                    onConflict: 'user_id,video_id'
                });

            if (videoError) {
                console.error('Video save error:', videoError);
            }
        }

        return NextResponse.json({
            success: true,
            channel: ytData.channel,
            videoCount: ytData.videos.length,
            message: `${ytData.videos.length}개 영상 동기화 완료`,
        });

    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
    }
}

// GET: 저장된 데이터 조회
export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 채널 정보 조회
        const { data: channelData } = await supabase
            .from('youtube_channels')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // 영상 목록 조회
        const { data: videosData } = await supabase
            .from('youtube_videos')
            .select('*')
            .eq('user_id', user.id)
            .order('published_at', { ascending: false });

        return NextResponse.json({
            channel: channelData,
            videos: videosData || [],
            videoCount: videosData?.length || 0,
        });

    } catch (error: any) {
        console.error('Get sync data error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
