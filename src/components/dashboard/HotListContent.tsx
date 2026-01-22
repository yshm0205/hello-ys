'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    Table,
    Image,
    Button,
    Select,
    Loader,
    Paper,
    SimpleGrid,
    ActionIcon,
    Tooltip,
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

// 숫자 포맷
function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

// 시간 포맷
function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 상대 시간
function getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
}

// 순위 뱃지
function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) return <Badge size="lg" color="yellow" leftSection="🥇">1위</Badge>;
    if (rank === 2) return <Badge size="lg" color="gray" leftSection="🥈">2위</Badge>;
    if (rank === 3) return <Badge size="lg" color="orange" leftSection="🥉">3위</Badge>;
    return <Badge size="lg" variant="outline">{rank}위</Badge>;
}

export function HotListContent() {
    const [data, setData] = useState<HotListData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<string>('score');
    const [page, setPage] = useState(0);
    const limit = 20;

    const fetchHotList = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                sort: sortBy,
                limit: String(limit),
                offset: String(page * limit),
            });
            const res = await fetch(`/api/hot-list?${params}`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error('Failed to fetch hot list:', error);
        } finally {
            setLoading(false);
        }
    }, [sortBy, page, limit]);

    useEffect(() => {
        fetchHotList();
    }, [fetchHotList]);

    if (loading && !data) {
        return (
            <Container size="xl" py="xl">
                <Stack align="center" gap="md">
                    <Loader size="lg" />
                    <Text c="dimmed">핫 리스트 로딩 중...</Text>
                </Stack>
            </Container>
        );
    }

    return (
        <Container size="xl" py="md">
            <Stack gap="lg">
                {/* 헤더 */}
                <Group justify="space-between" align="flex-end">
                    <div>
                        <Group gap="sm" align="center">
                            <Flame size={28} color="var(--mantine-color-red-6)" />
                            <Title order={2}>오늘의 핫 리스트</Title>
                        </Group>
                        <Text c="dimmed" size="sm" mt={4}>
                            {data?.date} • 총 {data?.total || 0}개 영상
                        </Text>
                    </div>
                    <Group gap="sm">
                        <Select
                            size="sm"
                            value={sortBy}
                            onChange={(v) => v && setSortBy(v)}
                            data={[
                                { value: 'score', label: '🏆 종합 점수순' },
                                { value: 'velocity', label: '🚀 속도순' },
                                { value: 'performance', label: '📈 구독대비순' },
                                { value: 'views', label: '👁️ 조회수순' },
                            ]}
                            w={150}
                        />
                        <Button
                            variant="light"
                            size="sm"
                            leftSection={<RefreshCw size={16} />}
                            onClick={fetchHotList}
                            loading={loading}
                        >
                            새로고침
                        </Button>
                    </Group>
                </Group>

                {/* 통계 카드 */}
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                    <Paper p="md" radius="md" withBorder>
                        <Group gap="xs">
                            <Eye size={20} color="var(--mantine-color-blue-6)" />
                            <Text size="sm" c="dimmed">평균 조회수</Text>
                        </Group>
                        <Text size="xl" fw={700} mt={4}>
                            {formatNumber(data?.stats.avg_views || 0)}
                        </Text>
                    </Paper>
                    <Paper p="md" radius="md" withBorder>
                        <Group gap="xs">
                            <TrendingUp size={20} color="var(--mantine-color-green-6)" />
                            <Text size="sm" c="dimmed">평균 구독대비</Text>
                        </Group>
                        <Text size="xl" fw={700} mt={4}>
                            {(data?.stats.avg_performance || 0).toFixed(1)}%
                        </Text>
                    </Paper>
                    <Paper p="md" radius="md" withBorder>
                        <Group gap="xs">
                            <Zap size={20} color="var(--mantine-color-yellow-6)" />
                            <Text size="sm" c="dimmed">최고 구독대비</Text>
                        </Group>
                        <Text size="xl" fw={700} mt={4}>
                            {(data?.stats.max_performance || 0).toFixed(0)}%
                        </Text>
                    </Paper>
                    <Paper p="md" radius="md" withBorder>
                        <Group gap="xs">
                            <Award size={20} color="var(--mantine-color-violet-6)" />
                            <Text size="sm" c="dimmed">인기 카테고리</Text>
                        </Group>
                        <Text size="xl" fw={700} mt={4}>
                            {data?.stats.top_category || '-'}
                        </Text>
                    </Paper>
                </SimpleGrid>

                {/* 영상 리스트 */}
                <Paper withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th w={60}>순위</Table.Th>
                                <Table.Th>영상</Table.Th>
                                <Table.Th w={100}>조회수</Table.Th>
                                <Table.Th w={100}>구독대비</Table.Th>
                                <Table.Th w={100}>속도</Table.Th>
                                <Table.Th w={80}>점수</Table.Th>
                                <Table.Th w={50}></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {(data?.items || []).map((item) => (
                                <Table.Tr key={item.video_id}>
                                    <Table.Td>
                                        <RankBadge rank={item.rank} />
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="sm" wrap="nowrap">
                                            <Image
                                                src={item.video?.thumbnail_url}
                                                alt={item.video?.title}
                                                w={120}
                                                h={68}
                                                radius="sm"
                                                fallbackSrc="https://placehold.co/120x68?text=No+Image"
                                            />
                                            <Stack gap={4}>
                                                <Text size="sm" fw={500} lineClamp={2}>
                                                    {item.video?.title || '제목 없음'}
                                                </Text>
                                                <Group gap="xs">
                                                    <Text size="xs" c="dimmed">
                                                        {item.channel?.title || '채널 없음'}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">•</Text>
                                                    <Text size="xs" c="dimmed">
                                                        <Users size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                                        {formatNumber(item.subscriber_count)}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">•</Text>
                                                    <Text size="xs" c="dimmed">
                                                        <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                                        {getRelativeTime(item.video?.published_at || '')}
                                                    </Text>
                                                </Group>
                                                <Group gap={4}>
                                                    {item.reason_flags?.slice(0, 2).map((flag) => (
                                                        <Badge key={flag} size="xs" variant="light">
                                                            {flag === 'HIGH_CONTRIBUTION' && '🎯 채널 히트'}
                                                            {flag === 'HIGH_PERFORMANCE' && '🚀 구독폭발'}
                                                            {flag === 'VIRAL_VELOCITY' && '⚡ 급상승'}
                                                            {flag === 'HIGH_ENGAGEMENT' && '💬 참여 높음'}
                                                        </Badge>
                                                    ))}
                                                    <Badge size="xs" variant="outline">
                                                        {item.category_name || '기타'}
                                                    </Badge>
                                                </Group>
                                            </Stack>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text fw={600}>{formatNumber(item.view_count)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            <Text fw={600} c={item.performance_rate > 100 ? 'green' : undefined}>
                                                {item.performance_rate.toFixed(0)}%
                                            </Text>
                                            {item.performance_rate > 200 && (
                                                <TrendingUp size={14} color="var(--mantine-color-green-6)" />
                                            )}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{formatNumber(Math.round(item.view_velocity))}/h</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color="blue" size="lg">
                                            {item.score.toFixed(1)}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Tooltip label="YouTube에서 보기">
                                            <ActionIcon
                                                variant="subtle"
                                                component="a"
                                                href={`https://www.youtube.com/watch?v=${item.video_id}`}
                                                target="_blank"
                                            >
                                                <ExternalLink size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Paper>

                {/* 페이지네이션 */}
                <Group justify="center" gap="md">
                    <Button
                        variant="light"
                        size="sm"
                        leftSection={<ChevronLeft size={16} />}
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                    >
                        이전
                    </Button>
                    <Text size="sm" c="dimmed">
                        {page * limit + 1} - {Math.min((page + 1) * limit, data?.total || 0)} / {data?.total || 0}
                    </Text>
                    <Button
                        variant="light"
                        size="sm"
                        rightSection={<ChevronRight size={16} />}
                        disabled={(page + 1) * limit >= (data?.total || 0)}
                        onClick={() => setPage(p => p + 1)}
                    >
                        다음
                    </Button>
                </Group>

                {/* 정보 */}
                <Paper p="md" radius="md" bg="gray.0">
                    <Text size="sm" c="dimmed">
                        💡 <strong>핫 리스트란?</strong> 조회수 5만 이상 + 채널 평균 초과 + 구독자 대비 높은 성과를 보이는 영상을 자동 수집합니다.
                        매일 00:10에 업데이트되며, 전날 리스트에 포함된 영상은 하루 쿨다운됩니다.
                    </Text>
                </Paper>
            </Stack>
        </Container>
    );
}
