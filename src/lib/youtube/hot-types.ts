/**
 * 🔥 핫 리스트 타입 정의
 */

// 채널 정보
export interface HotChannel {
    channel_id: string;
    title: string;
    thumbnail_url?: string;
    subscriber_count: number;
    video_count: number;
    total_view_count: number;
    avg_view_count: number;
    updated_at?: string;
}

// 영상 기본 정보
export interface HotVideo {
    video_id: string;
    channel_id: string;
    title: string;
    published_at: string;
    duration_seconds: number;
    category_id: string;
    thumbnail_url: string;
}

// 일별 영상 통계
export interface HotVideoDailyStats {
    video_id: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    age_hours: number;
    velocity: number;
}

// 영상 스냅샷 (activeRate 계산용)
export interface VideoSnapshot {
    id?: string;
    video_id: string;
    date: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    created_at?: string;
}

// 핫 리스트 아이템
export interface HotListItem {
    id?: string;
    date: string;
    video_id: string;
    rank: number;
    view_count: number;
    subscriber_count: number;
    avg_channel_views: number;
    contribution_rate: number;
    performance_rate: number;
    view_velocity: number;
    engagement_rate: number;
    score: number;
    reason_flags: string[];
    // 조인된 데이터
    video?: HotVideo;
    channel?: HotChannel;
}

// API 응답
export interface HotListResponse {
    date: string;
    total: number;
    items: HotListItem[];
    stats: {
        avg_views: number;
        avg_performance: number;
        top_category: string;
        max_performance: number;
    };
}

// 필터 설정
export interface HotListFilters {
    minViews: number;
    minContribution: number;
    minPerformance: number;
    excludeLive: boolean;
    cooldownDays: number;
}

// 기본 필터 (뷰트랩 패턴)
export const DEFAULT_FILTERS: HotListFilters = {
    minViews: 50000,
    minContribution: 9.09,    // 채널 평균 이상
    minPerformance: 7.14,     // 구독자 대비 0.5x 이상
    excludeLive: true,
    cooldownDays: 1,
};

// 지표 계산 상수
export const METRICS_CONSTANTS = {
    CONTRIBUTION_MULTIPLIER: 9.09,
    PERFORMANCE_MULTIPLIER: 14.285,
    VELOCITY_OFFSET: 2,        // viewCount / (ageHours + 2)
    COMMENT_WEIGHT: 4,         // engagement = (likes + 4*comments) / views
};

// YouTube API 카테고리 (한국)
export const KR_VIDEO_CATEGORIES = {
    '1': '영화/애니메이션',
    '2': '자동차',
    '10': '음악',
    '15': '동물',
    '17': '스포츠',
    '20': '게임',
    '22': '인물/블로그',
    '23': '코미디',
    '24': '엔터테인먼트',
    '25': '뉴스/정치',
    '26': '노하우/스타일',
    '27': '교육',
    '28': '과학기술',
};
