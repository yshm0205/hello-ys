'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
    Box,
    Card,
    ThemeIcon,
    Popover,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import {
    Flame,
    TrendingUp,
    Eye,
    Clock,
    RefreshCw,
    Zap,
    Calendar as CalendarIcon,
    Loader2,
} from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';

dayjs.locale('ko');

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

interface DateInfo {
    date: string;
    count: number;
}

// 포맷팅 함수들
function formatViewCount(num: number): string {
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억회`;
    if (num >= 10000) return `${Math.floor(num / 10000)}만회`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}천회`;
    return `${num}회`;
}

function formatNumber(num: number): string {
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`;
    if (num >= 10000) return `${Math.floor(num / 10000)}만`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}천`;
    return num.toString();
}

function formatSubscriberCount(num: number): string {
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`;
    if (num >= 10000) return `${Math.floor(num / 10000)}만`;
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

function formatDateKR(dateStr: string): string {
    return dayjs(dateStr).format('M월 D일 (ddd)');
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
    const [allItems, setAllItems] = useState<HotListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // 날짜 관련 상태
    const [availableDates, setAvailableDates] = useState<DateInfo[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [datesLoading, setDatesLoading] = useState(true);
    const [calendarOpened, setCalendarOpened] = useState(false);

    // 필터 상태
    const [sortBy, setSortBy] = useState<string>('score');
    const [subsFilter, setSubsFilter] = useState<string>('all');
    const [perfFilter, setPerfFilter] = useState<string>('0');

    const limit = 20;
    const offsetRef = useRef(0);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // 수집된 날짜 Set (빠른 조회용)
    const availableDateSet = new Set(availableDates.map(d => d.date));

    // 날짜 목록 로드
    const fetchDates = useCallback(async () => {
        setDatesLoading(true);
        try {
            const res = await fetch('/api/hot-list/dates');
            const json = await res.json();
            if (json.dates && json.dates.length > 0) {
                setAvailableDates(json.dates);
                // 첫 번째 날짜를 기본값으로 설정
                if (!selectedDate) {
                    setSelectedDate(json.dates[0].date);
                }
            } else {
                // 날짜 데이터가 없으면 로딩 해제
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch dates:', error);
            setLoading(false);
        } finally {
            setDatesLoading(false);
        }
    }, [selectedDate]);

    // 핫 리스트 로드
    const fetchHotList = useCallback(async (reset: boolean = false) => {
        if (!selectedDate) return;

        if (reset) {
            setLoading(true);
            offsetRef.current = 0;
            setAllItems([]);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const selectedSubs = SUBS_FILTERS.find(f => f.value === subsFilter)!;

            const params = new URLSearchParams({
                sort: sortBy,
                limit: String(limit),
                offset: String(offsetRef.current),
                min_subs: String(selectedSubs.min),
                max_subs: String(selectedSubs.max),
                min_perf: perfFilter,
                date: selectedDate,
            });

            const res = await fetch(`/api/hot-list?${params}`);
            const json = await res.json();

            if (!json.stats) {
                json.stats = { avg_views: 0, avg_performance: 0, max_performance: 0, top_category: '-' };
            }

            if (reset) {
                setData(json);
                setAllItems(json.items || []);
            } else {
                setAllItems(prev => [...prev, ...(json.items || [])]);
            }

            // 더 가져올 데이터 있는지 확인
            if (!json.items || json.items.length < limit) {
                setHasMore(false);
            }

            offsetRef.current += limit;

        } catch (error) {
            console.error('Failed to fetch hot list:', error);
            if (reset) {
                setData({
                    date: selectedDate,
                    total: 0,
                    items: [],
                    stats: { avg_views: 0, avg_performance: 0, max_performance: 0, top_category: '-' }
                });
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [sortBy, subsFilter, perfFilter, selectedDate, limit]);

    // 초기 로드
    useEffect(() => {
        fetchDates();
    }, []);

    // 날짜 선택 또는 필터 변경 시 리셋
    useEffect(() => {
        if (selectedDate) {
            fetchHotList(true);
        }
    }, [selectedDate, sortBy, subsFilter, perfFilter]);

    // 무한 스크롤 설정
    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    fetchHotList(false);
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, loading, loadingMore, fetchHotList]);

    // 필터 변경 핸들러
    const handleFilterChange = (setter: any, value: any) => {
        setter(value);
    };

    // 달력에서 날짜 선택
    const handleDateChange = (value: string | null) => {
        if (value && availableDateSet.has(value)) {
            setSelectedDate(value);
            setCalendarOpened(false);
        }
    };

    // 수집된 날짜의 아이템 수 가져오기
    const getDateCount = (dateStr: string): number => {
        const found = availableDates.find(d => d.date === dateStr);
        return found?.count || 0;
    };

    // 날짜 로딩 중이거나 데이터 로딩 중
    if (datesLoading || (loading && allItems.length === 0 && selectedDate)) {
        return (
            <Container size="xl" py={50}>
                <Stack align="center" gap="xl">
                    <Loader size="xl" type="bars" />
                    <Text size="lg" fw={500}>핫 영상을 불러오는 중...</Text>
                </Stack>
            </Container>
        );
    }

    // 수집된 날짜가 없음 (데이터 자체가 없는 상태)
    if (!datesLoading && availableDates.length === 0) {
        return (
            <Container size="xl" py={50}>
                <Stack align="center" gap="xl">
                    <ThemeIcon size={64} radius="xl" color="gray" variant="light">
                        <Flame size={32} />
                    </ThemeIcon>
                    <div style={{ textAlign: 'center' }}>
                        <Title order={3} mb="xs">현재 핫 영상이 없습니다</Title>
                        <Text c="dimmed" size="md">
                            아직 수집된 핫 영상 데이터가 없어요.
                        </Text>
                        <Text c="dimmed" size="sm" mt={4}>
                            데이터가 수집되면 여기에 표시됩니다.
                        </Text>
                    </div>
                    <Button variant="light" leftSection={<RefreshCw size={16} />} onClick={() => fetchDates()}>
                        다시 확인
                    </Button>
                </Stack>
            </Container>
        );
    }

    return (
        <Container size="xl" py="lg">
            <Stack gap="xl">
                {/* 헤더 & 날짜 선택 영역 */}
                <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                        <Group gap="sm" align="center">
                            <ThemeIcon size={36} radius="md" color="red" variant="light">
                                <Flame size={22} />
                            </ThemeIcon>
                            <div>
                                <Title order={2}>핫 리스트</Title>
                                <Text c="dimmed" size="sm">
                                    총 {data?.total || allItems.length}개 발견
                                </Text>
                            </div>
                        </Group>

                        {/* 달력 선택 */}
                        <Group gap="sm">
                            <Popover
                                opened={calendarOpened}
                                onChange={setCalendarOpened}
                                position="bottom-end"
                                shadow="md"
                            >
                                <Popover.Target>
                                    <Button
                                        variant="light"
                                        leftSection={<CalendarIcon size={16} />}
                                        onClick={() => setCalendarOpened((o) => !o)}
                                        loading={datesLoading}
                                    >
                                        {selectedDate ? formatDateKR(selectedDate) : '날짜 선택'}
                                    </Button>
                                </Popover.Target>
                                <Popover.Dropdown p="xs">
                                    <Stack gap="xs">
                                        <Text size="sm" fw={500} c="dimmed" ta="center">
                                            🔥 수집된 날짜만 선택 가능
                                        </Text>
                                        <DatePicker
                                            value={selectedDate}
                                            onChange={handleDateChange}
                                            locale="ko"
                                            maxDate={new Date()}
                                            getDayProps={(date) => {
                                                const dateStr = dayjs(date).format('YYYY-MM-DD');
                                                const isAvailable = availableDateSet.has(dateStr);
                                                const count = getDateCount(dateStr);

                                                return {
                                                    disabled: !isAvailable,
                                                    style: {
                                                        backgroundColor: isAvailable ? 'var(--mantine-color-red-light)' : undefined,
                                                        fontWeight: isAvailable ? 700 : 400,
                                                    },
                                                    title: isAvailable ? `${count}개 영상` : '데이터 없음',
                                                };
                                            }}
                                        />
                                        {availableDates.length > 0 && (
                                            <Text size="xs" c="dimmed" ta="center">
                                                🔴 빨간 배경 = 데이터 있음
                                            </Text>
                                        )}
                                    </Stack>
                                </Popover.Dropdown>
                            </Popover>

                            <Button
                                variant="subtle"
                                color="gray"
                                size="sm"
                                leftSection={<RefreshCw size={14} />}
                                onClick={() => fetchHotList(true)}
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

                {/* 메인 콘텐츠: 카드 그리드 (스크롤) */}
                {allItems.length === 0 && !loading ? (
                    <Paper p={50} radius="md" withBorder style={{ textAlign: 'center' }}>
                        <Text c="dimmed" size="lg">조건에 맞는 영상이 없어요 😢</Text>
                        <Text c="dimmed" size="sm" mt="sm">필터 조건을 조금 완화해보세요!</Text>
                        <Button mt="md" variant="light" onClick={() => {
                            setSubsFilter('all');
                            setPerfFilter('0');
                        }}>필터 초기화</Button>
                    </Paper>
                ) : (
                    <>
                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="lg">
                            {allItems.map((item, index) => (
                                <Card key={`${item.video_id}-${index}`} radius="md" withBorder p={0} style={{ overflow: 'hidden', height: '100%' }}>
                                    {/* 썸네일 영역 */}
                                    <Box pos="relative" style={{ aspectRatio: '16/9' }}>
                                        <Image
                                            src={`https://i.ytimg.com/vi/${item.video_id}/mqdefault.jpg`}
                                            alt={item.video?.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            fallbackSrc="https://placehold.co/320x180/1a1a1a/666?text=No+Preview"
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
                                                rel="noopener noreferrer"
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
                                                    {formatViewCount(item.view_count)}
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

                        {/* 무한 스크롤 로딩 트리거 */}
                        <div ref={loadMoreRef} style={{ height: 60, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {loadingMore && (
                                <Group gap="sm">
                                    <Loader2 size={20} className="animate-spin" />
                                    <Text size="sm" c="dimmed">더 불러오는 중...</Text>
                                </Group>
                            )}
                            {!hasMore && allItems.length > 0 && (
                                <Text size="sm" c="dimmed">모든 영상을 불러왔어요 🎉</Text>
                            )}
                        </div>
                    </>
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
