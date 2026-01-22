'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    Image,
    Button,
    Select,
    Loader,
    Paper,
    SimpleGrid,
    ActionIcon,
    Tooltip,
    SegmentedControl,
    Box,
    Card,
    ThemeIcon,
    Overlay,
} from '@mantine/core';
import {
    Flame,
    TrendingUp,
    Users,
    Eye,
    Clock,
    RefreshCw,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Zap,
    Award,
    Filter,
    Youtube
} from 'lucide-react';

interface HotListItem {
    video_id: string;
    rank: number;
    view_count: number;
    subscriber_count: number;
    contribution_rate: number;
    performance_rate: number;
    view_velocity: number;
    engagement_rate: number;
    score: number;
    reason_flags: string[];
    video?: {
        title: string;
        thumbnail_url: string;
        published_at: string;
        duration_seconds: number;
        category_id: string;
    };
    channel?: {
        title: string;
        thumbnail_url: string;
        subscriber_count: number;
    };
    category_name?: string;
}

interface HotListData {
    date: string;
    total: number;
    items: HotListItem[];
    stats: {
        avg_views: number;
        avg_performance: number;
        max_performance: number;
        top_category: string;
    };
}

// 포맷팅 함수들
function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

function formatSubscriberCount(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}만`;
    if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}천`;
    return num.toString();
}

function getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    const weeks = Math.floor(days / 7);
    return `${weeks}주 전`;
}

// 구독자 필터 옵션
const SUBS_FILTERS = [
    { label: '전체 채널', value: 'all', min: 0, max: 0 },
    { label: '🔥 급성장 (1만~10만)', value: 'growth', min: 10000, max: 100000 },
    { label: '🚀 중견 (10만~50만)', value: 'mid', min: 100000, max: 500000 },
    { label: '👑 대형 (50만+)', value: 'large', min: 500000, max: 0 },
    { label: '🌱 새싹 (~1만)', value: 'seed', min: 0, max: 10000 },
];

// 성과 필터 옵션
const PERF_FILTERS = [
    { label: '전체 성과', value: '0' },
    { label: '⚡ 2배 터짐 (200%+)', value: '200' },
    { label: '🔥 5배 터짐 (500%+)', value: '500' },
    { label: '💎 10배 대박 (1000%+)', value: '1000' },
];

export function HotListContent() {
    const [data, setData] = useState<HotListData | null>(null);
    const [loading, setLoading] = useState(true);

    // 필터 상태
    const [sortBy, setSortBy] = useState<string>('score');
    const [subsFilter, setSubsFilter] = useState<string>('all');
    const [perfFilter, setPerfFilter] = useState<string>('0');
    const [page, setPage] = useState(0);
    const limit = 20;

    const fetchHotList = useCallback(async () => {
        setLoading(true);
        try {
            const selectedSubs = SUBS_FILTERS.find(f => f.value === subsFilter)!;

            const params = new URLSearchParams({
                sort: sortBy,
                limit: String(limit),
                offset: String(page * limit),
                min_subs: String(selectedSubs.min),
                max_subs: String(selectedSubs.max),
                min_perf: perfFilter,
            });

            const res = await fetch(`/api/hot-list?${params}`);
            const json = await res.json();

            if (!json.stats) {
                json.stats = { avg_views: 0, avg_performance: 0, max_performance: 0, top_category: '-' };
            }
            setData(json);
        } catch (error) {
            console.error('Failed to fetch hot list:', error);
            setData({
                date: new Date().toISOString().split('T')[0],
                total: 0,
                items: [],
                stats: { avg_views: 0, avg_performance: 0, max_performance: 0, top_category: '-' }
            });
        } finally {
            setLoading(false);
        }
    }, [sortBy, page, limit, subsFilter, perfFilter]);

    useEffect(() => {
        fetchHotList();
    }, [fetchHotList]);

    // 필터 변경 시 페이지 리셋
    const handleFilterChange = (setter: any, value: any) => {
        setter(value);
        setPage(0);
    };

    if (loading && !data) {
        return (
            <Container size="xl" py={50}>
                <Stack align="center" gap="xl">
                    <Loader size="xl" type="bars" />
                    <Text size="lg" fw={500}>오늘의 떡상 영상을 찾고 있어요...</Text>
                </Stack>
            </Container>
        );
    }

    return (
        <Container size="xl" py="lg">
            <Stack gap="xl">
                {/* 헤더 & 필터 영역 */}
                <Stack gap="md">
                    <Group justify="space-between" align="flex-end">
                        <Group gap="sm" align="center">
                            <ThemeIcon size={36} radius="md" color="red" variant="light">
                                <Flame size={22} />
                            </ThemeIcon>
                            <div>
                                <Title order={2}>오늘의 핫 리스트</Title>
                                <Text c="dimmed" size="sm">
                                    {data?.date} 기준 • 총 {data?.total || 0}개 발견
                                </Text>
                            </div>
                        </Group>
                        <Group>
                            <Button
                                variant="subtle"
                                color="gray"
                                size="sm"
                                leftSection={<RefreshCw size={14} />}
                                onClick={() => fetchHotList()}
                                loading={loading}
                            >
                                새로고침
                            </Button>
                        </Group>
                    </Group>

                    {/* 필터 바 */}
                    <Paper p="md" radius="md" withBorder>
                        <Group justify="space-between" align="center">
                            <Group gap="md">
                                <Select
                                    label="채널 체급"
                                    description="벤치마크할 채널 규모"
                                    value={subsFilter}
                                    onChange={(v) => v && handleFilterChange(setSubsFilter, v)}
                                    data={SUBS_FILTERS}
                                    w={200}
                                    allowDeselect={false}
                                />
                                <Select
                                    label="성과 (구독자 대비)"
                                    description="얼마나 터졌는지"
                                    value={perfFilter}
                                    onChange={(v) => v && handleFilterChange(setPerfFilter, v)}
                                    data={PERF_FILTERS}
                                    w={180}
                                    allowDeselect={false}
                                />
                            </Group>

                            <Select
                                label="정렬 기준"
                                description="무엇을 우선으로 볼까요?"
                                value={sortBy}
                                onChange={(v) => v && handleFilterChange(setSortBy, v)}
                                data={[
                                    { value: 'score', label: '🏆 종합 점수순' },
                                    { value: 'performance', label: '📈 구독대비 효율순' },
                                    { value: 'velocity', label: '🚀 조회수 급상승순' },
                                    { value: 'views', label: '👁️ 전체 조회수순' },
                                ]}
                                w={180}
                                allowDeselect={false}
                            />
                        </Group>
                    </Paper>
                </Stack>

                {/* 메인 콘텐츠: 카드 그리드 */}
                {data?.items.length === 0 ? (
                    <Paper p={50} radius="md" withBorder style={{ textAlign: 'center' }}>
                        <Text c="dimmed" size="lg">조건에 맞는 영상이 없어요 😢</Text>
                        <Text c="dimmed" size="sm" mt="sm">필터 조건을 조금 완화해보세요!</Text>
                        <Button mt="md" variant="light" onClick={() => {
                            setSubsFilter('all');
                            setPerfFilter('0');
                        }}>필터 초기화</Button>
                    </Paper>
                ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="lg">
                        {data?.items.map((item) => (
                            <Card key={item.video_id} radius="md" withBorder p={0} style={{ overflow: 'hidden', height: '100%' }}>
                                {/* 썸네일 영역 */}
                                <Box pos="relative" style={{ aspectRatio: '16/9' }}>
                                    <Image
                                        src={item.video?.thumbnail_url.replace('default', 'mqdefault')}
                                        alt={item.video?.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        fallbackSrc="https://placehold.co/600x400?text=No+Preview"
                                    />
                                    {/* 썸네일 위 뱃지들 */}
                                    <Badge
                                        pos="absolute"
                                        top={8}
                                        left={8}
                                        size="lg"
                                        variant="filled"
                                        color="dark"
                                        style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                                    >
                                        #{item.rank}
                                    </Badge>
                                    <Badge
                                        pos="absolute"
                                        bottom={8}
                                        right={8}
                                        size="sm"
                                        variant="filled"
                                        color="dark"
                                        style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
                                    >
                                        {formatDuration(item.video?.duration_seconds || 0)}
                                    </Badge>
                                </Box>

                                {/* 콘텐츠 영역 */}
                                <Stack p="md" gap="sm" justify="space-between" style={{ flex: 1 }}>
                                    <Stack gap="xs">
                                        {/* 성과 배지 */}
                                        <Group gap="xs">
                                            <Badge variant="light" color="red" leftSection={<TrendingUp size={12} />}>
                                                구독 대비 {(item.performance_rate).toFixed(0)}%
                                            </Badge>
                                            {item.view_velocity > 1000 && (
                                                <Badge variant="light" color="blue" leftSection={<Zap size={12} />}>
                                                    +{formatNumber(item.view_velocity)}/h
                                                </Badge>
                                            )}
                                        </Group>

                                        {/* 제목 (링크) */}
                                        <Text
                                            fw={600}
                                            lineClamp={2}
                                            component="a"
                                            href={`https://www.youtube.com/watch?v=${item.video_id}`}
                                            target="_blank"
                                            style={{ cursor: 'pointer', lineHeight: 1.4, minHeight: '2.8em' }}
                                            c="dark"
                                        >
                                            {item.video?.title}
                                        </Text>

                                        {/* 채널 정보 */}
                                        <Group gap="xs">
                                            <Image
                                                src={item.channel?.thumbnail_url}
                                                w={24} h={24}
                                                radius="xl"
                                                alt=""
                                            />
                                            <Text size="sm" c="dimmed" lineClamp={1} style={{ flex: 1 }}>
                                                {item.channel?.title}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                구독 {formatSubscriberCount(item.subscriber_count)}
                                            </Text>
                                        </Group>
                                    </Stack>

                                    {/* 하단 지표 */}
                                    <Group justify="space-between" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                                        <Group gap={4}>
                                            <Eye size={14} color="gray" />
                                            <Text size="sm" fw={500}>
                                                {formatNumber(item.view_count)}
                                            </Text>
                                        </Group>
                                        <Group gap={4}>
                                            <Clock size={14} color="gray" />
                                            <Text size="xs" c="dimmed">
                                                {getRelativeTime(item.video?.published_at || '')}
                                            </Text>
                                        </Group>
                                    </Group>
                                </Stack>
                            </Card>
                        ))}
                    </SimpleGrid>
                )}

                {/* 페이지네이션 */}
                {data?.total && data.total > limit && (
                    <Group justify="center" pt="md">
                        <Button
                            variant="default"
                            leftSection={<ChevronLeft size={16} />}
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                        >
                            이전
                        </Button>
                        <Text size="sm" c="dimmed">
                            {page + 1} / {Math.ceil(data.total / limit)}
                        </Text>
                        <Button
                            variant="default"
                            rightSection={<ChevronRight size={16} />}
                            disabled={(page + 1) * limit >= data.total}
                            onClick={() => setPage(p => p + 1)}
                        >
                            다음
                        </Button>
                    </Group>
                )}
            </Stack>
        </Container>
    );
}

// 헬퍼 함수
function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
        const hours = Math.floor(mins / 60);
        return `${hours}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
