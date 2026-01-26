/**
 * 🔥 YouTube 핫 영상 수집기 v2
 * 사용자 스크립트 기반 전면 개편:
 * - mostPopular + keyword search + related videos
 * - 스튜디오 콘텐츠 필터 (MV, 영화, Topic 채널)
 * - 쇼츠 비율 제한, 채널당 제한
 */

import { HotVideo, HotChannel, HotVideoDailyStats, KR_VIDEO_CATEGORIES } from './hot-types';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// ============ 유틸리티 함수 ============

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

// 키워드 추출 (트렌딩 제목에서)
const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with', 'from',
    'by', 'as', 'at', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'it', 'its',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'them',
    'my', 'your', 'our', 'their', 'me', 'us', 'him', 'her', 'not', 'no', 'yes', 'ok',
    'official', 'episode', 'ep', 'part', 'full', 'live', 'music', 'video', 'mv',
    'trailer', 'teaser', 'shorts', 'highlight', 'clip', 'ost', 'ver', 'version',
    '공식', '뮤직비디오', '예고편', '티저', '본편', '화', '시즌'
]);

function extractKeywords(titles: string[], limit: number = 20): string[] {
    const counts = new Map<string, number>();
    for (const title of titles) {
        const tokens = (title || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
        for (const t of tokens) {
            if (t.length < 2) continue;
            if (/^\d+$/.test(t)) continue;
            if (STOPWORDS.has(t)) continue;
            counts.set(t, (counts.get(t) || 0) + 1);
        }
    }
    const scored = Array.from(counts.entries()).map(([token, count]) => ({
        token,
        score: count * (1 + Math.min(token.length, 12) / 12)
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.token);
}

// ============ 스튜디오 콘텐츠 필터 ============

function isStudioContent(title: string, channelTitle: string, categoryId: string): boolean {
    // 1) 카테고리 제외: 음악(10)
    if (categoryId === '10') return true;

    // 2) 채널명 패턴: Topic 채널 (YouTube 자동 생성 음악 채널)
    if (channelTitle.includes('- Topic') || channelTitle.includes(' Topic')) return true;

    // 3) 채널명 패턴: VEVO, Official, 공식, Studios 등
    const studioChannelPattern = /\b(VEVO|Official|공식|Studios|Pictures|Entertainment|Records|Music)\b/i;
    if (studioChannelPattern.test(channelTitle)) return true;

    // 4) 제목 패턴: MV, 뮤직비디오, Trailer, 예고편, EP, Episode 등
    const studioTitlePattern = /\b(Official\s*M\/?V|Music\s*Video|뮤직비디오|MV|Trailer|예고편|티저|Teaser|OST|O\.S\.T|본편|하이라이트|Highlight|EP\s*\d|Episode\s*\d|\d+화|시즌\s*\d|Season\s*\d)\b/i;
    if (studioTitlePattern.test(title)) return true;

    return false;
}

// ============ API 호출 함수들 ============

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
 * 키워드 검색으로 영상 수집
 */
export async function collectByKeyword(
    keyword: string,
    publishedAfter: Date,
    maxResults: number = 50
): Promise<string[]> {
    if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY not configured');

    const params = new URLSearchParams({
        part: 'id',
        type: 'video',
        q: keyword,
        order: 'viewCount',
        regionCode: 'KR',
        publishedAfter: publishedAfter.toISOString(),
        maxResults: String(Math.min(maxResults, 50)),
        key: YOUTUBE_API_KEY,
    });

    const url = `${YOUTUBE_API_BASE}/search?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
        console.error('keyword search error:', data.error);
        return [];
    }

    return (data.items || []).map((item: any) => item.id?.videoId).filter(Boolean);
}

/**
 * 관련 영상 수집
 */
export async function collectRelated(
    videoId: string,
    maxResults: number = 25
): Promise<string[]> {
    if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY not configured');

    const params = new URLSearchParams({
        part: 'id',
        type: 'video',
        relatedToVideoId: videoId,
        maxResults: String(Math.min(maxResults, 50)),
        key: YOUTUBE_API_KEY,
    });

    const url = `${YOUTUBE_API_BASE}/search?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
        console.error('related search error:', data.error);
        return [];
    }

    return (data.items || []).map((item: any) => item.id?.videoId).filter(Boolean);
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
): Promise<{ videos: HotVideo[]; stats: HotVideoDailyStats[]; titles: string[] }> {
    if (!YOUTUBE_API_KEY || videoIds.length === 0) {
        return { videos: [], stats: [], titles: [] };
    }

    const videos: HotVideo[] = [];
    const stats: HotVideoDailyStats[] = [];
    const titles: string[] = [];

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

            const title = snippet.title || '';
            const channelTitle = snippet.channelTitle || '';
            const categoryId = snippet.categoryId || '';

            // 스튜디오 콘텐츠 필터
            if (isStudioContent(title, channelTitle, categoryId)) {
                continue;
            }

            titles.push(title); // 키워드 추출용

            const publishedAt = snippet.publishedAt || new Date().toISOString();
            const ageHours = getAgeHours(publishedAt);
            const viewCount = parseInt(statistics.viewCount || '0');

            videos.push({
                video_id: item.id,
                channel_id: snippet.channelId || '',
                title: title,
                published_at: publishedAt,
                duration_seconds: parseDuration(contentDetails.duration || 'PT0S'),
                category_id: categoryId,
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

    return { videos, stats, titles };
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

// ============ 설정 ============
const CONFIG = {
    // 수집 소스 설정
    mostPopularPages: 1,          // mostPopular 페이지 수
    keywordCount: 15,             // 추출할 키워드 수
    keywordMaxResults: 30,        // 키워드당 검색 결과 수
    relatedSeedCount: 10,         // 관련 영상 시드 수
    relatedMaxResults: 20,        // 시드당 관련 영상 수

    // 필터 설정
    minViews: 50000,              // 최소 조회수
    minPerformance: 0.5,          // 최소 구독자 대비 조회수 (50%)
    excludeMusic: true,           // 음악 카테고리 제외

    // 제한 설정
    shortsMaxPct: 0.15,           // 쇼츠 최대 비율 (15%)
    shortsCapPerDay: 10,          // 쇼츠 하루 최대 개수
    perChannelPerDay: 2,          // 채널당 하루 최대 개수
};

// ============ 메인 수집 프로세스 ============

/**
 * 전체 수집 프로세스 v2
 * 1. mostPopular (카테고리별)
 * 2. keyword search (트렌딩에서 키워드 추출)
 * 3. related videos (상위 영상 기반)
 * 4. 상세 정보 보강 + 필터링
 */
export async function collectHotVideos(): Promise<{
    videos: HotVideo[];
    stats: HotVideoDailyStats[];
    channels: HotChannel[];
}> {
    console.log('[HotCollector v2] Starting collection...');

    const allVideoIds = new Set<string>();
    const collectedTitles: string[] = [];

    // ========== 1단계: mostPopular 수집 ==========
    console.log('[HotCollector v2] Step 1: Collecting mostPopular...');

    // 전체 트렌딩
    const popularIds = await collectMostPopular(50);
    popularIds.forEach(id => allVideoIds.add(id));

    // 주요 카테고리별 수집 (음악 제외)
    const categories = ['15', '17', '19', '20', '22', '23', '24', '25', '26', '27', '28']; // 동물, 스포츠, 여행, 게임, 블로그, 코미디, 엔터, 뉴스, 노하우, 교육, 과학
    for (const catId of categories) {
        const catIds = await collectMostPopular(30, catId);
        catIds.forEach(id => allVideoIds.add(id));
    }

    console.log(`[HotCollector v2] mostPopular: ${allVideoIds.size} videos`);

    // 1단계 영상들의 상세 정보 (키워드 추출용)
    const firstBatch = await getVideoDetails([...allVideoIds]);
    collectedTitles.push(...firstBatch.titles);

    // ========== 2단계: 키워드 검색 ==========
    console.log('[HotCollector v2] Step 2: Keyword search...');
    const keywords = extractKeywords(collectedTitles, CONFIG.keywordCount);
    console.log(`[HotCollector v2] Extracted keywords: ${keywords.slice(0, 5).join(', ')}...`);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const kw of keywords) {
        const kwIds = await collectByKeyword(kw, oneDayAgo, CONFIG.keywordMaxResults);
        kwIds.forEach(id => allVideoIds.add(id));
    }

    console.log(`[HotCollector v2] After keyword search: ${allVideoIds.size} videos`);

    // ========== 3단계: 관련 영상 수집 ==========
    console.log('[HotCollector v2] Step 3: Related videos...');

    // 상위 조회수 영상에서 관련 영상 수집
    const topVideos = firstBatch.stats
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, CONFIG.relatedSeedCount);

    for (const video of topVideos) {
        const relatedIds = await collectRelated(video.video_id, CONFIG.relatedMaxResults);
        relatedIds.forEach(id => allVideoIds.add(id));
    }

    console.log(`[HotCollector v2] After related: ${allVideoIds.size} videos`);

    // ========== 4단계: 시간대별 검색 ==========
    console.log('[HotCollector v2] Step 4: Time-based search...');
    const intervals = [0, 6, 12, 18];

    for (const hoursAgo of intervals) {
        const before = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
        const after = new Date(before.getTime() - 6 * 60 * 60 * 1000);

        const searchIds = await collectBySearch(after, before, 50);
        searchIds.forEach(id => allVideoIds.add(id));
    }

    console.log(`[HotCollector v2] Total candidates: ${allVideoIds.size} videos`);

    // ========== 5단계: 전체 상세 정보 ==========
    console.log('[HotCollector v2] Step 5: Getting all video details...');
    const { videos, stats } = await getVideoDetails([...allVideoIds]);
    console.log(`[HotCollector v2] Got details for ${videos.length} videos (after studio filter)`);

    // ========== 6단계: 채널 정보 ==========
    console.log('[HotCollector v2] Step 6: Getting channel details...');
    const channelIds = videos.map(v => v.channel_id);
    const channels = await getChannelDetails(channelIds);
    console.log(`[HotCollector v2] Got details for ${channels.length} channels`);

    return { videos, stats, channels };
}
