/**
 * 🔥 YouTube 핫 영상 수집기
 * - mostPopular (트렌딩) 수집
 * - search (시간대별) 수집
 * - 영상/채널 상세 정보 보강
 */

import { HotVideo, HotChannel, HotVideoDailyStats, KR_VIDEO_CATEGORIES } from './hot-types';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// ISO 8601 Duration → 초 변환
function parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    return hours * 3600 + minutes * 60 + seconds;
}

// 영상 나이 계산 (시간)
function getAgeHours(publishedAt: string): number {
    const published = new Date(publishedAt);
    const now = new Date();
    return (now.getTime() - published.getTime()) / (1000 * 60 * 60);
}

/**
 * 트렌딩 영상 수집 (mostPopular)
 */
export async function collectMostPopular(
    maxResults: number = 50,
    categoryId?: string
): Promise<string[]> {
    if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY not configured');

    const params = new URLSearchParams({
        part: 'id',
        chart: 'mostPopular',
        regionCode: 'KR',
        maxResults: String(Math.min(maxResults, 50)),
        key: YOUTUBE_API_KEY,
    });

    if (categoryId) {
        params.set('videoCategoryId', categoryId);
    }

    const url = `${YOUTUBE_API_BASE}/videos?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
        console.error('mostPopular error:', data.error);
        return [];
    }

    return (data.items || []).map((item: any) => item.id);
}

/**
 * 검색으로 영상 수집 (시간대별)
 */
export async function collectBySearch(
    publishedAfter: Date,
    publishedBefore: Date,
    maxResults: number = 50
): Promise<string[]> {
    if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY not configured');

    const params = new URLSearchParams({
        part: 'id',
        type: 'video',
        order: 'viewCount',
        regionCode: 'KR',
        publishedAfter: publishedAfter.toISOString(),
        publishedBefore: publishedBefore.toISOString(),
        maxResults: String(Math.min(maxResults, 50)),
        key: YOUTUBE_API_KEY,
    });

    const url = `${YOUTUBE_API_BASE}/search?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
        console.error('search error:', data.error);
        return [];
    }

    return (data.items || []).map((item: any) => item.id.videoId).filter(Boolean);
}

/**
 * 영상 상세 정보 가져오기 (배치)
 */
export async function getVideoDetails(
    videoIds: string[]
): Promise<{ videos: HotVideo[]; stats: HotVideoDailyStats[] }> {
    if (!YOUTUBE_API_KEY || videoIds.length === 0) {
        return { videos: [], stats: [] };
    }

    const videos: HotVideo[] = [];
    const stats: HotVideoDailyStats[] = [];

    // 50개씩 배치 처리
    for (let i = 0; i < videoIds.length; i += 50) {
        const batch = videoIds.slice(i, i + 50);

        const params = new URLSearchParams({
            part: 'snippet,statistics,contentDetails,liveStreamingDetails',
            id: batch.join(','),
            key: YOUTUBE_API_KEY,
        });

        const url = `${YOUTUBE_API_BASE}/videos?${params}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            console.error('videos.list error:', data.error);
            continue;
        }

        for (const item of data.items || []) {
            const snippet = item.snippet || {};
            const statistics = item.statistics || {};
            const contentDetails = item.contentDetails || {};
            const liveDetails = item.liveStreamingDetails;

            // 라이브/예정 영상 제외
            if (liveDetails?.actualStartTime || liveDetails?.scheduledStartTime) {
                continue;
            }

            const publishedAt = snippet.publishedAt || new Date().toISOString();
            const ageHours = getAgeHours(publishedAt);
            const viewCount = parseInt(statistics.viewCount || '0');

            videos.push({
                video_id: item.id,
                channel_id: snippet.channelId || '',
                title: snippet.title || '',
                published_at: publishedAt,
                duration_seconds: parseDuration(contentDetails.duration || 'PT0S'),
                category_id: snippet.categoryId || '',
                thumbnail_url: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
            });

            stats.push({
                video_id: item.id,
                view_count: viewCount,
                like_count: parseInt(statistics.likeCount || '0'),
                comment_count: parseInt(statistics.commentCount || '0'),
                age_hours: ageHours,
                velocity: viewCount / (ageHours + 2),
            });
        }
    }

    return { videos, stats };
}

/**
 * 채널 정보 가져오기 (배치)
 */
export async function getChannelDetails(
    channelIds: string[]
): Promise<HotChannel[]> {
    if (!YOUTUBE_API_KEY || channelIds.length === 0) {
        return [];
    }

    const channels: HotChannel[] = [];
    const uniqueIds = [...new Set(channelIds)];

    // 50개씩 배치 처리
    for (let i = 0; i < uniqueIds.length; i += 50) {
        const batch = uniqueIds.slice(i, i + 50);

        const params = new URLSearchParams({
            part: 'snippet,statistics',
            id: batch.join(','),
            key: YOUTUBE_API_KEY,
        });

        const url = `${YOUTUBE_API_BASE}/channels?${params}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            console.error('channels.list error:', data.error);
            continue;
        }

        for (const item of data.items || []) {
            const snippet = item.snippet || {};
            const statistics = item.statistics || {};

            const subscriberCount = parseInt(statistics.subscriberCount || '0');
            const videoCount = parseInt(statistics.videoCount || '0');
            const viewCount = parseInt(statistics.viewCount || '0');

            // 평균 조회수 근사 (총조회수 / 영상수)
            const avgViewCount = videoCount > 0 ? Math.round(viewCount / videoCount) : 0;

            channels.push({
                channel_id: item.id,
                title: snippet.title || '',
                thumbnail_url: snippet.thumbnails?.default?.url || '',
                subscriber_count: subscriberCount,
                video_count: videoCount,
                total_view_count: viewCount,
                avg_view_count: avgViewCount,
            });
        }
    }

    return channels;
}

/**
 * 전체 수집 프로세스
 * 1. mostPopular (카테고리별)
 * 2. search (시간대별)
 * 3. 상세 정보 보강
 */
export async function collectHotVideos(): Promise<{
    videos: HotVideo[];
    stats: HotVideoDailyStats[];
    channels: HotChannel[];
}> {
    console.log('[HotCollector] Starting collection...');

    const allVideoIds = new Set<string>();

    // 1. mostPopular 수집 (전체 + 주요 카테고리)
    console.log('[HotCollector] Collecting mostPopular...');
    const popularIds = await collectMostPopular(50);
    popularIds.forEach(id => allVideoIds.add(id));

    // 주요 카테고리별 수집
    const categories = ['10', '20', '22', '24', '25']; // 음악, 게임, 블로그, 엔터, 뉴스
    for (const catId of categories) {
        const catIds = await collectMostPopular(30, catId);
        catIds.forEach(id => allVideoIds.add(id));
    }

    console.log(`[HotCollector] mostPopular: ${allVideoIds.size} videos`);

    // 2. 시간대별 search 수집 (24시간을 6시간 단위로)
    console.log('[HotCollector] Collecting by search...');
    const now = new Date();
    const intervals = [0, 6, 12, 18]; // 시간 간격

    for (const hoursAgo of intervals) {
        const before = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
        const after = new Date(before.getTime() - 6 * 60 * 60 * 1000);

        const searchIds = await collectBySearch(after, before, 50);
        searchIds.forEach(id => allVideoIds.add(id));
    }

    console.log(`[HotCollector] Total candidates: ${allVideoIds.size} videos`);

    // 3. 영상 상세 정보 가져오기
    console.log('[HotCollector] Getting video details...');
    const { videos, stats } = await getVideoDetails([...allVideoIds]);
    console.log(`[HotCollector] Got details for ${videos.length} videos`);

    // 4. 채널 정보 가져오기
    console.log('[HotCollector] Getting channel details...');
    const channelIds = videos.map(v => v.channel_id);
    const channels = await getChannelDetails(channelIds);
    console.log(`[HotCollector] Got details for ${channels.length} channels`);

    return { videos, stats, channels };
}
