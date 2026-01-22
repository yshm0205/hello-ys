/**
 * 🔥 핫 리스트 지표 계산기
 * - 뷰트랩 패턴 근사 지표 계산
 * - 필터링 및 순위 매기기
 * - 쿨다운 적용
 */

import {
    HotVideo,
    HotChannel,
    HotVideoDailyStats,
    HotListItem,
    DEFAULT_FILTERS,
    METRICS_CONSTANTS,
    HotListFilters
} from './hot-types';

/**
 * 지표 계산
 */
export function calculateMetrics(
    video: HotVideo,
    stats: HotVideoDailyStats,
    channel: HotChannel
): {
    contributionRate: number;
    performanceRate: number;
    viewVelocity: number;
    engagementRate: number;
    score: number;
    reasonFlags: string[];
} {
    const { view_count, like_count, comment_count, age_hours } = stats;
    const { subscriber_count, avg_view_count } = channel;

    // 뷰트랩 패턴 지표
    // contributionRate = (viewCount / avgViewCount) * 9.09
    const contributionRate = avg_view_count > 0
        ? (view_count / avg_view_count) * METRICS_CONSTANTS.CONTRIBUTION_MULTIPLIER
        : 0;

    // performanceRate = (viewCount / subscriberCount) * 14.285
    const performanceRate = subscriber_count > 0
        ? (view_count / subscriber_count) * METRICS_CONSTANTS.PERFORMANCE_MULTIPLIER
        : 0;

    // viewVelocity = viewCount / (ageHours + 2)
    const viewVelocity = view_count / (age_hours + METRICS_CONSTANTS.VELOCITY_OFFSET);

    // engagement = (likes + 4*comments) / viewCount
    const engagementRate = view_count > 0
        ? (like_count + METRICS_CONSTANTS.COMMENT_WEIGHT * comment_count) / view_count
        : 0;

    // 종합 점수 (가중 평균)
    const score = (
        contributionRate * 0.3 +
        performanceRate * 0.3 +
        viewVelocity * 0.0001 +  // 스케일 조정
        engagementRate * 100 * 0.1
    );

    // 선정 이유 플래그
    const reasonFlags: string[] = [];
    if (contributionRate >= DEFAULT_FILTERS.minContribution) {
        reasonFlags.push('HIGH_CONTRIBUTION');
    }
    if (performanceRate >= DEFAULT_FILTERS.minPerformance) {
        reasonFlags.push('HIGH_PERFORMANCE');
    }
    if (viewVelocity > 10000) {
        reasonFlags.push('VIRAL_VELOCITY');
    }
    if (engagementRate > 0.05) {
        reasonFlags.push('HIGH_ENGAGEMENT');
    }

    return {
        contributionRate,
        performanceRate,
        viewVelocity,
        engagementRate,
        score,
        reasonFlags,
    };
}

/**
 * 필터 적용 (뷰트랩 패턴)
 */
export function applyFilters(
    stats: HotVideoDailyStats,
    metrics: ReturnType<typeof calculateMetrics>,
    filters: HotListFilters = DEFAULT_FILTERS
): boolean {
    // 최소 조회수
    if (stats.view_count < filters.minViews) {
        return false;
    }

    // 채널 평균 대비 (contributionRate >= 9.09)
    if (metrics.contributionRate < filters.minContribution) {
        return false;
    }

    // 구독자 대비 (performanceRate >= 7.14 = 0.5x)
    if (metrics.performanceRate < filters.minPerformance) {
        return false;
    }

    return true;
}

/**
 * 쿨다운 적용 (전날 리스트 제외)
 */
export function applyCooldown(
    videoIds: string[],
    previousListIds: Set<string>
): string[] {
    return videoIds.filter(id => !previousListIds.has(id));
}

/**
 * 핫 리스트 생성
 */
export function generateHotList(
    videos: HotVideo[],
    allStats: HotVideoDailyStats[],
    channels: HotChannel[],
    previousListIds: Set<string> = new Set(),
    filters: HotListFilters = DEFAULT_FILTERS
): HotListItem[] {
    // 채널 맵 생성
    const channelMap = new Map<string, HotChannel>();
    for (const channel of channels) {
        channelMap.set(channel.channel_id, channel);
    }

    // 통계 맵 생성
    const statsMap = new Map<string, HotVideoDailyStats>();
    for (const stat of allStats) {
        statsMap.set(stat.video_id, stat);
    }

    const results: HotListItem[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const video of videos) {
        const stats = statsMap.get(video.video_id);
        const channel = channelMap.get(video.channel_id);

        if (!stats || !channel) continue;

        // 쿨다운 체크
        if (previousListIds.has(video.video_id)) continue;

        // 지표 계산
        const metrics = calculateMetrics(video, stats, channel);

        // 필터 적용
        if (!applyFilters(stats, metrics, filters)) continue;

        results.push({
            date: today,
            video_id: video.video_id,
            rank: 0, // 나중에 설정
            view_count: stats.view_count,
            subscriber_count: channel.subscriber_count,
            avg_channel_views: channel.avg_view_count,
            contribution_rate: metrics.contributionRate,
            performance_rate: metrics.performanceRate,
            view_velocity: metrics.viewVelocity,
            engagement_rate: metrics.engagementRate,
            score: metrics.score,
            reason_flags: metrics.reasonFlags,
            video,
            channel,
        });
    }

    // 점수순 정렬 + 순위 부여
    results.sort((a, b) => b.score - a.score);
    results.forEach((item, index) => {
        item.rank = index + 1;
    });

    console.log(`[HotCalculator] Generated ${results.length} hot items`);

    return results;
}

/**
 * 통계 요약 생성
 */
export function generateStats(items: HotListItem[]): {
    avg_views: number;
    avg_performance: number;
    top_category: string;
    max_performance: number;
} {
    if (items.length === 0) {
        return {
            avg_views: 0,
            avg_performance: 0,
            top_category: 'N/A',
            max_performance: 0,
        };
    }

    const totalViews = items.reduce((sum, item) => sum + item.view_count, 0);
    const totalPerformance = items.reduce((sum, item) => sum + item.performance_rate, 0);

    // 카테고리별 카운트
    const categoryCount = new Map<string, number>();
    for (const item of items) {
        const cat = item.video?.category_id || 'unknown';
        categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
    }

    let topCategory = 'unknown';
    let maxCount = 0;
    for (const [cat, count] of categoryCount) {
        if (count > maxCount) {
            maxCount = count;
            topCategory = cat;
        }
    }

    return {
        avg_views: Math.round(totalViews / items.length),
        avg_performance: totalPerformance / items.length,
        top_category: topCategory,
        max_performance: Math.max(...items.map(i => i.performance_rate)),
    };
}
